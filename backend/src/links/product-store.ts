import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/product";
import StoreModule from "@medusajs/store";

// 商品とストアの関連付けリンク定義
const ProductStoreLink = defineLink(
  ProductModule.linkable.product,
  {
    linkable: StoreModule.linkable.store,
    isList: true, // 1つの商品が複数のストアで販売可能
  }
);

// entryPointを追加（リンクテーブルへの直接アクセス用）
export const productStoreEntryPoint = "product_product_store_store";

export default ProductStoreLink;