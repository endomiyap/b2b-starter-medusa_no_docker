import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { UserRole, UserMetadata } from "./check-permissions";
import { hasPermission } from "../../utils/auth-utils";

/**
 * 既存のensureRole - 下位互換性を保持
 */
export const ensureRole = (role: string) => {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const { auth_identity_id } = req.auth_context;
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    const {
      data: [company],
    } = await query.graph({
      entity: "companies",
      fields: ["id", "employees.id"],
      filters: { id: req.params.id },
    });

    if (company?.employees?.length === 0) {
      return next();
    }

    const {
      data: [providerIdentity],
    } = await query.graph({
      entity: "provider_identity",
      fields: ["id", "user_metadata"],
      filters: { auth_identity_id } as any,
    });

    if (providerIdentity.user_metadata?.role === role) {
      return next();
    }

    return res.status(403).json({ message: "Forbidden" });
  };
};

/**
 * 階層権限対応の新しいensureRole
 */
export const ensureHierarchicalRole = (requiredRole: UserRole) => {
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
      fields: ["id", "user_metadata"],
      filters: { auth_identity_id } as any,
    });

    if (!providerIdentity) {
      return res.status(403).json({ message: "No permission data found" });
    }

    const userMetadata = providerIdentity.user_metadata as UserMetadata;
    const userRole = userMetadata?.role || "company_user";

    // 階層権限チェック
    if (!hasPermission(userRole, requiredRole)) {
      return res.status(403).json({ 
        message: `Insufficient permissions. Required: ${requiredRole}, Current: ${userRole}` 
      });
    }

    // リクエストコンテキストに権限情報を追加
    req.auth_context.user_role = userRole;
    req.auth_context.company_id = userMetadata?.company_id;
    req.auth_context.store_ids = userMetadata?.store_ids || [];

    return next();
  };
};

/**
 * 会社アクセス権限チェック付きのrole確認
 */
export const ensureRoleWithCompanyAccess = (requiredRole: UserRole) => {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    // まず階層権限をチェック
    await ensureHierarchicalRole(requiredRole)(req, res, async () => {
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
    });
  };
};
