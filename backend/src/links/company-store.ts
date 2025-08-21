import { defineLink } from "@medusajs/framework/utils";
import StoreModule from "@medusajs/store";
import CompanyModule from "../modules/company";

// StoreModuleのlinkableは公式モジュールなので正しく定義されているはず
// 問題はentryPointの設定にある

const CompanyStoreLink = defineLink(
  CompanyModule.linkable.company,
  {
    linkable: StoreModule.linkable.store,
    isList: true,
  }
);

// entryPointを明示的に設定
// query.graph()でアクセスする際に必要
(CompanyStoreLink as any).entryPoint = "company_company_store_store";

export default CompanyStoreLink;
