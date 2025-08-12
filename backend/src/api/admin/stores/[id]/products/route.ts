import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";

/**
 * 特定ストアの商品一覧を取得
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id: storeId } = req.params;
  
  try {
    const linkService = req.scope.resolve("link");
    const productService = req.scope.resolve(Modules.PRODUCT) as any;

    // Product-Store リンクを取得
    let links;
    try {
      links = await linkService.list({
        store: { store_id: storeId }
      });
    } catch (linkError) {
      console.warn(`Link service error for store ${storeId}:`, linkError);
      links = [];
    }

    if (!links || links.length === 0) {
      res.json({
        store_id: storeId,
        products: [],
        count: 0
      });
      return;
    }

    // 商品IDを取得（nullチェック追加）
    const productIds = links
      .filter((link: any) => link && link.product && link.product.product_id)
      .map((link: any) => link.product.product_id);

    if (productIds.length === 0) {
      res.json({
        store_id: storeId,
        products: [],
        count: 0
      });
      return;
    }

    // 商品詳細データを取得
    const products = await Promise.all(
      productIds.map(async (productId: string) => {
        try {
          const product = await productService.retrieveProduct(productId, {
            select: ["id", "title", "description", "handle", "status", "created_at", "updated_at"],
            relations: ["variants", "variants.prices"]
          });
          return product;
        } catch (error) {
          console.warn(`Product ${productId} not found:`, error);
          return null;
        }
      })
    );
    
    // nullを除去して有効な商品のみを返す
    const validProducts = products.filter(product => product !== null);

    res.json({
      store_id: storeId,
      products: validProducts,
      count: validProducts.length,
      linked_count: links.length
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to fetch store products",
      message: error.message,
      store_id: storeId
    });
  }
}