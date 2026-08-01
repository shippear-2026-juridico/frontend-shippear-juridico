"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, BellRing } from "lucide-react"
import { api } from "@/lib/api"
import { UrgencyBadge } from "@/components/legal-badges"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type Alert = { id: string; caseId: string; caseTitle: string; title: string; startsAt: string; level: string; days: number; identifier: { type: string; number: string } | null }
export default function AlertsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<{ alerts: Alert[] }>("/api/dashboard") })
  const groups = [
    { key: "critical", title: "Vencidas y urgentes", items: data?.alerts.filter((item) => item.level === "OVERDUE" || item.level === "URGENT") ?? [] },
    { key: "upcoming", title: "Proximos diez dias", items: data?.alerts.filter((item) => item.level === "UPCOMING") ?? [] },
  ]
  return <div className="mx-auto max-w-5xl"><PageHeader eyebrow="Seguimiento" title="Alertas" description="Prioridades calculadas a partir del primer evento pendiente de cada causa." />
    {isLoading ? <Skeleton className="h-80" /> : data?.alerts.length ? <div className="space-y-7">{groups.map((group) => group.items.length ? <section key={group.key}><h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><BellRing className="size-4" /> {group.title}</h2><Card><CardContent className="divide-y p-0">{group.items.map((item) => <Link key={item.id} href={`/causas/${item.caseId}`} className="flex items-center justify-between gap-4 p-4 transition hover:bg-muted/50"><div className="min-w-0"><p className="truncate text-sm font-medium">{item.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{item.identifier ? `${item.identifier.type} ${item.identifier.number} · ` : ""}{item.caseTitle} · {new Date(item.startsAt).toLocaleDateString("es-AR")}</p></div><UrgencyBadge level={item.level} days={item.days} /></Link>)}</CardContent></Card></section> : null)}</div> : <Card><CardContent className="grid min-h-72 place-items-center text-center"><div><AlertCircle className="mx-auto size-8 text-emerald-600" /><p className="mt-3 text-sm font-medium">No hay alertas pendientes</p><p className="mt-1 text-xs text-muted-foreground">Todos los eventos estan fuera de la ventana de diez dias.</p></div></CardContent></Card>}
  </div>
}
