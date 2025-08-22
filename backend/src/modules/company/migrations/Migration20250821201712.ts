import { Migration } from "@mikro-orm/migrations";

export class Migration20250821201712 extends Migration {
  async up(): Promise<void> {
    // RLS実装用のマイグレーション
    // このファイルにRLSポリシーを追加していきます
    
    // =====================================================
    // 1. RLS用のヘルパー関数を作成
    // =====================================================
    
    // 現在のユーザーのメタデータを取得する関数
    this.addSql(`
      CREATE OR REPLACE FUNCTION get_current_user_metadata()
      RETURNS jsonb AS $$
      DECLARE
        user_email text;
        metadata jsonb;
      BEGIN
        -- current_settingから現在のユーザーEmailを取得
        user_email := current_setting('app.current_user_email', true);
        
        IF user_email IS NULL OR user_email = '' THEN
          RETURN '{}'::jsonb;
        END IF;
        
        -- provider_identityテーブルからuser_metadataを取得
        SELECT user_metadata INTO metadata
        FROM provider_identity
        WHERE entity_id = user_email
        AND provider = 'emailpass'
        LIMIT 1;
        
        RETURN COALESCE(metadata, '{}'::jsonb);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 現在のユーザーのロールを取得する関数
    this.addSql(`
      CREATE OR REPLACE FUNCTION get_current_user_role()
      RETURNS text AS $$
      DECLARE
        metadata jsonb;
      BEGIN
        metadata := get_current_user_metadata();
        RETURN COALESCE(metadata->>'role', 'employee_user');
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // 現在のユーザーの会社IDを取得する関数
    this.addSql(`
      CREATE OR REPLACE FUNCTION get_current_user_company_id()
      RETURNS text AS $$
      DECLARE
        metadata jsonb;
      BEGIN
        metadata := get_current_user_metadata();
        RETURN metadata->>'company_id';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // TODO: 次のステップでRLSポリシーを追加
    // - companyテーブル
    // - employeeテーブル
    // - quoteテーブル
    // - その他のテーブル
  }

  async down(): Promise<void> {
    // ヘルパー関数を削除
    this.addSql('DROP FUNCTION IF EXISTS get_current_user_company_id();');
    this.addSql('DROP FUNCTION IF EXISTS get_current_user_role();');
    this.addSql('DROP FUNCTION IF EXISTS get_current_user_metadata();');
  }
}