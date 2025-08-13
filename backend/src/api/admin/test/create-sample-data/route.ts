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

    // 1. 企業A専用商品を作成
    console.log('Creating tenant A product...');
    const tenantAProductResult = await createProductsWorkflow(req.scope).run({
      input: {
        products: [{
          title: '企業A専用商品 - オフィス用品セット',
          handle: 'tenant-a-office-supplies-' + Date.now(),
          description: '企業A向オフィス用品セット',
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

    // 2. 企業B専用商品を作成
    console.log('Creating tenant B product...');
    const tenantBProductResult = await createProductsWorkflow(req.scope).run({
      input: {
        products: [{
          title: '企業B専用商品 - ステーショナリ',
          handle: 'tenant-b-international-package-' + Date.now(),
          description: '企業B向けステーショナリ商品',
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
    
    // 企業A商品 → 企業Aストア
    try {
      await linkService.create({
        product: { product_id: tenantAProduct.id },
        store: { store_id: tenantAStoreId }
      });
      console.log(`Linked tenant A product ${tenantAProduct.id} to store ${tenantAStoreId}`);
    } catch (error) {
      console.warn('Failed to link tenant A product:', error);
    }

    // 企業B商品 → 企業Bストア  
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
      message: "テストデータ created successfully",
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
