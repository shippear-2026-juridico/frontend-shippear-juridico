"use client"

import Link from "next/link"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, CloudDownload, Clock3, Database, ExternalLink, Search, Star } from "lucide-react"
import { api, queryString } from "@/lib/api"
import type { SisfeDocumentQueue } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type QueueFilter = "ALL" | "PENDING" | "AVAILABLE" | "ERROR"

const filters: Array<{ value: QueueFilter; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "AVAILABLE", label: "Disponibles" },
  { value: "ERROR", label: "Con error" },
]

const bytes = (value: number | null, fallback = "—") => {
  if (!value) return fallback
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`
}

const date = (value: string) => new Date(value).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })

const officialUrl = (document: SisfeDocumentQueue["items"][number]) => {
  const path = document.source === "CARGO" && document.movement?.sisfeId
    ? `/documentos-adjuntos/${document.movement.sisfeId}/${document.expediente.sisfeId}`
    : `/detalle-expediente/${document.expediente.sisfeId}`
  const params = new URLSearchParams({ roxium_autodownload: "1", roxium_autorun: "1", roxium_source: document.source, roxium_external_id: document.externalId })
  return `https://sisfe.justiciasantafe.gov.ar${path}?${params}`
}

export default function SisfeDownloadsPage() {
  const [filter, setFilter] = useState<QueueFilter>("ALL")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const queue = useQuery({
    queryKey: ["sisfe-document-queue", filter, search, page],
    queryFn: () => api<SisfeDocumentQueue>(`/api/sisfe/documents${queryString({ filter, q: search, page })}`),
    refetchInterval: 5_000,
    refetchOnWindowFocus: true,
  })
  const stats = queue.data?.stats

  return <div className="mx-auto min-w-0 max-w-[1500px]">
    <PageHeader
      eyebrow="Documentos de SISFE"
      title="Cola de descargas"
      description="Seguimiento en tiempo real de los documentos detectados, pendientes y guardados en Roxium."
      actions={<div className="flex flex-wrap gap-2">{queue.data?.nextPending ? <a href={officialUrl(queue.data.nextPending)} target="_blank" rel="noreferrer" className={buttonVariants()}><ExternalLink /> Continuar con el próximo</a> : null}<Link href="/sisfe" className={buttonVariants({ variant: "outline" })}>Volver a SISFE</Link></div>}
    />

    {stats?.pending ? <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-medium">La cola está esperando autorización en SISFE</p><p className="mt-1 text-amber-800">SISFE no permite descargar estos PDFs automáticamente. Usá “Continuar con el próximo” y presioná el clip oficial; la extensión guardará el archivo y esta cola avanzará sola.</p></div> : null}

    <Card className="mb-5 overflow-hidden border-blue-200 bg-gradient-to-br from-blue-950 to-blue-800 text-white">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-end justify-between gap-4"><div><p className="text-sm text-blue-100">Progreso global</p><p className="mt-1 text-3xl font-semibold tracking-tight">{stats?.percentage ?? 0}% completado</p></div><p className="shrink-0 text-sm text-blue-100">{stats?.available ?? 0} de {stats?.total ?? 0}</p></div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-400 transition-[width] duration-500" style={{ width: `${stats?.percentage ?? 0}%` }} /></div>
          <p className="mt-3 text-xs text-blue-100">{bytes(stats?.storedBytes ?? 0, "0 KB")} guardados en la base{stats?.pending ? ` · proyección ~${bytes(stats.estimatedTotalBytes, "0 KB")} al completar la cola` : ""}</p>
          <p className="mt-1 text-xs text-blue-100">La pantalla se actualiza automáticamente cada cinco segundos mientras permanece abierta.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4 lg:grid-cols-2">
          <div className="rounded-xl bg-white/10 px-5 py-3"><p className="text-2xl font-semibold">{stats?.pending ?? 0}</p><p className="text-xs text-blue-100">Pendientes</p></div>
          <div className="rounded-xl bg-white/10 px-5 py-3"><p className="text-2xl font-semibold">{stats?.prioritized ?? 0}</p><p className="text-xs text-blue-100">Prioritarios</p></div>
        </div>
      </CardContent>
    </Card>

    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card><CardContent className="flex items-center gap-3 p-5"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 /></span><div><p className="text-2xl font-semibold">{stats?.available ?? 0}</p><p className="text-xs text-muted-foreground">Disponibles en Roxium</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 p-5"><span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Clock3 /></span><div><p className="text-2xl font-semibold">{stats?.pending ?? 0}</p><p className="text-xs text-muted-foreground">Esperando descarga</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 p-5"><span className="grid size-10 place-items-center rounded-xl bg-red-50 text-red-700"><AlertTriangle /></span><div><p className="text-2xl font-semibold">{stats?.errors ?? 0}</p><p className="text-xs text-muted-foreground">Intentos con error</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-3 p-5"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><Database /></span><div className="min-w-0"><p className="text-2xl font-semibold">{bytes(stats?.storedBytes ?? 0, "0 KB")}</p><p className="text-xs text-muted-foreground">Ocupado en la base{stats?.averageBytes ? ` · ${bytes(stats.averageBytes)} promedio` : ""}</p></div></CardContent></Card>
    </div>

    <Card className="min-w-0 overflow-hidden"><CardContent className="p-0">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={filter} onValueChange={(value) => { setFilter(value as QueueFilter); setPage(1) }}><TabsList className="max-w-full overflow-x-auto">{filters.map((item) => <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>)}</TabsList></Tabs>
        <div className="relative w-full lg:max-w-md"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="pl-9" placeholder="Buscar documento, CUIJ o carátula..." /></div>
      </div>
      <div className="divide-y">
        {queue.isLoading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="p-4"><Skeleton className="h-14 w-full" /></div>) : queue.data?.items.length ? queue.data.items.map((document) => {
          const available = document.status === "AVAILABLE"
          const failed = !available && Boolean(document.lastError)
          return <div key={document.id} className="grid min-w-0 gap-3 p-4 transition-colors hover:bg-muted/30 lg:grid-cols-[minmax(0,1fr)_160px_150px] lg:items-center">
            <div className="flex min-w-0 gap-3"><span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg ${available ? "bg-emerald-50 text-emerald-700" : failed ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{available ? <CheckCircle2 className="size-4" /> : failed ? <AlertTriangle className="size-4" /> : <CloudDownload className="size-4" />}</span><div className="min-w-0"><div className="flex min-w-0 flex-wrap items-center gap-2"><p className="max-w-full truncate text-sm font-medium">{document.fileName}</p>{document.prioritized ? <Badge className="gap-1 bg-violet-100 text-violet-800"><Star className="size-3 fill-current" /> Prioritario</Badge> : null}</div><Link href={`/sisfe/${document.expediente.id}`} className="mt-1 block truncate text-xs text-blue-700 hover:underline">{document.expediente.cuij || document.expediente.numero} · {document.expediente.caratula}</Link>{document.lastError ? <p className="mt-1 line-clamp-1 text-xs text-red-700">{document.lastError}</p> : null}</div></div>
            <div><Badge variant={available ? "secondary" : "outline"} className={available ? "bg-emerald-50 text-emerald-700" : failed ? "border-red-200 text-red-700" : "border-amber-200 text-amber-700"}>{available ? "Disponible" : failed ? "Reintento pendiente" : "En cola"}</Badge><p className="mt-1 text-xs text-muted-foreground">{bytes(document.byteSize)} · {document.attempts} intentos</p>{!available ? <a href={officialUrl(document)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"><ExternalLink className="size-3" /> Autorizar en SISFE</a> : null}</div>
            <p className="text-xs text-muted-foreground lg:text-right">Actualizado<br />{date(document.updatedAt)}</p>
          </div>
        }) : <div className="grid min-h-56 place-items-center p-6 text-center"><div><CloudDownload className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">No hay documentos en esta vista</p><p className="mt-1 text-xs text-muted-foreground">Probá otro filtro o término de búsqueda.</p></div></div>}
      </div>
      <div className="flex items-center justify-between border-t px-4 py-3"><p className="text-xs text-muted-foreground">{queue.data?.total ?? 0} documentos</p><div className="flex items-center gap-2"><Button size="icon-sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></Button><span className="text-xs">Página {queue.data?.page ?? page} de {queue.data?.pages ?? 1}</span><Button size="icon-sm" variant="outline" disabled={page >= (queue.data?.pages ?? 1)} onClick={() => setPage((value) => value + 1)}><ChevronRight /></Button></div></div>
    </CardContent></Card>
  </div>
}
