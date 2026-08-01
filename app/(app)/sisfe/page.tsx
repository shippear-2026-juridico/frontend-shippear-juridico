"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Cable, ChevronLeft, ChevronRight, Clock3, Download, Info, Paperclip, RefreshCw, Search, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { api, queryString } from "@/lib/api"
import type { SisfeExpediente, SisfeStatus, SisfeSyncRun } from "@/lib/types"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ListResponse = { items: SisfeExpediente[]; total: number; page: number; pages: number }
const SISFE_EXTENSION_VERSION = "0.6.0"

const date = (value: string | null, withTime = false) => value
  ? new Date(value).toLocaleString("es-AR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" })
  : "—"

const runLabel = (status?: SisfeSyncRun["status"]) => status ? ({
  RUNNING: "Sincronizando",
  SUCCESS: "Completada",
  PARTIAL: "Completada con avisos",
  FAILED: "Fallida",
  NEEDS_LOGIN: "Requiere ingreso",
}[status]) : "Sin ejecuciones"

export default function SisfePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const status = useQuery({
    queryKey: ["sisfe-status"],
    queryFn: () => api<SisfeStatus>("/api/sisfe/status"),
    refetchInterval: (query) => query.state.data?.lastRun?.status === "RUNNING" ? 3_000 : 30_000,
  })
  const expedientes = useQuery({
    queryKey: ["sisfe-expedientes", search, page],
    queryFn: () => api<ListResponse>(`/api/sisfe/expedientes${queryString({ q: search, page })}`),
  })
  const connect = useMutation({
    mutationFn: async () => {
      const popup = window.open("about:blank", "_blank")
      try {
        const result = await api<{ loginUrl: string }>("/api/sisfe/connect-ticket", { method: "POST" })
        if (popup) popup.location.href = result.loginUrl
        else window.location.href = result.loginUrl
        return result
      } catch (error) {
        popup?.close()
        throw error
      }
    },
    onSuccess: () => toast.info("Completá el ingreso en la pestaña de SISFE"),
    onError: (cause) => toast.error(cause instanceof Error ? cause.message : "No se pudo abrir SISFE"),
  })
  const current = status.data
  const isRunning = current?.lastRun?.status === "RUNNING"

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connection = params.get("connection")
    if (connection === "success") {
      const documents = params.get("documents")
      const unchanged = Number(params.get("unchanged") || 0)
      const pendingDocuments = Number(params.get("pendingDocuments") || 0)
      const documentErrors = Number(params.get("documentErrors") || 0)
      toast.success(`${params.get("count") ?? "Los"} expedientes actualizados${unchanged ? ` · ${unchanged} sin cambios omitidos` : ""}${documents ? ` · ${documents} adjuntos disponibles` : ""}${pendingDocuments ? ` · ${pendingDocuments} pendientes en cola` : ""}${documentErrors ? ` · ${documentErrors} intentos bloqueados` : ""}`)
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sisfe-status"] }),
        queryClient.invalidateQueries({ queryKey: ["sisfe-expedientes"] }),
      ])
      window.history.replaceState({}, "", "/sisfe")
    } else if (connection === "error") {
      toast.error(params.get("message") || "No se pudo importar SISFE")
      window.history.replaceState({}, "", "/sisfe")
    }
  }, [queryClient])

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Poder Judicial de Santa Fe"
        title="Sincronización SISFE"
        description="Expedientes accesibles para la matrícula en Rosario, importados como información de solo lectura."
        actions={<Button onClick={() => connect.mutate()} disabled={connect.isPending || isRunning}><Cable />{connect.isPending ? "Abriendo..." : "Conectar y actualizar"}</Button>}
      />

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Card><CardContent className="flex items-start gap-3 p-5"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${current?.connected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{current?.connected ? <ShieldCheck /> : <AlertCircle />}</span><div><p className="text-xs text-muted-foreground">Sesión SISFE</p><p className="mt-1 font-medium">{current?.connected ? "Conectada" : "Requiere ingreso manual"}</p><p className="mt-1 text-xs text-muted-foreground">{current?.expiresAt ? `Vence ${date(current.expiresAt, true)}` : "El CAPTCHA se resuelve fuera de esta aplicación."}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-start gap-3 p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><RefreshCw className={isRunning ? "animate-spin" : ""} /></span><div><p className="text-xs text-muted-foreground">Última ejecución</p><p className="mt-1 font-medium">{runLabel(current?.lastRun?.status)}</p><p className="mt-1 text-xs text-muted-foreground">{current?.lastRun ? `${date(current.lastRun.startedAt, true)} · ${current.lastRun.syncedCount}/${current.lastRun.foundCount}` : "Todavía no se sincronizó."}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-start gap-3 p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><Clock3 /></span><div><p className="text-xs text-muted-foreground">Expedientes importados</p><p className="mt-1 text-2xl font-semibold">{current?.total ?? 0}</p><p className="mt-1 text-xs text-muted-foreground">Actualización automática diaria a las 07:00.</p></div></CardContent></Card>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Extensión de navegador requerida una sola vez</p><p className="mt-1 text-blue-800">Permite abrir SISFE desde esta pantalla, capturar la sesión después del CAPTCHA y leer sólo los expedientes nuevos o modificados. No guarda matrícula ni contraseña.</p></div><div className="flex shrink-0 flex-wrap gap-2"><Button variant="outline" size="sm" className="border-blue-300 bg-white hover:bg-blue-100" onClick={() => toast.info(`Versión publicada de la extensión: ${SISFE_EXTENSION_VERSION}`)}><Info /> v{SISFE_EXTENSION_VERSION}</Button><a href="/sisfe-browser-extension.zip" download className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-blue-300 bg-white px-4 text-sm font-medium hover:bg-blue-100"><Download className="size-4" /> Descargar extensión</a></div></div>

      {!current?.connected && !status.isLoading ? <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-medium">Hace falta renovar la sesión de SISFE</p><p className="mt-1 text-amber-800">Presioná “Conectar y actualizar”, completá matrícula, contraseña y CAPTCHA en la pestaña oficial. La extensión vuelve automáticamente con los expedientes importados.</p></div> : null}

      {current?.lastRun?.errorMessage ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><p className="font-medium">La última sincronización informó un error</p><p className="mt-1">{current.lastRun.errorMessage}</p></div> : null}

      <Card><CardContent className="p-0">
        <div className="border-b p-4"><div className="relative max-w-xl"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Buscar por CUIJ, carátula u organismo..." /></div></div>
        <div className="hidden overflow-x-auto md:block"><Table><TableHeader><TableRow><TableHead>Expediente</TableHead><TableHead>Carátula</TableHead><TableHead>Inicio</TableHead><TableHead>Actualización SISFE</TableHead><TableHead>Radicación actual</TableHead><TableHead>Novedades</TableHead><TableHead>Adjuntos</TableHead></TableRow></TableHeader><TableBody>
          {expedientes.isLoading ? Array.from({ length: 5 }).map((_, index) => <TableRow key={index}><TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) : expedientes.data?.items.length ? expedientes.data.items.map((item) => <TableRow key={item.id}><TableCell className="font-mono text-xs"><Link href={`/sisfe/${item.id}`} className="font-medium text-emerald-700 hover:underline">{item.cuij || item.numero}</Link></TableCell><TableCell className="max-w-md"><Link href={`/sisfe/${item.id}`} className="block line-clamp-2 font-medium">{item.caratula}</Link></TableCell><TableCell>{date(item.fechaInicio)}</TableCell><TableCell>{date(item.fechaActualizacion)}</TableCell><TableCell className="max-w-sm"><p className="line-clamp-2">{item.radicacion || "Sin radicación informada"}</p><p className="mt-1 text-xs text-muted-foreground">{item.localidad || "Rosario"}</p></TableCell><TableCell><Badge variant="secondary">{item._count?.movements ?? 0}</Badge></TableCell><TableCell><Badge variant="outline" className="gap-1"><Paperclip className="size-3" />{item._count?.documents ?? 0}</Badge></TableCell></TableRow>) : <TableRow><TableCell colSpan={7} className="h-48 text-center text-muted-foreground">No hay expedientes sincronizados que coincidan.</TableCell></TableRow>}
        </TableBody></Table></div>
        <div className="grid gap-3 p-4 md:hidden">{expedientes.isLoading ? <Skeleton className="h-36" /> : expedientes.data?.items.map((item) => <Link key={item.id} href={`/sisfe/${item.id}`} className="rounded-xl border bg-background p-4"><p className="font-mono text-xs text-emerald-700">{item.cuij || item.numero}</p><p className="mt-2 line-clamp-2 text-sm font-medium">{item.caratula}</p><p className="mt-3 text-xs text-muted-foreground">{item.radicacion}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>Actualizado {date(item.fechaActualizacion)}</span><div className="flex gap-2"><Badge variant="secondary">{item._count?.movements ?? 0} novedades</Badge><Badge variant="outline">{item._count?.documents ?? 0} adjuntos</Badge></div></div></Link>)}</div>
        <div className="flex items-center justify-between border-t px-4 py-3"><p className="text-xs text-muted-foreground">{expedientes.data?.total ?? 0} expedientes</p><div className="flex items-center gap-2"><Button size="icon-sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft /></Button><span className="text-xs">Página {expedientes.data?.page ?? page} de {expedientes.data?.pages ?? 1}</span><Button size="icon-sm" variant="outline" disabled={page >= (expedientes.data?.pages ?? 1)} onClick={() => setPage((value) => value + 1)}><ChevronRight /></Button></div></div>
      </CardContent></Card>
    </div>
  )
}
