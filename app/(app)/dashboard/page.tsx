"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, CalendarClock, FolderKanban, FolderSearch } from "lucide-react"
import { api } from "@/lib/api"
import { PageHeader } from "@/components/page-header"
import { UrgencyBadge } from "@/components/legal-badges"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type Dashboard = {
  stats: { total: number; active: number; urgent: number; withoutNextEvent: number }
  alerts: Array<{ id: string; caseId: string; caseTitle: string; title: string; startsAt: string; level: string; days: number; identifier: { type: string; number: string } | null }>
  recentCases: Array<{ id: string; title: string; status: string; updatedAt: string; identifier: { type: string; number: string } | null }>
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/api/dashboard") })
  const metrics = [
    { label: "Causas registradas", value: data?.stats.total, icon: FolderKanban, tone: "bg-blue-50 text-blue-700" },
    { label: "Causas activas", value: data?.stats.active, icon: FolderSearch, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Alertas urgentes", value: data?.stats.urgent, icon: AlertTriangle, tone: "bg-red-50 text-red-700" },
    { label: "Sin proximo evento", value: data?.stats.withoutNextEvent, icon: CalendarClock, tone: "bg-amber-50 text-amber-700" },
  ]
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader eyebrow="Panel principal" title="Resumen del estudio" description="Causas, vencimientos y actividad reciente en una sola vista." actions={<Link href="/causas" className={buttonVariants()}><FolderKanban /> Ver causas</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon, tone }) => (
        <Card key={label}><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted-foreground">{label}</p>{isLoading ? <Skeleton className="mt-2 h-8 w-16" /> : <p className="mt-1 text-3xl font-semibold tracking-tight">{value ?? 0}</p>}</div><span className={`grid size-11 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span></CardContent></Card>
      ))}</div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card><CardHeader><CardTitle>Alertas prioritarias</CardTitle><CardDescription>Eventos vencidos o dentro de los proximos diez dias.</CardDescription></CardHeader><CardContent className="space-y-2">
          {isLoading ? <Skeleton className="h-40 w-full" /> : data?.alerts.length ? data.alerts.map((item) => (
            <Link key={item.id} href={`/causas/${item.caseId}`} className="flex items-center justify-between gap-4 rounded-lg border p-3 transition hover:bg-muted/60"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="truncate text-xs text-muted-foreground">{item.identifier ? `${item.identifier.type} ${item.identifier.number} · ` : ""}{item.caseTitle}</p></div><UrgencyBadge level={item.level} days={item.days} /></Link>
          )) : <p className="py-12 text-center text-sm text-muted-foreground">No hay alertas pendientes.</p>}
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Actividad reciente</CardTitle><CardDescription>Ultimas causas actualizadas.</CardDescription></CardHeader><CardContent className="space-y-1">
          {isLoading ? <Skeleton className="h-40 w-full" /> : data?.recentCases.map((item) => (
            <Link key={item.id} href={`/causas/${item.id}`} className="block rounded-lg px-3 py-3 hover:bg-muted"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.identifier ? `${item.identifier.type} ${item.identifier.number}` : "Sin numero"} · {new Date(item.updatedAt).toLocaleDateString("es-AR")}</p></Link>
          ))}
        </CardContent></Card>
      </div>
    </div>
  )
}
