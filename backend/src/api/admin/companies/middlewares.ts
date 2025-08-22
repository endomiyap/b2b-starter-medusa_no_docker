import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import {
  adminApprovalSettingsQueryConfig,
  adminCompanyQueryConfig,
  adminEmployeeQueryConfig,
} from "./query-config";
import {
  AdminCreateCompany,
  AdminCreateEmployee,
  AdminGetApprovalSettingsParams,
  AdminGetCompanyParams,
  AdminGetEmployeeParams,
  AdminUpdateApprovalSettings,
  AdminUpdateCompany,
  AdminUpdateEmployee,
} from "./validators";
import { ensureHierarchicalRole, ensureRoleWithCompanyAccess } from "../../middlewares/ensure-role";
import { preloadCompanyStoreLinks } from "../../middlewares/check-permissions";
import { setRLSContext } from "../../middlewares/set-rls-context";

export const adminCompaniesMiddlewares: MiddlewareRoute[] = [
  /* Companies Middlewares */
  {
    method: ["GET"],
    matcher: "/admin/companies",
    middlewares: [
      // RLSコンテキスト設定（最優先で実行）
      setRLSContext(),
      // TODO 動作確認用 console
      // デバッグ用ミドルウェアを最初に追加
      (req: any, res: any, next: any) => {
        console.log("=== Middleware デバッグ ===");
        console.log("Auth context:", req.auth_context);
        console.log("Headers:", req.headers);
        next();
      },
      ensureHierarchicalRole("company_admin"), // Company Admin以上
      validateAndTransformQuery(
        AdminGetCompanyParams,
        adminCompanyQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/companies",
    middlewares: [
      ensureHierarchicalRole("platform_admin"), // Platform Adminのみ
      validateAndTransformBody(AdminCreateCompany),
      validateAndTransformQuery(
        AdminGetCompanyParams,
        adminCompanyQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/companies/:id",
    middlewares: [
      // RLSコンテキスト設定（最優先で実行）
      setRLSContext(),
      ensureRoleWithCompanyAccess("company_admin"), // 会社アクセス権チェック
      validateAndTransformQuery(
        AdminGetCompanyParams,
        adminCompanyQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/companies/:id",
    middlewares: [
      ensureRoleWithCompanyAccess("company_admin"), // 会社アクセス権チェック
      validateAndTransformBody(AdminUpdateCompany),
      validateAndTransformQuery(
        AdminGetCompanyParams,
        adminCompanyQueryConfig.retrieve
      ),
    ],
  },

  /* Employees Middlewares */
  {
    method: ["GET"],
    matcher: "/admin/companies/:id/employees",
    middlewares: [
      ensureRoleWithCompanyAccess("company_admin"), // 会社アクセス権チェック
      validateAndTransformQuery(
        AdminGetEmployeeParams,
        adminEmployeeQueryConfig.list
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/companies/:id/employees",
    middlewares: [
      ensureRoleWithCompanyAccess("company_admin"), // 会社アクセス権チェック
      validateAndTransformBody(AdminCreateEmployee),
      validateAndTransformQuery(
        AdminGetEmployeeParams,
        adminEmployeeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/companies/:id/employees/:employee_id",
    middlewares: [
      ensureRoleWithCompanyAccess("company_admin"), // 会社アクセス権チェック
      validateAndTransformQuery(
        AdminGetEmployeeParams,
        adminEmployeeQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/companies/:id/employees/:employee_id",
    middlewares: [
      ensureRoleWithCompanyAccess("company_admin"), // 会社アクセス権チェック
      validateAndTransformBody(AdminUpdateEmployee),
      validateAndTransformQuery(
        AdminGetEmployeeParams,
        adminEmployeeQueryConfig.retrieve
      ),
    ],
  },
  /* Approval Settings Middlewares */
  {
    method: ["POST"],
    matcher: "/admin/companies/:id/approval-settings",
    middlewares: [
      ensureRoleWithCompanyAccess("company_admin"), // 会社アクセス権チェック
      validateAndTransformBody(AdminUpdateApprovalSettings),
      validateAndTransformQuery(
        AdminGetApprovalSettingsParams,
        adminApprovalSettingsQueryConfig.retrieve
      ),
    ],
  },

  /* Stores Middlewares */
  {
    method: ["GET"],
    matcher: "/admin/companies/:id/stores",
    middlewares: [
      preloadCompanyStoreLinks(), // ストアリンクを事前取得
      ensureRoleWithCompanyAccess("store_admin"), // store_admin以上 + 会社アクセス権チェック
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/companies/:id/stores",
    middlewares: [
      ensureRoleWithCompanyAccess("company_admin"), // 会社アクセス権チェック
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/companies/:id/stores",
    middlewares: [
      ensureRoleWithCompanyAccess("company_admin"), // 会社アクセス権チェック
    ],
  },
];
