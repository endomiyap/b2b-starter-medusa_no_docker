import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/**
 * 会社からストアを削除するステップ
 */
const removeStoreFromCompanyStep = createStep(
  "remove-store-from-company",
  async (data: { companyId: string; storeId: string }, { container }) => {
    const linkService = container.resolve("link");

    // リンクが存在するか確認
    const existingLinks = await linkService.list({
      company: { company_id: data.companyId },
      store: { store_id: data.storeId }
    });

    if (existingLinks.length === 0) {
      throw new Error(`Store ${data.storeId} is not linked to company ${data.companyId}`);
    }

    // Company-Store リンクを削除
    await linkService.dismiss({
      company: { company_id: data.companyId },
      store: { store_id: data.storeId }
    });

    return new StepResponse(
      { success: true },
      {
        companyId: data.companyId,
        storeId: data.storeId,
        removedLink: existingLinks[0]
      }
    );
  },
  async (data: { companyId: string; storeId: string; removedLink: any }, { container }) => {
    const linkService = container.resolve("link");

    // ロールバック: リンクを復元
    await linkService.create({
      company: { company_id: data.companyId },
      store: { store_id: data.storeId }
    });
  }
);

/**
 * 会社からストアを削除するワークフロー
 */
export const removeStoreFromCompanyWorkflow = createWorkflow(
  "remove-store-from-company",
  (input: { companyId: string; storeId: string }) => {
    const result = removeStoreFromCompanyStep(input);

    return new WorkflowResponse({
      companyId: input.companyId,
      storeId: input.storeId,
      success: result.success
    });
  }
);
