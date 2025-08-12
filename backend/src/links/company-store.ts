import { defineLink } from "@medusajs/framework/utils";
import StoreModule from "@medusajs/store";
import CompanyModule from "../modules/company";

// TODO 確認用
console.log("[LINK DBG] company linkable:", CompanyModule?.linkable?.company);
console.log("[LINK DBG] store   linkable:", (StoreModule as any)?.linkable?.store);

export default defineLink(
  CompanyModule.linkable.company,
  {
    linkable: StoreModule.linkable.store,
    isList: true,
  }
);
