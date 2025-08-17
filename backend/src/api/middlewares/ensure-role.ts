import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { hasPermission, UserMetadata, UserRole } from "../../utils/auth-utils";

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
 * 指定した役割を持つユーザーのみがアクセスできるようにするミドルウェア
 * 階層権限対応の新しいensureRole
 */
export const ensureHierarchicalRole = (requiredRole: UserRole) => {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const { auth_identity_id } = req.auth_context;
    
    console.log("=== ensureHierarchicalRole デバッグ ===");
    console.log("Required Role:", requiredRole);
    console.log("Auth Context:", JSON.stringify(req.auth_context, null, 2));
    console.log("Auth Identity ID:", auth_identity_id);
    
    if (!auth_identity_id) {
      console.log(" Auth Identity ID が存在しません");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

    // ユーザーの権限情報を取得
    const {
      data: [providerIdentity],
    } = await query.graph({
      entity: "provider_identity",
      fields: ["id", "user_metadata", "entity_id", "provider"],
      filters: { auth_identity_id } as any,
    });

    console.log("Provider Identity データ:", JSON.stringify(providerIdentity, null, 2));

    if (!providerIdentity) {
      console.log(" Provider Identity が見つかりません");
      return res.status(403).json({ message: "No permission data found" });
    }

    const userMetadata = providerIdentity.user_metadata as UserMetadata;
    const userRole = userMetadata?.role || "employee_user";
    
    console.log("User Metadata:", JSON.stringify(userMetadata, null, 2));
    console.log("User Role:", userRole);

    // 階層権限チェック
    const hasPermissionResult = hasPermission(userRole, requiredRole);
    console.log(`権限チェック結果: ${hasPermissionResult} (${userRole} >= ${requiredRole})`);
    
    if (!hasPermissionResult) {
      console.log(" 権限不足で拒否");
      return res.status(403).json({ 
        message: `権限がありません。必要なロール: ${requiredRole}, あなたのロール: ${userRole}` 
      });
    }

    // リクエストコンテキストに権限情報を追加
    req.auth_context.user_role = userRole;
    req.auth_context.company_id = userMetadata?.company_id;
    req.auth_context.store_ids = userMetadata?.store_ids || [];

    console.log(" 権限チェック成功、次の処理に進みます");
    console.log("=== ensureHierarchicalRole デバッグ終了 ===");
    
    return next();
  };
};

interface CompanyRequestBody {
  company_id?: string;
}

/**
 * 会社アクセス権限チェック付きのrole確認
 */
export const ensureRoleWithCompanyAccess = (requiredRole: UserRole) => {
  return async (
    req: AuthenticatedMedusaRequest<CompanyRequestBody>,
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
          message: "Access denied: 自社の情報にのみアクセスできます" 
        });
      }

      return next();
    });
  };
};
