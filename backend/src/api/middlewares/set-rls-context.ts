import {
  AuthenticatedMedusaRequest,
  MedusaNextFunction,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * RLSコンテキスト設定ミドルウェア
 * 認証されたユーザーの情報をPostgreSQLのcurrent_settingに設定
 */
export const setRLSContext = () => {
  return async (
    req: AuthenticatedMedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) => {
    const { auth_identity_id } = req.auth_context;
    
    console.log("=== RLS Context Setting =======");
    console.log(" auth_identity_id:", auth_identity_id);
    
    if (!auth_identity_id) {
      console.log(" auth_identity_idが見つからない為、RLS context settingをスキップ");
      return next();
    }

    try {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
      
      // Medusaのデータベース接続を取得
      const dbConnection = req.scope.resolve("__pg_connection__");

      // provider_identityテーブルからユーザーのemailを取得
      const {
        data: [providerIdentity],
      } = await query.graph({
        entity: "provider_identity",
        fields: ["id", "entity_id", "user_metadata"],
        filters: { auth_identity_id } as any,
      });

      if (!providerIdentity) {
        console.log(" provider_identityテーブルに存在しない auth_identity_id:", auth_identity_id);
        return next();
      }

      const userEmail = providerIdentity.entity_id;
      console.log(" RLSコンテキストに設定 user:", userEmail);

      // PostgreSQLのセッション変数にユーザーEmailを設定
      await dbConnection.raw(
        "SELECT set_config('app.current_user_email', ?, false)",
        [userEmail]
      );

      console.log(" RLSコンテキストが正常に設定されました:", userEmail);
      console.log(" Userのuser_metadata:", providerIdentity.user_metadata);

      // デバッグ用：設定後の値を確認
      const result = await dbConnection.raw(
        "SELECT current_setting('app.current_user_email', true) as email, get_current_user_role() as role, get_current_user_company_id() as company_id"
      );
      console.log(" RLSコンテキスト検証:", result.rows[0]);

    } catch (error) {
      console.error("RLSコンテキスト設定中にエラーが発生しました:", error);
      // エラーがあってもリクエストを継続
    }

    return next();
  };
};
