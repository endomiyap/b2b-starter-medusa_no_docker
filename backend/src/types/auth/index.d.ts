import { AuthContext } from "@medusajs/framework";

declare module "@medusajs/framework" {
  interface AuthContext {
    user_role?: string;
    company_id?: string;
    store_ids?: string[];
  }
}