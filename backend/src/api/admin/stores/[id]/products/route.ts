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
    // 直接データベースから Product-Store リンクを取得
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgres://postgres@localhost/medusa-b2b-starter'
    });
    
    await client.connect();
    
    console.log("=== Store Products API Debug ===");
    console.log("Store ID:", storeId);
    console.log("Querying database for product-store links...");
    
    const result = await client.query(
      'SELECT product_id FROM product_product_store_store WHERE store_id = $1',
      [storeId]
    );
    
    const productLinks = result.rows;
    await client.end();
    
    console.log("Product links from database:", productLinks);
    console.log("Product links count:", productLinks.length);

    if (productLinks.length === 0) {
      console.log("No product links found in database");
      res.json({
        store_id: storeId,
        products: [],
        count: 0
      });
      return;
    }

    // 商品IDを取得
    const productIds = productLinks.map((link: { product_id: string }) => {
      console.log("Extracting product_id from link:", link.product_id);
      return link.product_id;
    });

    if (productIds.length === 0) {
      res.json({
        store_id: storeId,
        products: [],
        count: 0
      });
      return;
    }

    // 商品詳細データを直接SQLで取得
    console.log("-- Attempting to retrieve products with IDs:", productIds);
    
    // 新しいデータベース接続を作成
    const clientForProducts = new Client({
      connectionString: process.env.DATABASE_URL || 'postgres://postgres@localhost/medusa-b2b-starter'
    });
    await clientForProducts.connect();
    
    const products = await Promise.all(
      productIds.map(async (productId: string) => {
        try {
          console.log(`>>> Retrieving product: ${productId}`);
          
          // 直接SQLで商品情報を取得
          const productResult = await clientForProducts.query(
            'SELECT id, title, description, handle, status, created_at, updated_at FROM product WHERE id = $1',
            [productId]
          );
          
          if (productResult.rows.length > 0) {
            const product = productResult.rows[0];
            console.log(`>>> Product retrieved successfully:`, product);
            return product;
          } else {
            console.log(`>>> Product not found: ${productId}`);
            return null;
          }
        } catch (error: any) {
          console.error(`>>> Product ${productId} retrieval failed:`, error.message);
          console.error(">>> Full error:", error);
          return null;
        }
      })
    );
    
    await clientForProducts.end();
    
    // nullを除去して有効な商品のみを返す
    const validProducts = products.filter(product => product !== null);

    res.json({
      store_id: storeId,
      products: validProducts,
      count: validProducts.length,
      linked_count: productLinks.length
    });
    
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to fetch store products",
      message: error.message,
      store_id: storeId
    });
  }
}
