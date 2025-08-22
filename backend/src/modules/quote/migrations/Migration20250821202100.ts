import { Migration } from "@mikro-orm/migrations";

export class Migration20250821202100 extends Migration {
  async up(): Promise<void> {
    // =====================================================
    // Quote関連テーブル用のRLSポリシー
    // =====================================================
    
    // Quoteテーブル
    this.addSql('ALTER TABLE quote ENABLE ROW LEVEL SECURITY;');
    
    // Platform Adminは全てのQuoteにアクセス可能
    this.addSql(`
      CREATE POLICY quote_platform_admin_policy ON quote
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    // Company Admin/Store Adminは自社関連のQuoteのみアクセス可能
    this.addSql(`
      CREATE POLICY quote_company_access_policy ON quote
      FOR ALL
      USING (
        get_current_user_role() IN ('company_admin', 'store_admin')
        AND EXISTS (
          SELECT 1 FROM customer c
          JOIN company_employee_customer_customer ec ON c.id = ec.customer_id
          JOIN employee e ON ec.employee_id = e.id
          WHERE c.id = quote.customer_id
          AND e.company_id = get_current_user_company_id()
        )
      );
    `);
    
    // Employee Userは自分のQuoteのみアクセス可能
    this.addSql(`
      CREATE POLICY quote_employee_policy ON quote
      FOR ALL
      USING (
        get_current_user_role() = 'employee_user'
        AND customer_id IN (
          SELECT id FROM customer
          WHERE email = current_setting('app.current_user_email', true)
        )
      );
    `);

    // =====================================================
    // Messageテーブル用のRLSポリシー
    // =====================================================
    
    this.addSql('ALTER TABLE message ENABLE ROW LEVEL SECURITY;');
    
    // Platform Adminは全てのMessageにアクセス可能
    this.addSql(`
      CREATE POLICY message_platform_admin_policy ON message
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    // Company Admin/Store Adminは自社関連のメッセージのみアクセス可能
    this.addSql(`
      CREATE POLICY message_company_access_policy ON message
      FOR ALL
      USING (
        get_current_user_role() IN ('company_admin', 'store_admin')
        AND EXISTS (
          SELECT 1 FROM quote q
          JOIN customer c ON q.customer_id = c.id
          JOIN company_employee_customer_customer ec ON c.id = ec.customer_id
          JOIN employee e ON ec.employee_id = e.id
          WHERE q.id = message.quote_id
          AND e.company_id = get_current_user_company_id()
        )
      );
    `);
    
    // Employee Userは自分のメッセージのみアクセス可能
    this.addSql(`
      CREATE POLICY message_employee_policy ON message
      FOR ALL
      USING (
        get_current_user_role() = 'employee_user'
        AND EXISTS (
          SELECT 1 FROM quote q
          JOIN customer c ON q.customer_id = c.id
          WHERE q.id = message.quote_id
          AND c.email = current_setting('app.current_user_email', true)
        )
      );
    `);
  }

  async down(): Promise<void> {
    // Quoteテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS quote_platform_admin_policy ON quote;');
    this.addSql('DROP POLICY IF EXISTS quote_company_access_policy ON quote;');
    this.addSql('DROP POLICY IF EXISTS quote_employee_policy ON quote;');
    this.addSql('ALTER TABLE quote DISABLE ROW LEVEL SECURITY;');
    
    // Messageテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS message_platform_admin_policy ON message;');
    this.addSql('DROP POLICY IF EXISTS message_company_access_policy ON message;');
    this.addSql('DROP POLICY IF EXISTS message_employee_policy ON message;');
    this.addSql('ALTER TABLE message DISABLE ROW LEVEL SECURITY;');
  }
}