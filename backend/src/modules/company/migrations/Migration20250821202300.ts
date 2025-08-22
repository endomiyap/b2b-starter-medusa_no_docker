import { Migration } from "@mikro-orm/migrations";

export class Migration20250821202300 extends Migration {
  async up(): Promise<void> {
    // =====================================================
    // Store関連のヘルパー関数を追加
    // =====================================================
    
    // 現在のユーザーのストアIDリストを取得する関数
    this.addSql(`
      CREATE OR REPLACE FUNCTION get_current_user_store_ids()
      RETURNS text[] AS $$
      DECLARE
        metadata jsonb;
        store_ids text[];
      BEGIN
        metadata := get_current_user_metadata();
        
        IF metadata ? 'store_ids' THEN
          SELECT array_agg(value::text)
          INTO store_ids
          FROM jsonb_array_elements_text(metadata->'store_ids');
        END IF;
        
        RETURN COALESCE(store_ids, ARRAY[]::text[]);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    // =====================================================
    // Productテーブル用のRLSポリシー
    // =====================================================
    
    this.addSql('ALTER TABLE product ENABLE ROW LEVEL SECURITY;');
    
    // Platform Adminは全商品にアクセス可能
    this.addSql(`
      CREATE POLICY product_platform_admin_policy ON product
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    // Company Adminは自社のStore商品にアクセス可能
    this.addSql(`
      CREATE POLICY product_company_admin_policy ON product
      FOR ALL
      USING (
        get_current_user_role() = 'company_admin'
        AND EXISTS (
          SELECT 1 FROM product_store_store pss
          JOIN company_company_store_store ccs ON pss.store_id = ccs.store_id
          WHERE pss.product_id = product.id
          AND ccs.company_id = get_current_user_company_id()
        )
      );
    `);
    
    // Store Adminは担当Store商品のみアクセス可能
    this.addSql(`
      CREATE POLICY product_store_admin_policy ON product
      FOR ALL
      USING (
        get_current_user_role() = 'store_admin'
        AND EXISTS (
          SELECT 1 FROM product_store_store pss
          WHERE pss.product_id = product.id
          AND pss.store_id = ANY(get_current_user_store_ids())
        )
      );
    `);

    // Employee Userは自社商品を閲覧可能
    this.addSql(`
      CREATE POLICY product_employee_policy ON product
      FOR SELECT
      USING (
        get_current_user_role() = 'employee_user'
        AND EXISTS (
          SELECT 1 FROM product_store_store pss
          JOIN company_company_store_store ccs ON pss.store_id = ccs.store_id
          WHERE pss.product_id = product.id
          AND ccs.company_id = get_current_user_company_id()
        )
      );
    `);

    // =====================================================
    // Storeテーブル用のRLSポリシー
    // =====================================================
    
    this.addSql('ALTER TABLE store ENABLE ROW LEVEL SECURITY;');
    
    // Platform Adminは全Storeにアクセス可能
    this.addSql(`
      CREATE POLICY store_platform_admin_policy ON store
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    // Company Adminは自社のStoreにアクセス可能
    this.addSql(`
      CREATE POLICY store_company_admin_policy ON store
      FOR ALL
      USING (
        get_current_user_role() = 'company_admin'
        AND EXISTS (
          SELECT 1 FROM company_company_store_store ccs
          WHERE ccs.store_id = store.id
          AND ccs.company_id = get_current_user_company_id()
        )
      );
    `);
    
    // Store Adminは担当Storeのみアクセス可能
    this.addSql(`
      CREATE POLICY store_store_admin_policy ON store
      FOR ALL
      USING (
        get_current_user_role() = 'store_admin'
        AND store.id = ANY(get_current_user_store_ids())
      );
    `);

    // =====================================================
    // Customerテーブル用のRLSポリシー
    // =====================================================
    
    this.addSql('ALTER TABLE customer ENABLE ROW LEVEL SECURITY;');
    
    // Platform Adminは全Customerにアクセス可能
    this.addSql(`
      CREATE POLICY customer_platform_admin_policy ON customer
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    // Company Adminは自社のCustomerにアクセス可能
    this.addSql(`
      CREATE POLICY customer_company_admin_policy ON customer
      FOR ALL
      USING (
        get_current_user_role() = 'company_admin'
        AND EXISTS (
          SELECT 1 FROM company_employee_customer_customer ec
          JOIN employee e ON ec.employee_id = e.id
          WHERE ec.customer_id = customer.id
          AND e.company_id = get_current_user_company_id()
        )
      );
    `);

    // Store Adminは自社のCustomerを閲覧可能
    this.addSql(`
      CREATE POLICY customer_store_admin_policy ON customer
      FOR SELECT
      USING (
        get_current_user_role() = 'store_admin'
        AND EXISTS (
          SELECT 1 FROM company_employee_customer_customer ec
          JOIN employee e ON ec.employee_id = e.id
          WHERE ec.customer_id = customer.id
          AND e.company_id = get_current_user_company_id()
        )
      );
    `);

    // Employee Userは自分の情報のみアクセス可能
    this.addSql(`
      CREATE POLICY customer_employee_policy ON customer
      FOR ALL
      USING (
        get_current_user_role() = 'employee_user'
        AND customer.email = current_setting('app.current_user_email', true)
      );
    `);

    // =====================================================
    // Cartテーブル用のRLSポリシー
    // =====================================================
    
    this.addSql('ALTER TABLE cart ENABLE ROW LEVEL SECURITY;');
    
    // Platform Adminは全Cartにアクセス可能
    this.addSql(`
      CREATE POLICY cart_platform_admin_policy ON cart
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    // Company Adminは自社のCartにアクセス可能
    this.addSql(`
      CREATE POLICY cart_company_admin_policy ON cart
      FOR ALL
      USING (
        get_current_user_role() = 'company_admin'
        AND EXISTS (
          SELECT 1 FROM company_carts_cart cc
          WHERE cc.cart_id = cart.id
          AND cc.company_id = get_current_user_company_id()
        )
      );
    `);

    // Store Adminは自社のCartを閲覧可能
    this.addSql(`
      CREATE POLICY cart_store_admin_policy ON cart
      FOR SELECT
      USING (
        get_current_user_role() = 'store_admin'
        AND EXISTS (
          SELECT 1 FROM company_carts_cart cc
          WHERE cc.cart_id = cart.id
          AND cc.company_id = get_current_user_company_id()
        )
      );
    `);

    // Employee Userは自分のCartのみアクセス可能
    this.addSql(`
      CREATE POLICY cart_employee_policy ON cart
      FOR ALL
      USING (
        get_current_user_role() = 'employee_user'
        AND EXISTS (
          SELECT 1 FROM customer c
          WHERE c.id = cart.customer_id
          AND c.email = current_setting('app.current_user_email', true)
        )
      );
    `);

    // =====================================================
    // Orderテーブル用のRLSポリシー
    // =====================================================
    
    this.addSql('ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;');
    
    // Platform Adminは全Orderにアクセス可能
    this.addSql(`
      CREATE POLICY order_platform_admin_policy ON "order"
      FOR ALL
      USING (get_current_user_role() = 'platform_admin');
    `);
    
    // Company Adminは自社のOrderにアクセス可能
    this.addSql(`
      CREATE POLICY order_company_admin_policy ON "order"
      FOR ALL
      USING (
        get_current_user_role() = 'company_admin'
        AND EXISTS (
          SELECT 1 FROM company_order_company oc
          WHERE oc.order_id = "order".id
          AND oc.company_id = get_current_user_company_id()
        )
      );
    `);

    // Store Adminは自社のOrderを閲覧可能
    this.addSql(`
      CREATE POLICY order_store_admin_policy ON "order"
      FOR SELECT
      USING (
        get_current_user_role() = 'store_admin'
        AND EXISTS (
          SELECT 1 FROM company_order_company oc
          WHERE oc.order_id = "order".id
          AND oc.company_id = get_current_user_company_id()
        )
      );
    `);

    // Employee Userは自分のOrderのみアクセス可能
    this.addSql(`
      CREATE POLICY order_employee_policy ON "order"
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
    // デバッグ用ビューの作成
    // =====================================================
    
    this.addSql(`
      CREATE OR REPLACE VIEW rls_debug_current_user AS
      SELECT 
        current_setting('app.current_user_email', true) as current_email,
        get_current_user_role() as user_role,
        get_current_user_company_id() as company_id,
        get_current_user_store_ids() as store_ids,
        get_current_user_metadata() as full_metadata;
    `);
  }

  async down(): Promise<void> {
    // Productテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS product_platform_admin_policy ON product;');
    this.addSql('DROP POLICY IF EXISTS product_company_admin_policy ON product;');
    this.addSql('DROP POLICY IF EXISTS product_store_admin_policy ON product;');
    this.addSql('DROP POLICY IF EXISTS product_employee_policy ON product;');
    this.addSql('ALTER TABLE product DISABLE ROW LEVEL SECURITY;');
    
    // Storeテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS store_platform_admin_policy ON store;');
    this.addSql('DROP POLICY IF EXISTS store_company_admin_policy ON store;');
    this.addSql('DROP POLICY IF EXISTS store_store_admin_policy ON store;');
    this.addSql('ALTER TABLE store DISABLE ROW LEVEL SECURITY;');
    
    // Customerテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS customer_platform_admin_policy ON customer;');
    this.addSql('DROP POLICY IF EXISTS customer_company_admin_policy ON customer;');
    this.addSql('DROP POLICY IF EXISTS customer_store_admin_policy ON customer;');
    this.addSql('DROP POLICY IF EXISTS customer_employee_policy ON customer;');
    this.addSql('ALTER TABLE customer DISABLE ROW LEVEL SECURITY;');
    
    // Cartテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS cart_platform_admin_policy ON cart;');
    this.addSql('DROP POLICY IF EXISTS cart_company_admin_policy ON cart;');
    this.addSql('DROP POLICY IF EXISTS cart_store_admin_policy ON cart;');
    this.addSql('DROP POLICY IF EXISTS cart_employee_policy ON cart;');
    this.addSql('ALTER TABLE cart DISABLE ROW LEVEL SECURITY;');
    
    // Orderテーブルのポリシーを削除
    this.addSql('DROP POLICY IF EXISTS order_platform_admin_policy ON "order";');
    this.addSql('DROP POLICY IF EXISTS order_company_admin_policy ON "order";');
    this.addSql('DROP POLICY IF EXISTS order_store_admin_policy ON "order";');
    this.addSql('DROP POLICY IF EXISTS order_employee_policy ON "order";');
    this.addSql('ALTER TABLE "order" DISABLE ROW LEVEL SECURITY;');
    
    // ビューと関数を削除
    this.addSql('DROP VIEW IF EXISTS rls_debug_current_user;');
    this.addSql('DROP FUNCTION IF EXISTS get_current_user_store_ids();');
  }
}