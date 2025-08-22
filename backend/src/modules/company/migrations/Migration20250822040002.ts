import { Migration } from "@mikro-orm/migrations";

export class Migration20250822040002 extends Migration {
  async up(): Promise<void> {
    // =====================================================
    // RLSパフォーマンス最適化用インデックス作成
    // =====================================================
    
    // Company関連のインデックス
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_company_id 
      ON employee(company_id);
    `);
    
    // Store関連のインデックス（会社-Store関連付け）
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_store_company_id 
      ON company_company_store_store(company_id);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_store_store_id 
      ON company_company_store_store(store_id);
    `);
    
    // Product-Store関連のインデックス
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_store_store_id 
      ON product_store_store(store_id);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_store_product_id 
      ON product_store_store(product_id);
    `);
    
    // Customer関連のインデックス
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_email 
      ON customer(email);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_customer_employee_id 
      ON company_employee_customer_customer(employee_id);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employee_customer_customer_id 
      ON company_employee_customer_customer(customer_id);
    `);
    
    // Cart関連のインデックス
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cart_customer_id 
      ON cart(customer_id);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_cart_company_id 
      ON company_carts_cart(company_id);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_cart_cart_id 
      ON company_carts_cart(cart_id);
    `);
    
    // Order関連のインデックス
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_customer_id 
      ON "order"(customer_id);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_order_company_id 
      ON company_order_company(company_id);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_order_order_id 
      ON company_order_company(order_id);
    `);
    
    // Quote関連のインデックス
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quote_company_id 
      ON quote(company_id);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quote_customer_id 
      ON quote(customer_id);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_message_quote_id 
      ON message(quote_id);
    `);
    
    // Approval関連のインデックス
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_approval_company_id 
      ON approval(company_id);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_approval_cart_id 
      ON approval(cart_id);
    `);
    
    // Provider Identity関連のインデックス（RLS Context設定で使用）
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_provider_identity_auth_identity_id 
      ON provider_identity(auth_identity_id);
    `);
    
    this.addSql(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_provider_identity_entity_id 
      ON provider_identity(entity_id);
    `);
  }

  async down(): Promise<void> {
    // インデックスを削除（逆順）
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_provider_identity_entity_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_provider_identity_auth_identity_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_approval_cart_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_approval_company_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_message_quote_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_quote_customer_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_quote_company_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_company_order_order_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_company_order_company_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_order_customer_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_company_cart_cart_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_company_cart_company_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_cart_customer_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_employee_customer_customer_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_employee_customer_employee_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_customer_email;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_product_store_product_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_product_store_store_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_company_store_store_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_company_store_company_id;');
    this.addSql('DROP INDEX CONCURRENTLY IF EXISTS idx_employee_company_id;');
  }
}