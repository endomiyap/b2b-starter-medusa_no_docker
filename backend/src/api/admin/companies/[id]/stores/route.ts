import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { addStoreToCompanyWorkflow, removeStoreFromCompanyWorkflow } from "../../../../../workflows/company/workflows";
import { Modules } from "@medusajs/framework/utils";

interface AddStoreRequest extends AuthenticatedMedusaRequest {
  body: {
    store_id: string;
  };
}

interface RemoveStoreRequest extends AuthenticatedMedusaRequest {
  body: {
    store_id: string;
  };
}

 // “links” の返り値のゆらぎを吸収して storeId 配列へ正規化
 function extractStoreIds(links: unknown[]): string[] {
  const ids = (links ?? [])
    .map((l: any) =>
      l?.store?.id ??          // { store: { id } }
      l?.store?.store_id ??    // { store: { store_id } }
      l?.store_id ??           // { store_id }
      null
    )
    .filter((v: unknown): v is string => typeof v === "string" && v.length > 0)

    
  // 念のため重複排除
  return Array.from(new Set(ids))
 }

/**
 * 会社のストア一覧を取得
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id: companyId } = req.params;
  console.log("=== Company Stores API Debug ===");
  console.log("Company ID:", companyId);

  try {
    // 直接データベースから Company-Store リンクを取得
    // Medusa v2ではpgパッケージを使用
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL || 'postgres://postgres@localhost/medusa-b2b-starter'
    });
    
    await client.connect();
    console.log("Database connected");
    
    console.log("Querying database for company-store links...");
    console.log("Query: SELECT store_id FROM company_company_store_store WHERE company_id =", companyId);
    
    const result = await client.query(
      'SELECT store_id FROM company_company_store_store WHERE company_id = $1',
      [companyId]
    );
    
    const storeLinks = result.rows;
    await client.end();
    
    console.log("Store links from database:", storeLinks);
    console.log("Store links count:", storeLinks.length);
    
    if (storeLinks.length === 0) {
      console.log("No store links found in database, returning empty stores array");
      res.json({
        company_id: companyId,
        stores: []
      });
      return;
    }

    console.log("Processing store links to extract store IDs...");
    const storeIds = storeLinks.map((link: { store_id: string }) => {
      console.log("Extracting store_id from link:", link.store_id);
      return link.store_id;
    });

    // const storeIds = links
    //   .filter((link: any) => {
    //     console.log("Checking link:", link);
    //     const hasStoreId = link && link.store && link.store.store_id;
    //     console.log("Link has store_id:", hasStoreId);
    //     return hasStoreId;
    //   })
    //   .map((link: any) => {
    //     console.log("Extracting store_id from link:", link.store.store_id);
    //     return link.store.store_id;
    //   });
    
    console.log("Extracted store IDs:", storeIds);
    
    // Store Moduleサービスを使用してストアデータを取得
    const storeService = req.scope.resolve(Modules.STORE) as any;
    console.log("Store service resolved:", !!storeService);
    
    const stores = await Promise.all(
      storeIds.map(async (storeId: string) => {
        try {
          console.log("Retrieving store:", storeId);
          const store = await storeService.retrieveStore(storeId, {
            select: ["id", "name", "created_at", "updated_at"]
          });
          console.log("Store retrieved:", store);
          return store;
        } catch (error) {
          // ストアが見つからない場合はnullを返す
          console.warn(`Store ${storeId} not found:`, error);
          return null;
        }
      })
    );
    
    console.log("All stores retrieved:", stores);
    
    // nullを除去して有効なストアのみを返す
    const validStores = stores.filter(store => store !== null);
    console.log("Valid stores:", validStores);

    const response = {
      company_id: companyId,
      stores: validStores
    };
    console.log("Final response:", response);
    console.log("=== End Debug ===");

    res.json(response);
  } catch (error: any) {
    console.error("=== API Error ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.log("=== End Error Debug ===");
    
    res.status(500).json({
      error: "Failed to fetch company stores",
      message: error.message
    });
  }
}

/**
 * 会社にストアを追加
 */
export async function POST(
  req: AddStoreRequest,
  res: MedusaResponse
) {
  const { id: companyId } = req.params;
  const { store_id: storeId } = req.body;

  if (!storeId) {
    res.status(400).json({
      error: "store_id is required"
    });
    return;
  }

  try {
    // ワークフローを実行
    const { result } = await addStoreToCompanyWorkflow(req.scope).run({
      input: {
        companyId,
        storeId
      }
    });

    res.status(201).json({
      message: "Store added to company successfully",
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to add store to company",
      message: error.message
    });
  }
}

/**
 * 会社からストアを削除
 */
export async function DELETE(
  req: RemoveStoreRequest,
  res: MedusaResponse
) {
  const { id: companyId } = req.params;
  const { store_id: storeId } = req.body;

  if (!storeId) {
    res.status(400).json({
      error: "store_id is required"
    });
    return;
  }

  try {
    // ワークフローを実行
    const { result } = await removeStoreFromCompanyWorkflow(req.scope).run({
      input: {
        companyId,
        storeId
      }
    });

    res.json({
      message: "Store removed from company successfully",
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to remove store from company",
      message: error.message
    });
  }
}
