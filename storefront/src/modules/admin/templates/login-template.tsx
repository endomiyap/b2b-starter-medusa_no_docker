"use client"

import { adminLogin } from "@/lib/data/admin"
import ErrorMessage from "@/modules/checkout/components/error-message"
import { SubmitButton } from "@/modules/checkout/components/submit-button"
import Input from "@/modules/common/components/input"
import { Text } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useActionState, useEffect } from "react"

const AdminLoginTemplate = () => {
  const [message, formAction] = useActionState(adminLogin, null)
  const router = useRouter()

  useEffect(() => {
    // ログイン成功時にリダイレクト
    if (message === null) {
      router.push("/admin/companies")
    }
  }, [message, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <Text className="text-3xl font-bold text-center text-gray-900">
            Admin Login
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            Platform管理者としてログイン
          </Text>
        </div>
        
        <form className="mt-8 space-y-6" action={formAction}>
          <div className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="saas_admin@example.com"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="supersecret"
            />
          </div>
          
          <ErrorMessage error={message} />
          
          <SubmitButton className="w-full">
            ログイン
          </SubmitButton>
        </form>

        <div className="mt-4 p-4 bg-blue-50 rounded">
          <Text className="text-sm text-blue-800">
            <strong>テスト用認証情報:</strong><br />
            Email: saas_admin@example.com<br />
            Password: supersecret
          </Text>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginTemplate