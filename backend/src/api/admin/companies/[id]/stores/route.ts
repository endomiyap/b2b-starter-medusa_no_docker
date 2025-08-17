import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { addStoreToCompanyWorkflow, removeStoreFromCompanyWorkflow } from "../../../../../workflows/company/workflows";
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils";

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
    // 代替アプローチ: 企業エンティティから関連ストアを取得
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    
    console.log(">>> Querying company with related stores");
    console.log(">>> Company ID:", companyId);
    
    // 企業エンティティから関連データを取得してみる
    const { data: companies } = await query.graph({
      entity: "company",
      fields: ["id", "stores.*"],
      filters: { id: companyId },
    });
    
    console.log("Company with stores:", companies);
    
    // storeLinksの形式に変換
    const storeLinks = companies?.[0]?.stores?.map((store: any) => ({ store_id: store.id })) || [];
    
    console.log("紐づく Store の store_ids:", storeLinks);
    console.log("紐づく Store 件数:", storeLinks?.length || 0);
    
    if (!storeLinks || storeLinks.length === 0) {
      console.log("No store links found in database, returning empty stores array");
      res.json({
        company_id: companyId,
        stores: []
      });
      return;
    }

    console.log("Processing store links to extract store IDs");
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
    console.log(" >>> Store service resolved:", !!storeService);
    
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

    // Store Adminの場合、担当ストアのみにフィルタリング
    let filteredStores = validStores;
    if (req.auth_context.user_role === "store_admin") {
      const userStoreIds = req.auth_context.store_ids || [];
      console.log("Store Admin detected. Filtering by store_ids:", userStoreIds);
      filteredStores = validStores.filter(store => userStoreIds.includes(store.id));
      console.log("Filtered stores for Store Admin:", filteredStores);
    }

    const response = {
      company_id: companyId,
      stores: filteredStores
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
