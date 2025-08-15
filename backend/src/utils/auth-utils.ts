import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export type UserRole = "platform_admin" | "company_admin" | "store_admin" | "company_user";

// UserMetadataの再定義（Record<string, unknown>を継承）
export interface UserMetadata extends Record<string, unknown> {
  role?: UserRole;
  company_id?: string;
  store_ids?: string[];
}

/**
 * 権限管理ヘルパー関数
 */

/**
 * ユーザーの権限情報を取得
 */
export async function getUserPermissions(authIdentityId: string, container: any): Promise<UserMetadata | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: [providerIdentity] } = await query.graph({
    entity: "provider_identity",
    fields: ["id", "user_metadata"],
    filters: { auth_identity_id: authIdentityId } as any,
  });

  if (!providerIdentity) {
    return null;
  }

  return providerIdentity.user_metadata as UserMetadata;
}

/**
 * employeeからcompany_idとstore_idsを取得してuser_metadataを構築
 */
export async function buildUserMetadataFromEmployee(
  customerEmail: string,
  role: UserRole,
  container: any
): Promise<UserMetadata> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  // customerからemployeeを取得
  const { data: [customer] } = await query.graph({
    entity: "customer",
    fields: ["id", "email"],
    filters: { email: customerEmail },
  });

  if (!customer) {
    throw new Error(`Customer not found with email: ${customerEmail}`);
  }

  // employee-customerリンクからemployeeを取得
  const { data: employeeLinks } = await query.graph({
    entity: "company_employee_customer_customer",
    fields: ["employee_id"],
    filters: { customer_id: customer.id } as any,
  });

  if (!employeeLinks || employeeLinks.length === 0) {
    throw new Error(`Employee not found for customer: ${customerEmail}`);
  }

  // employeeの詳細情報を取得
  const { data: [employee] } = await query.graph({
    entity: "employee",
    fields: ["id", "company_id", "is_admin"],
    filters: { id: employeeLinks[0].employee_id },
  });

  if (!employee) {
    throw new Error(`Employee details not found`);
  }

  // company_adminの場合は自社の全Storeにアクセス可能
  let storeIds: string[] = [];
  if (role === "company_admin" || role === "store_admin") {
    const { data: storeLinks } = await query.graph({
      entity: "company_company_store_store",
      fields: ["store_id"],
      filters: { company_id: employee.company_id } as any,
    });
    storeIds = storeLinks?.map((link: any) => link.store_id) || [];
  }

  return {
    role,
    company_id: employee.company_id,
    store_ids: storeIds,
  };
}

/**
 * user_metadataを更新
 */
export async function updateUserMetadata(
  customerEmail: string,
  metadata: UserMetadata,
  container: any
): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const authModuleService = container.resolve("authModuleService");

  // provider_identityを取得
  const { data: [providerIdentity] } = await query.graph({
    entity: "provider_identity",
    fields: ["id"],
    filters: {
      provider: "emailpass",
      entity_id: customerEmail,
    },
  });

  if (!providerIdentity) {
    throw new Error(`Provider identity not found for email: ${customerEmail}`);
  }

  // user_metadataを更新
  await authModuleService.updateProviderIdentities([
    {
      id: providerIdentity.id,
      user_metadata: metadata,
    },
  ]);
}

/**
 * 権限レベルのチェック
 */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy = {
    "platform_admin": 4,
    "company_admin": 3,
    "store_admin": 2,
    "company_user": 1,
  };

  return hierarchy[userRole] >= hierarchy[requiredRole];
}

/**
 * ユーザーが特定の会社にアクセスできるかチェック
 */
export function canAccessCompany(
  userRole: UserRole,
  userCompanyId: string | undefined,
  targetCompanyId: string
): boolean {
  if (userRole === "platform_admin") {
    return true;
  }

  return userCompanyId === targetCompanyId;
}

/**
 * ユーザーが特定のStoreにアクセスできるかチェック
 */
export function canAccessStore(
  userRole: UserRole,
  userCompanyId: string | undefined,
  userStoreIds: string[] | undefined,
  targetStoreId: string
): boolean {
  if (userRole === "platform_admin") {
    return true;
  }

  if (userRole === "company_admin") {
    // Company Adminは自社の全Storeにアクセス可能（実際のチェックはDB経由で行う）
    return true;
  }

  return userStoreIds?.includes(targetStoreId) || false;
}

/**
 * 権限情報の表示用フォーマット
 */
export function formatUserPermissions(metadata: UserMetadata): string {
  const { role, company_id, store_ids } = metadata;
  
  let description = `Role: ${role}`;
  
  if (company_id) {
    description += `\nCompany: ${company_id}`;
  }
  
  if (store_ids && store_ids.length > 0) {
    description += `\nStores: ${store_ids.join(", ")}`;
  }
  
  return description;
}