import { getCompanies } from "@/lib/data/admin"
import CompaniesTemplate from "@/modules/admin/templates/companies-template"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "企業一覧",
  description: "企業管理",
}

export default async function CompaniesPage() {
  let companies = []
  
  try {
    const data = await getCompanies()
    companies = data.companies
  } catch (error) {
    // 認証エラーの場合はログインページにリダイレクト
    redirect("/admin/login")
  }

  return <CompaniesTemplate companies={companies} />
}