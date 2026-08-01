"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle2, Scale, ShieldCheck } from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const { session, loading: sessionLoading, refresh } = useAuth()
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [visibleOtp, setVisibleOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (session) router.replace("/dashboard")
  }, [router, session])

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError("")
    try {
      const result = await api<{ otp: string }>("/api/auth/request-otp", { method: "POST", body: JSON.stringify({ email }) })
      setVisibleOtp(result.otp); setOtp(result.otp); setStep("otp")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos generar el codigo") }
    finally { setLoading(false) }
  }

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError("")
    try {
      await api("/api/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, otp }) })
      await refresh(); router.replace("/dashboard")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos verificar el codigo") }
    finally { setLoading(false) }
  }

  if (sessionLoading || session) return <main className="grid min-h-screen place-items-center bg-stone-50 text-sm text-muted-foreground">Preparando tu espacio...</main>

  return (
    <main className="grid min-h-screen bg-stone-50 lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden bg-[#13233f] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,#8fb7ef_0,transparent_36%),radial-gradient(circle_at_80%_80%,#4f8b76_0,transparent_35%)]" />
        <div className="relative flex items-center gap-3 text-sm font-semibold tracking-[.14em]"><Scale className="size-6" /> ANTENUCCI PENAL</div>
        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[.2em] text-blue-200">Gestion juridica integral</p>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-.04em]">Cada causa, cada plazo y cada decision en un solo lugar.</h1>
          <div className="mt-10 grid gap-4 text-sm text-blue-100 sm:grid-cols-2">
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4" /> Expedientes ordenados</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4" /> Alertas de vencimientos</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4" /> Agenda procesal</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4" /> Historial auditable</span>
          </div>
        </div>
        <p className="relative text-xs text-blue-200/70">Plataforma privada para equipos juridicos.</p>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-10">
        <Card className="w-full max-w-md border-stone-200 shadow-xl shadow-slate-900/5">
          <CardHeader className="space-y-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-800"><ShieldCheck className="size-6" /></span>
            <div><CardTitle className="text-2xl">Acceso al gestor</CardTitle><CardDescription className="mt-2">Ingresa sin contraseña con un codigo temporal.</CardDescription></div>
          </CardHeader>
          <CardContent>
            {step === "email" ? (
              <form onSubmit={requestOtp} className="space-y-5">
                <div className="space-y-2"><Label htmlFor="email">Correo electronico</Label><Input id="email" type="email" placeholder="nombre@estudio.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus /></div>
                {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? "Generando..." : <>Continuar <ArrowRight /></>}</Button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-5">
                <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setStep("email")}>← Cambiar correo</button>
                <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50 p-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-700">OTP de desarrollo</p>
                  <button type="button" className="mt-2 font-mono text-4xl font-semibold tracking-[.2em] text-blue-950" onClick={() => setOtp(visibleOtp)}>{visibleOtp}</button>
                </div>
                <div className="space-y-2"><Label htmlFor="otp">Codigo de 6 digitos</Label><Input id="otp" className="text-center font-mono text-lg tracking-[.35em]" inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} autoFocus /></div>
                {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={loading || otp.length !== 6}>{loading ? "Verificando..." : "Ingresar"}</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
