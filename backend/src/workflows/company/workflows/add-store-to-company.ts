import { createWorkflow, WorkflowResponse } from "@medusajs/workflows-sdk";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";

/**
 * 会社にストアを追加するステップ
 */
const addStoreToCompanyStep = createStep(
  "add-store-to-company",
  async (data: { companyId: string; storeId: string }, { container }) => {
    const linkService = container.resolve("link");

    // Company-Store リンクを作成
    const link = await linkService.create({
      company: { company_id: data.companyId },
      store: { store_id: data.storeId }
    });

    return new StepResponse(link, {
      companyId: data.companyId,
      storeId: data.storeId
    });
  },
  async (data: { companyId: string; storeId: string }, { container }) => {
    const linkService = container.resolve("link");

    // ロールバック: リンクを削除
    await linkService.dismiss({
      company: { company_id: data.companyId },
      store: { store_id: data.storeId }
    });
  }
);

/**
 * 会社にストアを追加するワークフロー
 */
export const addStoreToCompanyWorkflow = createWorkflow(
  "add-store-to-company",
  (input: { companyId: string; storeId: string }) => {
    const result = addStoreToCompanyStep(input);

    return new WorkflowResponse({
      companyId: input.companyId,
      storeId: input.storeId,
      link: result
    });
  }
);
