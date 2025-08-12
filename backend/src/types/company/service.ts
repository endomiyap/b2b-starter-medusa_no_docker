import {
  BaseFilterable,
  Context,
  FindConfig,
  IModuleService,
  RestoreReturn,
} from "@medusajs/types";
import {
  ModuleCompany,
  ModuleCreateCompany,
  ModuleCreateEmployee,
  ModuleEmployee,
  ModuleUpdateCompany,
  ModuleUpdateEmployee,
} from "./module";

export interface ModuleCompanyFilters
  extends BaseFilterable<ModuleCompanyFilters> {
  q?: string;
  id?: string | string[];
}

export interface ModuleEmployeeFilters
  extends BaseFilterable<ModuleEmployeeFilters> {
  q?: string;
  id?: string | string[];
  company_id?: string | string[];
  customer_id?: string | string[];
}

/**
 * The main service interface for the Company Module.
 */
export interface ICompanyModuleService extends IModuleService {
  /* Entity: Companies */
  createCompanies(
    data: ModuleCreateCompany,
    sharedContext?: Context
  ): Promise<ModuleCompany>;

  createCompanies(
    data: ModuleCreateCompany[],
    sharedContext?: Context
  ): Promise<ModuleCompany[]>;

  retrieveCompany(
    id: string,
    config?: FindConfig<ModuleCompany>,
    sharedContext?: Context
  ): Promise<ModuleCompany>;

  updateCompanies(
    data: ModuleUpdateCompany,
    sharedContext?: Context
  ): Promise<ModuleCompany>;

  updateCompanies(
    data: ModuleUpdateCompany[],
    sharedContext?: Context
  ): Promise<ModuleCompany[]>;

  listCompanies(
    filters?: ModuleCompanyFilters,
    config?: FindConfig<ModuleCompany>,
    sharedContext?: Context
  ): Promise<ModuleCompany[]>;

  deleteCompanies(ids: string[], sharedContext?: Context): Promise<void>;

  softDeleteCompanies(ids: string[], sharedContext?: Context): Promise<void>;

  restoreCompanies<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: RestoreReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<TReturnableLinkableKeys, string[]> | void>;

  /* Entity: Employees */

  listEmployees(
    filters?: ModuleEmployeeFilters,
    config?: FindConfig<ModuleEmployee>,
    sharedContext?: Context
  ): Promise<ModuleEmployee[]>;

  retrieveEmployee(
    id: string,
    config?: FindConfig<ModuleEmployee>,
    sharedContext?: Context
  ): Promise<ModuleEmployee>;

  createEmployees(
    data: ModuleCreateEmployee,
    sharedContext?: Context
  ): Promise<ModuleEmployee>;

  updateEmployees(
    data: ModuleUpdateEmployee,
    sharedContext?: Context
  ): Promise<ModuleEmployee>;

  deleteEmployees(ids: string[], sharedContext?: Context): Promise<void>;

  softDeleteEmployees(ids: string[], sharedContext?: Context): Promise<void>;

  restoreEmployees<TReturnableLinkableKeys extends string = string>(
    ids: string[],
    config?: RestoreReturn<TReturnableLinkableKeys>,
    sharedContext?: Context
  ): Promise<Record<TReturnableLinkableKeys, string[]> | void>;

  /* Store Management Extensions */
  
  /**
   * 会社にストアを追加
   */
  addStore(companyId: string, storeId: string, context?: Context): Promise<void>;

  /**
   * 会社からストアを削除
   */
  removeStore(companyId: string, storeId: string, context?: Context): Promise<void>;

  /**
   * 会社に関連付けられた全ストアを取得
   */
  getStores(companyId: string, context?: Context): Promise<any[]>;

  /**
   * 指定されたストアを所有する会社を取得
   */
  getCompanyByStore(storeId: string, context?: Context): Promise<any | null>;
}

// Store関連の型定義
export interface StoreInfo {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyStoreLink {
  id: string;
  company_id: string;
  store_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface CompanyStoresResponse {
  company_id: string;
  stores: StoreInfo[];
}
