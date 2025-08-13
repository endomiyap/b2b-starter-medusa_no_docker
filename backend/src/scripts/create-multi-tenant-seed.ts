import { ExecArgs } from "@medusajs/framework/types"

/**
 * マルチテナント構成のシードデータ作成スクリプト
 * 
 * アーキテクチャ:
 * 会社A
 * ├── サイトE（一般消費者向け）
 * └── サイトF（法人向け）
 * 
 * 会社B
 * ├── サイトG（日本向け）
 * └── サイトH（海外向け）
 */

export default async function createMultiTenantSeed({ container }: ExecArgs) {
  console.log("マルチテナント構成のシードデータを作成中...")

  try {
    // データベース接続を取得
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgres://postgres@localhost/medusa-b2b-starter'
    })
    await client.connect()

    // 1. 会社データの作成
    console.log("会社データを作成中...")
    
    // 既存データをクリア（開発用）
    await client.query("DELETE FROM product_product_store_store WHERE id LIKE 'seed_%'")
    await client.query("DELETE FROM company_company_store_store WHERE id LIKE 'seed_%'")
    await client.query("DELETE FROM product WHERE id LIKE 'seed_%'")
    await client.query("DELETE FROM store WHERE id LIKE 'seed_%'")
    await client.query("DELETE FROM company WHERE id LIKE 'seed_%'")

    // 会社A
    await client.query(`
      INSERT INTO company (id, name, phone, email, address, city, state, zip, country, created_at, updated_at) 
      VALUES (
        'seed_company_a',
        '会社A',
        '+81-3-1111-2222',
        'contact@company-a.co.jp',
        '東京都港区赤坂1-1-1',
        '東京都',
        '東京都',
        '107-0052',
        '日本',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        updated_at = NOW()
    `)

    // 会社B
    await client.query(`
      INSERT INTO company (id, name, phone, email, address, city, state, zip, country, created_at, updated_at) 
      VALUES (
        'seed_company_b',
        '会社B',
        '+81-3-3333-4444',
        'contact@company-b.co.jp',
        '東京都渋谷区渋谷2-2-2',
        '東京都',
        '東京都',
        '150-0002',
        '日本',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        updated_at = NOW()
    `)

    // 2. ストアデータの作成
    console.log("ストアデータを作成中...")
    
    // 会社A - サイトE（一般消費者向け）
    await client.query(`
      INSERT INTO store (id, name, created_at, updated_at) 
      VALUES ('seed_store_a_e', 'サイトE（一般消費者向け）', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    `)

    // 会社A - サイトF（法人向け）
    await client.query(`
      INSERT INTO store (id, name, created_at, updated_at) 
      VALUES ('seed_store_a_f', 'サイトF（法人向け）', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    `)

    // 会社B - サイトG（日本向け）
    await client.query(`
      INSERT INTO store (id, name, created_at, updated_at) 
      VALUES ('seed_store_b_g', 'サイトG（日本向け）', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    `)

    // 会社B - サイトH（海外向け）
    await client.query(`
      INSERT INTO store (id, name, created_at, updated_at) 
      VALUES ('seed_store_b_h', 'サイトH（海外向け）', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    `)

    // 3. Company-Store リンクの作成
    console.log("Company-Store リンクを作成中...")
    
    const companyStoreLinks = [
      { id: 'seed_link_company_a_store_e', company_id: 'seed_company_a', store_id: 'seed_store_a_e' },
      { id: 'seed_link_company_a_store_f', company_id: 'seed_company_a', store_id: 'seed_store_a_f' },
      { id: 'seed_link_company_b_store_g', company_id: 'seed_company_b', store_id: 'seed_store_b_g' },
      { id: 'seed_link_company_b_store_h', company_id: 'seed_company_b', store_id: 'seed_store_b_h' }
    ]

    for (const link of companyStoreLinks) {
      await client.query(`
        INSERT INTO company_company_store_store (id, company_id, store_id, created_at, updated_at) 
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          company_id = EXCLUDED.company_id,
          store_id = EXCLUDED.store_id,
          updated_at = NOW()
      `, [link.id, link.company_id, link.store_id])
    }

    // 4. 商品データの作成
    console.log("商品データを作成中...")
    
    const products = [
      // 会社A専用商品
      {
        id: 'seed_product_a_business_supplies',
        title: '会社A専用商品 - ビジネス文具セット',
        handle: 'company-a-business-supplies-seed',
        description: '会社A向けプレミアムオフィス用品セット（他社非表示）',
        status: 'published'
      },
      {
        id: 'seed_product_a_premium_package',
        title: '会社A専用商品 - プレミアムパッケージ',
        handle: 'company-a-premium-package-seed',
        description: '会社A向け法人専用サービスパッケージ',
        status: 'published'
      },
      // 会社B専用商品
      {
        id: 'seed_product_b_stationery',
        title: '会社B専用商品 - ステーショナリセット',
        handle: 'company-b-stationery-set-seed',
        description: '会社B向けカスタムステーショナリ商品',
        status: 'published'
      },
      {
        id: 'seed_product_b_global_package',
        title: '会社B専用商品 - グローバルパッケージ',
        handle: 'company-b-global-package-seed',
        description: '会社B向け国際展開支援商品',
        status: 'published'
      }
    ]

    for (const product of products) {
      await client.query(`
        INSERT INTO product (id, title, handle, description, status, is_giftcard, discountable, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, false, true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          handle = EXCLUDED.handle,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          updated_at = NOW()
      `, [product.id, product.title, product.handle, product.description, product.status])
    }

    // 5. Product-Store リンクの作成
    console.log("Product-Store リンクを作成中...")
    
    const productStoreLinks = [
      // 会社A商品をサイトE（一般消費者向け）とサイトF（法人向け）に関連付け
      { id: 'seed_link_prod_a_bus_store_e', product_id: 'seed_product_a_business_supplies', store_id: 'seed_store_a_e' },
      { id: 'seed_link_prod_a_bus_store_f', product_id: 'seed_product_a_business_supplies', store_id: 'seed_store_a_f' },
      { id: 'seed_link_prod_a_prem_store_f', product_id: 'seed_product_a_premium_package', store_id: 'seed_store_a_f' }, // 法人向けのみ
      
      // 会社B商品をサイトG（日本向け）とサイトH（海外向け）に関連付け
      { id: 'seed_link_prod_b_stat_store_g', product_id: 'seed_product_b_stationery', store_id: 'seed_store_b_g' },
      { id: 'seed_link_prod_b_stat_store_h', product_id: 'seed_product_b_stationery', store_id: 'seed_store_b_h' },
      { id: 'seed_link_prod_b_glob_store_h', product_id: 'seed_product_b_global_package', store_id: 'seed_store_b_h' } // 海外向けのみ
    ]

    for (const link of productStoreLinks) {
      await client.query(`
        INSERT INTO product_product_store_store (id, product_id, store_id, created_at, updated_at) 
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          product_id = EXCLUDED.product_id,
          store_id = EXCLUDED.store_id,
          updated_at = NOW()
      `, [link.id, link.product_id, link.store_id])
    }

    await client.end()

    console.log("マルチテナント構成のシードデータ作成完了!")
    console.log("")
    console.log("作成されたデータ:")
    console.log("- 会社: 2社（会社A、会社B）")
    console.log("- ストア: 4店舗（サイトE、F、G、H）")
    console.log("- 商品: 4商品（各社専用商品）")
    console.log("- Company-Storeリンク: 4件")
    console.log("- Product-Storeリンク: 6件")
    console.log("")
    console.log("テスト用APIエンドポイント:")
    console.log("- GET /admin/companies/seed_company_a/stores")
    console.log("- GET /admin/companies/seed_company_b/stores")
    console.log("- GET /admin/stores/seed_store_a_e/products")
    console.log("- GET /admin/stores/seed_store_a_f/products")
    console.log("- GET /admin/stores/seed_store_b_g/products")
    console.log("- GET /admin/stores/seed_store_b_h/products")

  } catch (error) {
    console.error("シードデータ作成中にエラーが発生しました:", error)
    throw error
  }
}