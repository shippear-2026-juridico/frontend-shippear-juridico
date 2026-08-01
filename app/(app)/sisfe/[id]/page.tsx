"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, BriefcaseBusiness, Clock3, MapPin, RefreshCw } from "lucide-react"
import { api } from "@/lib/api"
import type { SisfeExpedienteDetail } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const date = (value: string | null, withTime = false) => value
  ? new Date(value).toLocaleString("es-AR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" })
  : "—"

export default function SisfeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading } = useQuery({ queryKey: ["sisfe-expediente", id], queryFn: () => api<{ item: SisfeExpedienteDetail }>(`/api/sisfe/expedientes/${id}`) })
  const item = data?.item
  if (isLoading || !item) return <div className="mx-auto max-w-7xl space-y-5"><Skeleton className="h-10 w-64" /><Skeleton className="h-40" /><Skeleton className="h-80" /></div>

  return <div className="mx-auto max-w-7xl">
    <Link href="/sisfe" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-2" })}><ArrowLeft /> Volver a SISFE</Link>
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-emerald-700">{item.cuij || item.numero}</span><Badge variant="outline">Solo lectura</Badge>{item.digital ? <Badge variant="secondary">Digital</Badge> : null}</div><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{item.caratula}</h1><p className="mt-2 text-sm text-muted-foreground">Última lectura desde SISFE: {date(item.lastSyncedAt, true)}</p></div>{item.legalCase ? <Link href={`/causas/${item.legalCase.id}`} className={buttonVariants({ variant: "outline" })}><BriefcaseBusiness /> Abrir causa interna</Link> : null}</div>

    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Fecha de inicio</p><p className="mt-2 text-sm font-medium">{date(item.fechaInicio)}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Actualización SISFE</p><p className="mt-2 text-sm font-medium">{date(item.fechaActualizacion)}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Localidad</p><p className="mt-2 text-sm font-medium">{item.localidad || "Rosario"}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Novedades registradas</p><p className="mt-2 text-sm font-medium">{item.movements.length}</p></CardContent></Card>
    </div>

    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-4" /> Novedades y actuaciones</CardTitle><CardDescription>Movimientos detectados durante las sincronizaciones.</CardDescription></CardHeader><CardContent>{item.movements.length ? <div className="space-y-3">{item.movements.map((movement) => <div key={movement.id} className="relative border-l-2 border-emerald-200 pb-5 pl-5 last:pb-0"><span className="absolute -left-[5px] top-1 size-2 rounded-full bg-emerald-600" /><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{movement.tipo || "Actuación"}</p><span className="text-xs text-muted-foreground">{date(movement.fecha, true)}</span></div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{movement.descripcion || "Sin descripción informada por SISFE."}</p></div>)}</div> : <p className="py-12 text-center text-sm text-muted-foreground">SISFE no informó novedades para este expediente.</p>}</CardContent></Card>
      <div className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-4" /> Radicación actual</CardTitle></CardHeader><CardContent><p className="text-sm font-medium">{item.radicacion || "Sin radicación informada"}</p><p className="mt-2 text-sm text-muted-foreground">{item.ubicacion || "Sin ubicación informada"}</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className="size-4" /> Historial detectado</CardTitle><CardDescription>Cambios de radicación, ubicación o fecha.</CardDescription></CardHeader><CardContent>{item.snapshots.length ? <div className="space-y-4">{item.snapshots.map((snapshot) => <div key={snapshot.id} className="border-b pb-4 last:border-0 last:pb-0"><p className="text-xs text-muted-foreground">{date(snapshot.actualizadoEn, true)}</p><p className="mt-1 text-sm font-medium">{snapshot.radicacion}</p><p className="mt-1 text-xs text-muted-foreground">{snapshot.ubicacion}</p></div>)}</div> : <p className="text-sm text-muted-foreground">Sin cambios históricos detectados.</p>}</CardContent></Card></div>
    </div>
  </div>
}
