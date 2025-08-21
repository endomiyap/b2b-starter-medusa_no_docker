"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // デフォルトで管理者ログインページにリダイレクト
    router.push("/admin/login")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>リダイレクト中...</p>
    </div>
  )
}