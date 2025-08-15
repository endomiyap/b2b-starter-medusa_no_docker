// 簡単なユーザー作成スクリプト
console.log("=== 簡単なユーザー作成スクリプト ===");

const { MedusaModule } = require("@medusajs/framework/modules-sdk");
const { Modules, ContainerRegistrationKeys } = require("@medusajs/framework/utils");

async function createSimpleUser() {
  try {
    console.log("1. 設定を読み込み中...");
    
    // medusa-config.jsからの設定読み込み
    const config = require("./medusa-config");
    console.log("設定読み込み完了");
    
    console.log("2. コンテナを初期化中...");
    const container = MedusaModule.createMedusaContainer({}, config);
    console.log("コンテナ初期化完了");
    
    console.log("3. サービスを取得中...");
    const authModuleService = container.resolve(Modules.AUTH);
    const customerModuleService = container.resolve(Modules.CUSTOMER);
    console.log("サービス取得完了");
    
    console.log("4. Platform Adminユーザーの作成...");
    
    // Customer作成
    let customer;
    try {
      customer = await customerModuleService.createCustomers([{
        email: "test_admin@example.com",
        first_name: "Test",
        last_name: "Admin",
        has_account: true,
      }]);
      console.log("Customer作成成功:", customer[0].id);
    } catch (error) {
      console.log("Customer作成エラー（既存の可能性）:", error.message);
      const customers = await customerModuleService.listCustomers({
        email: "test_admin@example.com",
      });
      customer = customers;
      console.log("既存のCustomer使用:", customer[0]?.id);
    }
    
    // Auth Identity作成
    try {
      const authIdentity = await authModuleService.createAuthIdentities([{}]);
      console.log("Auth Identity作成成功:", authIdentity[0].id);
      
      // Provider Identity作成
      const providerIdentity = await authModuleService.createProviderIdentities([{
        auth_identity_id: authIdentity[0].id,
        provider: "emailpass",
        entity_id: "test_admin@example.com",
        user_metadata: {
          role: "platform_admin",
        },
      }]);
      console.log("Provider Identity作成成功:", providerIdentity[0].id);
      
    } catch (error) {
      console.log("Auth作成エラー:", error.message);
    }
    
    console.log("5. ユーザー作成完了！");
    console.log("テスト用ログイン情報:");
    console.log("Email: test_admin@example.com");
    console.log("Password: supersecret");
    
  } catch (error) {
    console.error("スクリプト実行エラー:", error);
  }
}

createSimpleUser();