"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { AppShell } from "@/components/app-shell"

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, loading } = useAuth()
  useEffect(() => { if (!loading && !session) router.replace("/") }, [loading, router, session])
  if (loading || !session) return <main className="grid min-h-screen place-items-center text-sm text-muted-foreground">Validando sesion...</main>
  return <AppShell>{children}</AppShell>
}
