"use client"

import Link from "next/link"
import { useState } from "react"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, BriefcaseBusiness, Clock3, Download, ExternalLink, Eye, FileText, MapPin, RefreshCw, Star } from "lucide-react"
import { toast } from "sonner"
import { api, apiUrl } from "@/lib/api"
import type { SisfeDocument, SisfeExpedienteDetail } from "@/lib/types"
import { SisfeDocumentViewer } from "@/components/sisfe-document-viewer"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const date = (value: string | null, withTime = false) => value
  ? new Date(value).toLocaleString("es-AR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" })
  : "—"

const fileSize = (bytes: number | null) => bytes === null ? "Pendiente" : bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / 1024 / 1024).toFixed(1)} MB`

export default function SisfeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [viewingDocument, setViewingDocument] = useState<SisfeDocument | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ["sisfe-expediente", id],
    queryFn: () => api<{ item: SisfeExpedienteDetail }>(`/api/sisfe/expedientes/${id}`),
  })
  const priority = useMutation({
    mutationFn: (document: SisfeDocument) => api(`/api/sisfe/documents/${document.id}/priority`, {
      method: "PATCH",
      body: JSON.stringify({ prioritized: !document.prioritized }),
    }),
    onSuccess: (_result, document) => {
      void queryClient.invalidateQueries({ queryKey: ["sisfe-expediente", id] })
      toast.success(document.prioritized ? "Documento quitado de prioridad" : "Documento priorizado para la próxima sincronización")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo actualizar la prioridad"),
  })

  const item = data?.item
  if (isLoading || !item) return <div className="mx-auto max-w-7xl space-y-5"><Skeleton className="h-10 w-64" /><Skeleton className="h-40" /><Skeleton className="h-80" /></div>

  const availableDocumentCount = item.documents.filter((document) => document.status === "AVAILABLE").length
  const pendingDocumentCount = item.documents.length - availableDocumentCount
  const officialUrl = (document: SisfeDocument) => {
    const movementSisfeId = item.movements.find((movement) => movement.id === document.movementId)?.sisfeId
    const path = document.source === "CARGO" && movementSisfeId
      ? `/documentos-adjuntos/${movementSisfeId}/${item.sisfeId}`
      : `/detalle-expediente/${item.sisfeId}`
    const params = new URLSearchParams({ roxium_autodownload: "1", roxium_autorun: "1", roxium_source: document.source, roxium_external_id: document.externalId })
    return `https://sisfe.justiciasantafe.gov.ar${path}?${params}`
  }

  return <div className="mx-auto w-full min-w-0 max-w-7xl overflow-hidden">
    <Link href="/sisfe" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-2" })}><ArrowLeft /> Volver a SISFE</Link>

    <div className="mb-6 flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-emerald-700">{item.cuij || item.numero}</span><Badge variant="outline">Solo lectura</Badge>{item.digital ? <Badge variant="secondary">Digital</Badge> : null}</div>
        <h1 className="break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] md:text-3xl">{item.caratula}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Última lectura desde SISFE: {date(item.lastSyncedAt, true)}</p>
      </div>
      {item.legalCase ? <Link href={`/causas/${item.legalCase.id}`} className={buttonVariants({ variant: "outline" })}><BriefcaseBusiness /> Abrir causa interna</Link> : null}
    </div>

    <div className="mb-6 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Fecha de inicio</p><p className="mt-2 text-sm font-medium">{date(item.fechaInicio)}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Actualización SISFE</p><p className="mt-2 text-sm font-medium">{date(item.fechaActualizacion)}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Localidad</p><p className="mt-2 text-sm font-medium">{item.localidad || "Rosario"}</p></CardContent></Card>
      <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Novedades registradas</p><p className="mt-2 text-sm font-medium">{item.movements.length}</p></CardContent></Card>
    </div>

    {pendingDocumentCount ? <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-medium">Hay {pendingDocumentCount} documentos pendientes de descarga</p><p className="mt-1 text-amber-800">SISFE exige reCAPTCHA para entregar el PDF. Podés priorizar un archivo para que la extensión lo intente primero o abrir su actuación directamente en SISFE.</p></div> : null}

    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,20rem)]">
      <div className="min-w-0 space-y-6">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4" /> Documentos adjuntos</CardTitle><CardDescription>Archivos detectados en SISFE y asociados al expediente.</CardDescription></CardHeader>
          <CardContent className="min-w-0">
            {item.documents.length ? <div className="min-w-0 divide-y">{item.documents.map((document) => <div key={document.id} className="flex min-w-0 flex-col gap-3 py-4 first:pt-0 last:pb-0 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2"><p className="min-w-0 break-words text-sm font-medium [overflow-wrap:anywhere]">{document.fileName}</p>{document.status === "PENDING" ? <Badge variant="outline">Pendiente</Badge> : null}{document.prioritized ? <Badge variant="secondary" className="gap-1"><Star className="size-3 fill-current" /> Prioritario</Badge> : null}</div>
                <p className="mt-1 text-xs text-muted-foreground">{document.source === "CARGO" ? "Adjunto de cargo" : "Documento de actuación"} · {fileSize(document.byteSize)} · {date(document.fecha)}</p>
                {document.observacion ? <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">{document.observacion}</p> : null}
              </div>
              {document.status === "AVAILABLE" ? <div className="flex shrink-0 flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setViewingDocument(document)}><Eye /> Ver</Button><a href={apiUrl(`/api/sisfe/documents/${document.id}/download`)} className={buttonVariants({ variant: "outline", size: "sm" })}><Download /> Descargar</a></div> : <div className="flex shrink-0 flex-wrap gap-2"><Button variant={document.prioritized ? "secondary" : "outline"} size="sm" disabled={priority.isPending && priority.variables?.id === document.id} onClick={() => priority.mutate(document)}><Star className={document.prioritized ? "fill-current" : ""} /> {document.prioritized ? "Quitar prioridad" : "Priorizar"}</Button><a href={officialUrl(document)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}><ExternalLink /> Abrir en SISFE</a></div>}
            </div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">Todavía no se registraron adjuntos. Ejecutá nuevamente “Conectar y actualizar” con la extensión 0.10.0.</p>}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-4" /> Novedades y actuaciones</CardTitle><CardDescription>Movimientos detectados durante las sincronizaciones.</CardDescription></CardHeader>
          <CardContent>{item.movements.length ? <div className="space-y-3">{item.movements.map((movement) => {
            const documents = item.documents.filter((document) => document.movementId === movement.id)
            return <div key={movement.id} className="relative min-w-0 border-l-2 border-emerald-200 pb-5 pl-5 last:pb-0"><span className="absolute -left-[5px] top-1 size-2 rounded-full bg-emerald-600" /><div className="flex min-w-0 flex-wrap items-center gap-2"><p className="text-sm font-medium">{movement.tipo || "Actuación"}</p><span className="text-xs text-muted-foreground">{date(movement.fecha, true)}</span>{documents.map((document) => document.status === "AVAILABLE" ? <Button key={document.id} variant="outline" size="xs" className="max-w-full" onClick={() => setViewingDocument(document)}><Eye className="size-3" /><span className="max-w-64 truncate">{document.fileName}</span></Button> : <Badge key={document.id} variant="outline" className="max-w-full"><span className="max-w-64 truncate">{document.fileName}</span> · pendiente</Badge>)}</div><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">{movement.descripcion || "Sin descripción informada por SISFE."}</p></div>
          })}</div> : <p className="py-12 text-center text-sm text-muted-foreground">SISFE no informó novedades para este expediente.</p>}</CardContent>
        </Card>
      </div>

      <div className="min-w-0 space-y-6">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Adjuntos registrados</p><p className="mt-2 text-2xl font-semibold">{item.documents.length}</p><p className="mt-1 text-xs text-muted-foreground">{availableDocumentCount} disponibles · {pendingDocumentCount} pendientes</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-4" /> Radicación actual</CardTitle></CardHeader><CardContent><p className="break-words text-sm font-medium [overflow-wrap:anywhere]">{item.radicacion || "Sin radicación informada"}</p><p className="mt-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">{item.ubicacion || "Sin ubicación informada"}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className="size-4" /> Historial detectado</CardTitle><CardDescription>Cambios de radicación, ubicación o fecha.</CardDescription></CardHeader><CardContent>{item.snapshots.length ? <div className="space-y-4">{item.snapshots.map((snapshot) => <div key={snapshot.id} className="min-w-0 border-b pb-4 last:border-0 last:pb-0"><p className="text-xs text-muted-foreground">{date(snapshot.actualizadoEn, true)}</p><p className="mt-1 break-words text-sm font-medium [overflow-wrap:anywhere]">{snapshot.radicacion}</p><p className="mt-1 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">{snapshot.ubicacion}</p></div>)}</div> : <p className="text-sm text-muted-foreground">Sin cambios históricos detectados.</p>}</CardContent></Card>
      </div>
    </div>

    <SisfeDocumentViewer document={viewingDocument} onOpenChange={(open) => { if (!open) setViewingDocument(null) }} />
  </div>
}
