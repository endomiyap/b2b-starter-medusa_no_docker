import { MedusaContainer, IAuthModuleService, ICustomerModuleService } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { buildUserMetadataFromEmployee, updateUserMetadata, UserMetadata, UserRole } from "../utils/auth-utils";

interface ICompanyModuleService {
  createEmployees(data: any[]): Promise<any[]>;
}

interface ILinkModuleService {
  create(data: any): Promise<void>;
}

/**
 * 階層的ユーザー作成・権限設定スクリプト
 */

async function createHierarchicalUsers({ container }: { container: MedusaContainer }) {
  console.log("階層的権限管理ユーザーの作成を開始...");
  
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const authModuleService = container.resolve(Modules.AUTH);
  const customerModuleService = container.resolve(Modules.CUSTOMER);

  console.log("サービスの初期化が完了しました。");

  try {
    // 1. Platform Admin ユーザーの作成
    console.log("\n1. Platform Admin ユーザーの作成...");
    
    const platformAdminEmail = "saas_admin@example.com";
    const platformAdminPassword = "supersecret";

    // Platform Admin用のcustomer作成
    let platformCustomer;
    try {
      const existingCustomers = await customerModuleService.listCustomers({
        email: platformAdminEmail,
      });
      
      if (existingCustomers.length === 0) {
        platformCustomer = await customerModuleService.createCustomers([{
          email: platformAdminEmail,
          first_name: "SaaS",
          last_name: "Administrator",
          has_account: true,
        }]);
        console.log(`Platform Admin customer created: ${platformAdminEmail}`);
      } else {
        platformCustomer = existingCustomers;
        console.log(`Platform Admin customer already exists: ${platformAdminEmail}`);
      }
    } catch (error) {
      console.log(`Platform Admin customer already exists: ${platformAdminEmail}`);
    }

    // Platform Admin用のauth_identity作成
    try {
      const authIdentity = await authModuleService.createAuthIdentities([{}]);

      // provider_identity作成
      const providerIdentity = await authModuleService.createProviderIdentities([{
        auth_identity_id: authIdentity[0].id,
        provider: "emailpass",
        entity_id: platformAdminEmail,
        user_metadata: {
          role: "platform_admin" as UserRole,
        },
      }]);

      console.log(`Platform Admin created successfully`);
    } catch (error) {
      console.log(`Platform Admin auth already exists: ${error.message}`);
    }

    // 2. 既存の会社データから Company Admin を作成
    console.log("\n2. Company Admin ユーザーの作成...");
    
    const companies = await query.graph({
      entity: "companies",
      fields: ["id", "name", "email"],
    });

    for (const company of companies.data) {
      const companyAdminEmail = `${company.name.toLowerCase().replace(/\s+/g, '')}_admin@example.com`;
      
      console.log(`Creating Company Admin for ${company.name}: ${companyAdminEmail}`);

      // Company Admin用のcustomer作成
      let companyCustomer;
      try {
        companyCustomer = await customerModuleService.createCustomers([{
          email: companyAdminEmail,
          first_name: company.name,
          last_name: "Admin",
          has_account: true,
        }]);
        console.log(`Company Admin customer created: ${companyAdminEmail}`);
      } catch (error) {
        const existingCustomers = await customerModuleService.listCustomers({
          email: companyAdminEmail,
        });
        companyCustomer = existingCustomers;
        console.log(`Company Admin customer already exists: ${companyAdminEmail}`);
      }

      // employee作成
      let employee;
      try {
        const employeeModuleService = container.resolve("companyModuleService") as ICompanyModuleService;
        employee = await employeeModuleService.createEmployees([{
          company_id: company.id,
          is_admin: true,
          spending_limit: 1000000,
        }]);

        // employee-customerリンク作成
        const linkModuleService = container.resolve("linkModuleService") as ILinkModuleService;
        await linkModuleService.create({
          [`companyModuleService_employee`]: {
            employee_id: employee[0].id,
          },
          [`customerModuleService_customer`]: {
            customer_id: companyCustomer[0].id,
          },
        });

        console.log(`Employee created and linked to customer`);
      } catch (error) {
        console.log(`Employee creation failed: ${error.message}`);
        continue;
      }

      // auth_identity作成
      try {
        const authIdentity = await authModuleService.createAuthIdentities([{}]);

        // user_metadataを構築
        const metadata = await buildUserMetadataFromEmployee(
          companyAdminEmail,
          "company_admin",
          container
        );

        // provider_identity作成
        await authModuleService.createProviderIdentities([{
          auth_identity_id: authIdentity[0].id,
          provider: "emailpass",
          entity_id: companyAdminEmail,
          user_metadata: metadata,
        }]);

        console.log(`Company Admin created: ${companyAdminEmail} for company ${company.name}`);
      } catch (error) {
        console.log(`Company Admin auth creation failed: ${error.message}`);
      }
    }

    // 3. Store Admin ユーザーの作成例（会社Aのストア毎）
    console.log("\n3. Store Admin ユーザーの作成例...");
    
    // 会社AのStore一覧を取得
    const companyA = companies.data.find(c => c.name.includes("会社A"));
    if (companyA) {
      const { data: storeLinks } = await query.graph({
        entity: "company_company_store_store",
        fields: ["store_id"],
        filters: { company_id: companyA.id } as any,
      });

      for (const storeLink of storeLinks) {
        const { data: [store] } = await query.graph({
          entity: "store",
          fields: ["id", "name"],
          filters: { id: storeLink.store_id },
        });

        const storeAdminEmail = `${store.name.toLowerCase().replace(/\s+/g, '')}_admin@example.com`;
        
        console.log(`Creating Store Admin for ${store.name}: ${storeAdminEmail}`);

        try {
          // Store Admin用のcustomer作成
          const storeCustomer = await customerModuleService.createCustomers([{
            email: storeAdminEmail,
            first_name: store.name,
            last_name: "Admin",
            has_account: true,
          }]);

          // employee作成
          const employeeModuleService = container.resolve("companyModuleService") as ICompanyModuleService;
          const storeEmployee = await employeeModuleService.createEmployees([{
            company_id: companyA.id,
            is_admin: false,
            spending_limit: 500000,
          }]);

          // employee-customerリンク作成
          const linkModuleService = container.resolve("linkModuleService") as ILinkModuleService;
          await linkModuleService.create({
            [`companyModuleService_employee`]: {
              employee_id: storeEmployee[0].id,
            },
            [`customerModuleService_customer`]: {
              customer_id: storeCustomer[0].id,
            },
          });

          // auth_identity作成
          const authIdentity = await authModuleService.createAuthIdentities([{}]);

          // store_admin権限を設定（特定のStoreのみアクセス可能）
          const metadata = {
            role: "store_admin" as UserRole,
            company_id: companyA.id,
            store_ids: [store.id],
          };

          // provider_identity作成
          await authModuleService.createProviderIdentities([{
            auth_identity_id: authIdentity[0].id,
            provider: "emailpass",
            entity_id: storeAdminEmail,
            user_metadata: metadata,
          }]);

          console.log(`Store Admin created: ${storeAdminEmail} for store ${store.name}`);
        } catch (error) {
          console.log(`Store Admin creation failed: ${error.message}`);
        }
      }
    }

    console.log("\n階層的権限管理ユーザーの作成が完了しました！");
    
    // 作成されたユーザーの一覧表示
    console.log("\n=== 作成されたユーザー一覧 ===");
    console.log("Platform Admin: saas_admin@example.com (全システム管理)");
    
    for (const company of companies.data) {
      const companyAdminEmail = `${company.name.toLowerCase().replace(/\s+/g, '')}_admin@example.com`;
      console.log(`Company Admin: ${companyAdminEmail} (${company.name}管理)`);
    }
    
    if (companyA) {
      const { data: storeLinks } = await query.graph({
        entity: "company_company_store_store",
        fields: ["store_id"],
        filters: { company_id: companyA.id } as any,
      });

      for (const storeLink of storeLinks) {
        const { data: [store] } = await query.graph({
          entity: "store",
          fields: ["id", "name"],
          filters: { id: storeLink.store_id },
        });

        const storeAdminEmail = `${store.name.toLowerCase().replace(/\s+/g, '')}_admin@example.com`;
        console.log(`Store Admin: ${storeAdminEmail} (${store.name}管理)`);
      }
    }

  } catch (error) {
    console.error("エラーが発生しました:", error);
  }
}

export default createHierarchicalUsers;

// スクリプトの直接実行時の処理
if (require.main === module) {
  const { MedusaModule } = require("@medusajs/framework/modules-sdk");
  const { configModule } = require("../../medusa-config");
  
  async function run() {
    console.log("=== 直接実行モード ===");
    
    try {
      const container = MedusaModule.createMedusaContainer({}, configModule);
      await createHierarchicalUsers({ container });
    } catch (error) {
      console.error("スクリプト実行エラー:", error);
    }
  }
  
  run();
}