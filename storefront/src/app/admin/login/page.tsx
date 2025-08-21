import AdminLoginTemplate from "@/modules/admin/templates/login-template"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Log in to admin panel",
}

export default function AdminLoginPage() {
  return <AdminLoginTemplate />
}