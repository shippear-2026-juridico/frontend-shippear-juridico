"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarCheck, Check, Clock3 } from "lucide-react"
import { toast } from "sonner"
import { api, queryString } from "@/lib/api"
import type { CaseEvent } from "@/lib/types"
import { eventTypeLabel } from "@/components/legal-badges"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const agendaNow = Date.now()
const agendaFrom = new Date(agendaNow - 30 * 86_400_000).toISOString()
const agendaTo = new Date(agendaNow + 90 * 86_400_000).toISOString()

export default function AgendaPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["events"], queryFn: () => api<{ events: CaseEvent[] }>(`/api/events${queryString({ from: agendaFrom, to: agendaTo })}`) })
  const update = useMutation({ mutationFn: (event: CaseEvent) => api(`/api/events/${event.id}`, { method: "PATCH", body: JSON.stringify({ status: event.status === "COMPLETED" ? "PENDING" : "COMPLETED" }) }), onSuccess: async () => { toast.success("Agenda actualizada"); await Promise.all([queryClient.invalidateQueries({ queryKey: ["events"] }), queryClient.invalidateQueries({ queryKey: ["dashboard"] })]) } })
  const groups = (data?.events ?? []).reduce<Record<string, CaseEvent[]>>((result, event) => { const key = new Date(event.startsAt).toISOString().slice(0, 10); (result[key] ??= []).push(event); return result }, {})
  return <div className="mx-auto max-w-5xl"><PageHeader eyebrow="Calendario procesal" title="Agenda" description="Audiencias, vencimientos, presentaciones y tareas de todas las causas." />
    {isLoading ? <Skeleton className="h-96 w-full" /> : Object.keys(groups).length ? <div className="space-y-6">{Object.entries(groups).map(([date, events]) => <section key={date}><div className="mb-2 flex items-center gap-2"><CalendarCheck className="size-4 text-blue-700" /><h2 className="text-sm font-semibold capitalize">{new Date(`${date}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</h2></div><Card><CardContent className="divide-y p-0">{events.map((event) => <div key={event.id} className={`flex items-center gap-3 p-4 ${event.status === "COMPLETED" ? "opacity-55" : ""}`}><Button size="icon-sm" variant={event.status === "COMPLETED" ? "default" : "outline"} onClick={() => update.mutate(event)}><Check /></Button><div className="min-w-0 flex-1"><Link href={`/causas/${event.caseId}`} className={`text-sm font-medium hover:underline ${event.status === "COMPLETED" ? "line-through" : ""}`}>{event.title}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{event.case?.identifiers[0] ? `${event.case.identifiers[0].type} ${event.case.identifiers[0].number} · ` : ""}{event.case?.title}</p></div><Badge variant="secondary">{eventTypeLabel(event.type)}</Badge></div>)}</CardContent></Card></section>)}</div> : <Card><CardContent className="grid min-h-72 place-items-center text-center"><div><Clock3 className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No hay eventos en este periodo</p><p className="mt-1 text-xs text-muted-foreground">Agrega eventos desde el detalle de una causa.</p></div></CardContent></Card>}
  </div>
}
