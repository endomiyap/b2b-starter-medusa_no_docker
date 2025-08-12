import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

/**
 * 特定会社が管理する商品一覧を取得（会社 → ストア → 商品の経路で取得）
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id: companyId } = req.params;
  
  try {
    const linkService = req.scope.resolve("link");
    const productService = req.scope.resolve(Modules.PRODUCT) as any;
    const storeService = req.scope.resolve(Modules.STORE) as any;

    // 1. Company-Store リンクを取得して、会社が管理するストア一覧を取得
    let companyStoreLinks;
    try {
      companyStoreLinks = await linkService.list({
        company: { company_id: companyId }
      });
    } catch (error) {
      console.warn(`Company-Store link error for company ${companyId}:`, error);
      companyStoreLinks = [];
    }

    if (!companyStoreLinks || companyStoreLinks.length === 0) {
      res.json({
        company_id: companyId,
        stores: [],
        products: [],
        total_products: 0
      });
      return;
    }

    // 2. ストアIDを取得
    const storeIds = companyStoreLinks
      .filter((link: any) => link && link.store && link.store.store_id)
      .map((link: any) => link.store.store_id);

    if (storeIds.length === 0) {
      res.json({
        company_id: companyId,
        stores: [],
        products: [],
        total_products: 0
      });
      return;
    }

    // 3. 各ストアの商品を取得
    const storeProducts = await Promise.all(
      storeIds.map(async (storeId: string) => {
        try {
          // ストア情報を取得
          const store = await storeService.retrieveStore(storeId, {
            select: ["id", "name", "created_at"]
          });

          // Product-Store リンクを取得
          let productStoreLinks;
          try {
            productStoreLinks = await linkService.list({
              store: { store_id: storeId }
            });
          } catch (error) {
            console.warn(`Product-Store link error for store ${storeId}:`, error);
            productStoreLinks = [];
          }

          if (!productStoreLinks || productStoreLinks.length === 0) {
            return {
              store: store,
              products: [],
              product_count: 0
            };
          }

          // 商品IDを取得
          const productIds = productStoreLinks
            .filter((link: any) => link && link.product && link.product.product_id)
            .map((link: any) => link.product.product_id);

          // 商品詳細を取得
          const products = await Promise.all(
            productIds.map(async (productId: string) => {
              try {
                return await productService.retrieveProduct(productId, {
                  select: ["id", "title", "description", "handle", "status", "created_at"],
                  relations: ["variants"]
                });
              } catch (error) {
                console.warn(`Product ${productId} not found:`, error);
                return null;
              }
            })
          );

          const validProducts = products.filter(product => product !== null);

          return {
            store: store,
            products: validProducts,
            product_count: validProducts.length
          };

        } catch (error) {
          console.warn(`Store ${storeId} not found:`, error);
          return {
            store: { id: storeId, name: "Unknown Store" },
            products: [],
            product_count: 0
          };
        }
      })
    );

    // 4. 結果をまとめる
    const allProducts = storeProducts.flatMap(sp => sp.products);
    const totalProducts = allProducts.length;

    res.json({
      company_id: companyId,
      stores: storeProducts,
      products: allProducts,
      total_products: totalProducts,
      store_count: storeIds.length
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to fetch company products",
      message: error.message,
      company_id: companyId
    });
  }
}
