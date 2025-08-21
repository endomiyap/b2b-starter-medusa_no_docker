"use server"

import { sdk } from "@/lib/config"
import { 
  getAuthHeaders, 
  setAuthToken,
  removeAuthToken 
} from "./cookies"

// Admin用ログイン
export async function adminLogin(_currentState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    // Admin (user)としてログイン
    const token = await sdk.auth.login("user", "emailpass", {
      email,
      password,
    })

    if (!token) {
      return "Invalid email or password"
    }

    // トークンをCookieに保存
    setAuthToken(token as string)
    
    return null
  } catch (error: any) {
    return error.message || "An error occurred"
  }
}

// 企業一覧を取得
export async function getCompanies() {
  const authHeaders = await getAuthHeaders()
  
  if (!authHeaders) {
    throw new Error("Unauthorized")
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/admin/companies`,
      {
        method: "GET",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching companies:", error)
    throw error
  }
}

// Admin情報を取得
export async function getAdminUser() {
  const authHeaders = await getAuthHeaders()
  
  if (!authHeaders) {
    return null
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/admin/users/me`,
      {
        method: "GET",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    console.error("Error fetching admin user:", error)
    return null
  }
}

// Adminログアウト
export async function adminLogout() {
  removeAuthToken()
}