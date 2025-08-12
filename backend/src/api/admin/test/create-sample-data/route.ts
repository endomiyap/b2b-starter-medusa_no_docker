import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { createProductsWorkflow } from "@medusajs/core-flows";

/**
 * テナント分離テスト用のサンプルデータを作成
 */
export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  try {
    const linkService = req.scope.resolve("link");
    
    // テナントとストアのID
    const tenantAStoreId = 'store_01K2DX48ZTG990CHV19HN64FWR';
    const tenantBStoreId = 'store_789def';

    // 1. テナントA専用商品を作成
    console.log('Creating tenant A product...');
    const tenantAProductResult = await createProductsWorkflow(req.scope).run({
      input: {
        products: [{
          title: 'テナントA専用商品 - オフィス用品セット',
          handle: 'tenant-a-office-supplies-' + Date.now(),
          description: 'テナントA向けビジネス用品セット（他テナント非表示）',
          status: 'published',
          options: [{
            title: 'サイズ',
            values: ['S', 'M', 'L']
          }],
          variants: [
            {
              title: 'S',
              prices: [{ currency_code: 'jpy', amount: 5000 }],
              options: { 'サイズ': 'S' }
            },
            {
              title: 'M',
              prices: [{ currency_code: 'jpy', amount: 5500 }],
              options: { 'サイズ': 'M' }
            },
            {
              title: 'L',
              prices: [{ currency_code: 'jpy', amount: 6000 }],
              options: { 'サイズ': 'L' }
            }
          ]
        }]
      }
    });

    // 2. テナントB専用商品を作成
    console.log('Creating tenant B product...');
    const tenantBProductResult = await createProductsWorkflow(req.scope).run({
      input: {
        products: [{
          title: 'テナントB専用商品 - 国際展開パッケージ',
          handle: 'tenant-b-international-package-' + Date.now(),
          description: 'テナントB向け国際展開商品（テナントA非表示）',
          status: 'published',
          options: [{
            title: 'プラン',
            values: ['Basic', 'Premium', 'Enterprise']
          }],
          variants: [
            {
              title: 'Basic',
              prices: [{ currency_code: 'jpy', amount: 8000 }],
              options: { 'プラン': 'Basic' }
            },
            {
              title: 'Premium',
              prices: [{ currency_code: 'jpy', amount: 12000 }],
              options: { 'プラン': 'Premium' }
            },
            {
              title: 'Enterprise',
              prices: [{ currency_code: 'jpy', amount: 18000 }],
              options: { 'プラン': 'Enterprise' }
            }
          ]
        }]
      }
    });

    const tenantAProduct = tenantAProductResult.result[0];
    const tenantBProduct = tenantBProductResult.result[0];

    // 3. 商品をストアにリンク
    console.log('Linking products to stores...');
    
    // テナントA商品 → テナントAストア
    try {
      await linkService.create({
        product: { product_id: tenantAProduct.id },
        store: { store_id: tenantAStoreId }
      });
      console.log(`Linked tenant A product ${tenantAProduct.id} to store ${tenantAStoreId}`);
    } catch (error) {
      console.warn('Failed to link tenant A product:', error);
    }

    // テナントB商品 → テナントBストア  
    try {
      await linkService.create({
        product: { product_id: tenantBProduct.id },
        store: { store_id: tenantBStoreId }
      });
      console.log(`Linked tenant B product ${tenantBProduct.id} to store ${tenantBStoreId}`);
    } catch (error) {
      console.warn('Failed to link tenant B product:', error);
    }

    res.status(201).json({
      message: "Sample data created successfully",
      data: {
        tenantA: {
          product: {
            id: tenantAProduct.id,
            title: tenantAProduct.title,
            store_id: tenantAStoreId
          }
        },
        tenantB: {
          product: {
            id: tenantBProduct.id,
            title: tenantBProduct.title,
            store_id: tenantBStoreId
          }
        }
      }
    });

  } catch (error: any) {
    console.error('Sample data creation error:', error);
    res.status(500).json({
      error: "Failed to create sample data",
      message: error.message
    });
  }
}