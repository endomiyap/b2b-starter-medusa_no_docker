// 認証データのデバッグスクリプト
const { MedusaModule } = require("@medusajs/framework/modules-sdk");
const { ContainerRegistrationKeys, Modules } = require("@medusajs/framework/utils");

async function debugAuth() {
  console.log("=== 認証データのデバッグ開始 ===");
  
  try {
    // Medusaの設定を読み込み
    const { configModule } = await import("./medusa-config.ts");
    
    console.log("設定ファイルを読み込みました");
    
    // コンテナを初期化
    const container = MedusaModule.createMedusaContainer({}, configModule);
    
    console.log("コンテナを初期化しました");
    
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const authModuleService = container.resolve(Modules.AUTH);
    
    console.log("サービスを取得しました");
    
    // 既存のauth_identityを確認
    console.log("\n=== Auth Identities ===");
    const identities = await authModuleService.listAuthIdentities();
    console.log(`Auth Identities数: ${identities.length}`);
    
    // 既存のprovider_identityを確認
    console.log("\n=== Provider Identities ===");
    const providers = await authModuleService.listProviderIdentities();
    console.log(`Provider Identities数: ${providers.length}`);
    
    for (const provider of providers) {
      console.log(`- ID: ${provider.id}, Provider: ${provider.provider}, Entity: ${provider.entity_id}`);
      console.log(`  Metadata: ${JSON.stringify(provider.user_metadata)}`);
    }
    
    // 会社データを確認
    console.log("\n=== Companies ===");
    const companies = await query.graph({
      entity: "companies",
      fields: ["id", "name", "email"],
    });
    console.log(`会社数: ${companies.data.length}`);
    for (const company of companies.data) {
      console.log(`- ${company.name} (${company.id})`);
    }
    
    // Customerデータを確認
    console.log("\n=== Customers ===");
    const customerModuleService = container.resolve(Modules.CUSTOMER);
    const customers = await customerModuleService.listCustomers();
    console.log(`Customer数: ${customers.length}`);
    for (const customer of customers) {
      console.log(`- ${customer.email} (${customer.id})`);
    }
    
  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
  
  console.log("=== デバッグ完了 ===");
}

debugAuth();