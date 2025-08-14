import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export type UserRole = "platform_admin" | "company_admin" | "store_admin" | "company_user";

export interface UserMetadata {
  role?: UserRole;
  company_id?: string;
  store_ids?: string[];
}

// 権限階層の定義
const ROLE_HIERARCHY = {
  "platform_admin": 4,
  "company_admin": 3,
  "store_admin": 2,
  "company_user": 1,
};

/**
 * 階層的権限チェックミドルウェア
 */
export const checkPermissions = (requiredRole?: UserRole) => {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const { auth_identity_id } = req.auth_context;
    
    if (!auth_identity_id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    // ユーザーの権限情報を取得
    const {
      data: [providerIdentity],
    } = await query.graph({
      entity: "provider_identity",
      fields: ["id", "user_metadata", "auth_identity_id"],
      filters: { auth_identity_id } as any,
    });

    if (!providerIdentity) {
      return res.status(403).json({ message: "No permission data found" });
    }

    const userMetadata = providerIdentity.user_metadata as UserMetadata;
    const userRole = userMetadata?.role || "company_user";

    // Platform Adminは全てにアクセス可能
    if (userRole === "platform_admin") {
      req.auth_context.user_role = userRole;
      req.auth_context.company_id = userMetadata?.company_id;
      req.auth_context.store_ids = userMetadata?.store_ids;
      return next();
    }

    // 必要な権限レベルのチェック
    if (requiredRole) {
      if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[requiredRole]) {
        return res.status(403).json({ 
          message: `Insufficient permissions. Required: ${requiredRole}, Current: ${userRole}` 
        });
      }
    }

    // リクエストコンテキストに権限情報を追加
    req.auth_context.user_role = userRole;
    req.auth_context.company_id = userMetadata?.company_id;
    req.auth_context.store_ids = userMetadata?.store_ids || [];

    return next();
  };
};

/**
 * 会社レベルのアクセスチェック
 */
export const checkCompanyAccess = () => {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const userRole = req.auth_context.user_role as UserRole;
    const userCompanyId = req.auth_context.company_id;
    const targetCompanyId = req.params.id || req.body?.company_id;

    // Platform Adminは全てアクセス可能
    if (userRole === "platform_admin") {
      return next();
    }

    // Company Admin以下は自社のみアクセス可能
    if (userCompanyId && targetCompanyId && userCompanyId !== targetCompanyId) {
      return res.status(403).json({ 
        message: "Access denied: You can only access your own company's data" 
      });
    }

    return next();
  };
};

/**
 * Storeレベルのアクセスチェック
 */
export const checkStoreAccess = () => {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const userRole = req.auth_context.user_role as UserRole;
    const userCompanyId = req.auth_context.company_id;
    const userStoreIds = req.auth_context.store_ids as string[];
    const targetStoreId = req.params.storeId || req.body?.store_id;

    // Platform Adminは全てアクセス可能
    if (userRole === "platform_admin") {
      return next();
    }

    // Company Adminは自社の全Storeにアクセス可能
    if (userRole === "company_admin" && userCompanyId) {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
      
      // 対象Storeが自社のものか確認
      const { data: storeLinks } = await query.graph({
        entity: "company_company_store_store",
        fields: ["store_id"],
        filters: { 
          company_id: userCompanyId,
          store_id: targetStoreId 
        } as any,
      });

      if (!storeLinks || storeLinks.length === 0) {
        return res.status(403).json({ 
          message: "Access denied: This store doesn't belong to your company" 
        });
      }
      
      return next();
    }

    // Store Admin以下は許可されたStoreのみアクセス可能
    if (targetStoreId && !userStoreIds?.includes(targetStoreId)) {
      return res.status(403).json({ 
        message: "Access denied: You don't have access to this store" 
      });
    }

    return next();
  };
};