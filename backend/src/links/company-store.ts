import { defineLink } from "@medusajs/framework/utils";
import StoreModule from "@medusajs/store";
import CompanyModule from "../modules/company";

// TODO 確認用
console.log("[LINK DBG] company linkable:", CompanyModule?.linkable?.company);
console.log("[LINK DBG] store   linkable:", (StoreModule as any)?.linkable?.store);

const CompanyStoreLink = defineLink(
  CompanyModule.linkable.company,
  {
    linkable: StoreModule.linkable.store,
    isList: true,
  }
);

// entryPointを追加（リンクテーブルへの直接アクセス用）
// TODO 削除
// export const companyStoreEntryPoint = "company_company_store_store";

export default CompanyStoreLink;
