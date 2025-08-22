import { Migration } from "@mikro-orm/migrations";

export class Migration20250821202200 extends Migration {
  async up(): Promise<void> {
    // =====================================================
    // Approval関連テーブル用のRLSポリシー
    // =====================================================
    
    // approval_settingsテーブル
    this.addSql('ALTER TABLE approval_settings ENABLE ROW LEVEL SECURITY;');
    
    this.addSql(`
      CREATE POLICY approval_settings_platform_admin_policy ON approval_settings
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    this.addSql(`
      CREATE POLICY approval_settings_company_policy ON approval_settings
      FOR ALL
      USING (
        get_current_user_role() IN ('company_admin', 'store_admin')
        AND EXISTS (
          SELECT 1 FROM company_approval_setting_approval_settings cas
          WHERE cas.approval_settings_id = approval_settings.id
          AND cas.company_id = get_current_user_company_id()
        )
      );
    `);

    // approvalテーブル
    this.addSql('ALTER TABLE approval ENABLE ROW LEVEL SECURITY;');
    
    this.addSql(`
      CREATE POLICY approval_platform_admin_policy ON approval
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    this.addSql(`
      CREATE POLICY approval_company_policy ON approval
      FOR ALL
      USING (
        get_current_user_role() IN ('company_admin', 'store_admin')
        AND EXISTS (
          SELECT 1 FROM cart c
          JOIN company_carts_cart ccc ON c.id = ccc.cart_id
          WHERE c.id = approval.cart_id
          AND ccc.company_id = get_current_user_company_id()
        )
      );
    `);

    // Employee Userは自分の承認のみアクセス可能
    this.addSql(`
      CREATE POLICY approval_employee_policy ON approval
      FOR ALL
      USING (
        get_current_user_role() = 'employee_user'
        AND EXISTS (
          SELECT 1 FROM cart c
          JOIN customer cust ON c.customer_id = cust.id
          WHERE c.id = approval.cart_id
          AND cust.email = current_setting('app.current_user_email', true)
        )
      );
    `);

    // approval_statusテーブル
    this.addSql('ALTER TABLE approval_status ENABLE ROW LEVEL SECURITY;');
    
    this.addSql(`
      CREATE POLICY approval_status_platform_admin_policy ON approval_status
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    this.addSql(`
      CREATE POLICY approval_status_company_policy ON approval_status
      FOR ALL
      USING (
        get_current_user_role() IN ('company_admin', 'store_admin')
        AND EXISTS (
          SELECT 1 FROM approval a
          JOIN cart c ON a.cart_id = c.id
          JOIN company_carts_cart ccc ON c.id = ccc.cart_id
          WHERE a.id = approval_status.approval_id
          AND ccc.company_id = get_current_user_company_id()
        )
      );
    `);

    // Employee Userは自分の承認ステータスのみアクセス可能
    this.addSql(`
      CREATE POLICY approval_status_employee_policy ON approval_status
      FOR ALL
      USING (
        get_current_user_role() = 'employee_user'
        AND EXISTS (
          SELECT 1 FROM approval a
          JOIN cart c ON a.cart_id = c.id
          JOIN customer cust ON c.customer_id = cust.id
          WHERE a.id = approval_status.approval_id
          AND cust.email = current_setting('app.current_user_email', true)
        )
      );
    `);
  }

  async down(): Promise<void> {
    // approval_settingsテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS approval_settings_platform_admin_policy ON approval_settings;');
    this.addSql('DROP POLICY IF EXISTS approval_settings_company_policy ON approval_settings;');
    this.addSql('ALTER TABLE approval_settings DISABLE ROW LEVEL SECURITY;');
    
    // approvalテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS approval_platform_admin_policy ON approval;');
    this.addSql('DROP POLICY IF EXISTS approval_company_policy ON approval;');
    this.addSql('DROP POLICY IF EXISTS approval_employee_policy ON approval;');
    this.addSql('ALTER TABLE approval DISABLE ROW LEVEL SECURITY;');
    
    // approval_statusテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS approval_status_platform_admin_policy ON approval_status;');
    this.addSql('DROP POLICY IF EXISTS approval_status_company_policy ON approval_status;');
    this.addSql('DROP POLICY IF EXISTS approval_status_employee_policy ON approval_status;');
    this.addSql('ALTER TABLE approval_status DISABLE ROW LEVEL SECURITY;');
  }
}