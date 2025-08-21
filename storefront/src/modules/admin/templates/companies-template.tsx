"use client"

import { adminLogout } from "@/lib/data/admin"
import Button from "@/modules/common/components/button"
import { Building2, Mail, MapPin, Users, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"

interface Company {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  currency_code?: string
  logo_url?: string
  employees: Array<{
    id: string
    is_admin: boolean
    spending_limit: number
  }>
}

interface CompaniesTemplateProps {
  companies: Company[]
}

const CompaniesTemplate = ({ companies }: CompaniesTemplateProps) => {
  const router = useRouter()

  const handleLogout = async () => {
    await adminLogout()
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                企業管理
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Platform Admin Dashboard
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleLogout}
              className="px-4 py-2"
            >
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Building2 className="h-10 w-10 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">総企業数</p>
                <p className="text-2xl font-bold">{companies.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Users className="h-10 w-10 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">総従業員数</p>
                <p className="text-2xl font-bold">
                  {companies.reduce((acc, company) => acc + company.employees.length, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CreditCard className="h-10 w-10 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">アクティブプラン</p>
                <p className="text-2xl font-bold">{companies.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 企業一覧 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              企業一覧
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    企業名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    連絡先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    所在地
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    従業員数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    通貨
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {company.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {company.id.slice(0, 12)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        {company.email}
                      </div>
                      {company.phone && (
                        <div className="text-sm text-gray-500">
                          {company.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(company.city || company.country) ? (
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {[company.address, company.city, company.state]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                            {company.country && (
                              <div className="text-sm text-gray-500">
                                {company.country} {company.zip}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">未設定</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {company.employees.length}
                        </span>
                        {company.employees.filter(e => e.is_admin).length > 0 && (
                          <span className="ml-2 text-xs text-blue-600">
                            (管理者: {company.employees.filter(e => e.is_admin).length})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {company.currency_code?.toUpperCase() || "未設定"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        詳細
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        編集
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default CompaniesTemplate