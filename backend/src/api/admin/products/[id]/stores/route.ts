import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";

interface AddProductToStoreRequest extends AuthenticatedMedusaRequest {
  body: {
    store_id: string;
  };
}

interface RemoveProductFromStoreRequest extends AuthenticatedMedusaRequest {
  body: {
    store_id: string;
  };
}

/**
 * 商品のストア一覧を取得
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id: productId } = req.params;
  
  try {
    const linkService = req.scope.resolve("link");

    // Product-Store リンクを取得
    const links = await linkService.list({
      product: { product_id: productId }
    });

    if (links.length === 0) {
      res.json({
        product_id: productId,
        stores: []
      });
      return;
    }

    // ストアIDを取得
    const storeIds = links.map((link: any) => link.store.store_id);
    
    res.json({
      product_id: productId,
      store_ids: storeIds,
      stores: [] // TODO: Store Moduleからストア詳細を取得
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to fetch product stores",
      message: error.message
    });
  }
}

/**
 * 商品をストアに関連付け
 */
export async function POST(
  req: AddProductToStoreRequest,
  res: MedusaResponse
) {
  const { id: productId } = req.params;
  const { store_id: storeId } = req.body;

  if (!storeId) {
    res.status(400).json({
      error: "store_id is required"
    });
    return;
  }

  try {
    const linkService = req.scope.resolve("link");

    // 商品-ストアリンクを作成
    await linkService.create({
      product: { product_id: productId },
      store: { store_id: storeId }
    });

    res.status(201).json({
      message: "Product linked to store successfully",
      product_id: productId,
      store_id: storeId
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to link product to store",
      message: error.message
    });
  }
}

/**
 * 商品からストアの関連付けを削除
 */
export async function DELETE(
  req: RemoveProductFromStoreRequest,
  res: MedusaResponse
) {
  const { id: productId } = req.params;
  const { store_id: storeId } = req.body;

  if (!storeId) {
    res.status(400).json({
      error: "store_id is required"
    });
    return;
  }

  try {
    const linkService = req.scope.resolve("link");

    // 商品-ストアリンクを削除
    await linkService.dismiss({
      product: { product_id: productId },
      store: { store_id: storeId }
    });

    res.json({
      message: "Product unlinked from store successfully",
      product_id: productId,
      store_id: storeId
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to unlink product from store",
      message: error.message
    });
  }
}