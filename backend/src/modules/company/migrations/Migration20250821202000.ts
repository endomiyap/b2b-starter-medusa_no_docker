import { Migration } from "@mikro-orm/migrations";

export class Migration20250821202000 extends Migration {
  async up(): Promise<void> {
    // =====================================================
    // Companyテーブル用のRLSポリシー
    // =====================================================
    
    // RLSを有効化
    this.addSql('ALTER TABLE company ENABLE ROW LEVEL SECURITY;');
    
    // Platform Adminは全てのCompanyにアクセス可能
    this.addSql(`
      CREATE POLICY company_platform_admin_policy ON company
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    // Company Admin以下は自社のみアクセス可能
    this.addSql(`
      CREATE POLICY company_self_access_policy ON company
      FOR ALL
      USING (
        get_current_user_role() IN ('company_admin', 'store_admin', 'employee_user')
        AND id = get_current_user_company_id()
      );
    `);

    // =====================================================
    // Employeeテーブル用のRLSポリシー  
    // =====================================================
    
    // RLSを有効化
    this.addSql('ALTER TABLE employee ENABLE ROW LEVEL SECURITY;');
    
    // Platform Adminは全てのEmployeeにアクセス可能
    this.addSql(`
      CREATE POLICY employee_platform_admin_policy ON employee
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    // Company Adminは自社の従業員のみアクセス可能
    this.addSql(`
      CREATE POLICY employee_company_admin_policy ON employee
      FOR ALL
      USING (
        get_current_user_role() = 'company_admin'
        AND company_id = get_current_user_company_id()
      );
    `);
    
    // Store Admin/Employee Userは自分の情報のみ閲覧可能
    this.addSql(`
      CREATE POLICY employee_self_access_policy ON employee
      FOR SELECT
      USING (
        get_current_user_role() IN ('store_admin', 'employee_user')
        AND company_id = get_current_user_company_id()
        AND EXISTS (
          SELECT 1 FROM company_employee_customer_customer ec
          JOIN customer c ON ec.customer_id = c.id
          WHERE ec.employee_id = employee.id
          AND c.email = current_setting('app.current_user_email', true)
        )
      );
    `);
  }

  async down(): Promise<void> {
    // Companyテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS company_platform_admin_policy ON company;');
    this.addSql('DROP POLICY IF EXISTS company_self_access_policy ON company;');
    this.addSql('ALTER TABLE company DISABLE ROW LEVEL SECURITY;');
    
    // Employeeテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS employee_platform_admin_policy ON employee;');
    this.addSql('DROP POLICY IF EXISTS employee_company_admin_policy ON employee;');
    this.addSql('DROP POLICY IF EXISTS employee_self_access_policy ON employee;');
    this.addSql('ALTER TABLE employee DISABLE ROW LEVEL SECURITY;');
  }
}