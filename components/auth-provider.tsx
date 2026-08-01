"use client"

import { createContext, useContext } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Session } from "@/lib/types"

type AuthContextValue = {
  session: Session | null
  loading: boolean
  refresh: () => Promise<unknown>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: () => api<Session>("/api/auth/me"),
    retry: false,
  })
  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined)
    queryClient.setQueryData(["session"], null)
    await queryClient.invalidateQueries()
  }
  return (
    <AuthContext.Provider value={{
      session: sessionQuery.data ?? null,
      loading: sessionQuery.isLoading,
      refresh: sessionQuery.refetch,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider")
  return value
}
