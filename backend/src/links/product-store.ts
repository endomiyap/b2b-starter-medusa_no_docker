import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/product";
import StoreModule from "@medusajs/store";

// 商品とストアの関連付けリンク定義
export default defineLink(
  ProductModule.linkable.product,
  {
    linkable: StoreModule.linkable.store,
    isList: true, // 1つの商品が複数のストアで販売可能
  }
);