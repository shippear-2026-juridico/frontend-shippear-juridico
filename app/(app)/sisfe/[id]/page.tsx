"use client"

import Link from "next/link"
import { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, BriefcaseBusiness, Clock3, Download, Eye, FileText, MapPin, RefreshCw } from "lucide-react"
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

const fileSize = (bytes: number) => bytes < 1024 * 1024
  ? `${Math.max(1, Math.round(bytes / 1024))} KB`
  : `${(bytes / 1024 / 1024).toFixed(1)} MB`

export default function SisfeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [viewingDocument, setViewingDocument] = useState<SisfeDocument | null>(null)
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
      <div className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4" /> Documentos adjuntos</CardTitle><CardDescription>Archivos descargados desde SISFE y almacenados con el expediente.</CardDescription></CardHeader><CardContent>{item.documents.length ? <div className="divide-y">{item.documents.map((document) => <div key={document.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate text-sm font-medium">{document.fileName}</p><p className="mt-1 text-xs text-muted-foreground">{document.source === "CARGO" ? "Adjunto de cargo" : "Documento de actuación"} · {fileSize(document.byteSize)} · {date(document.fecha)}</p>{document.observacion ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{document.observacion}</p> : null}</div><div className="flex shrink-0 gap-2"><Button variant="outline" size="sm" onClick={() => setViewingDocument(document)}><Eye /> Ver</Button><a href={apiUrl(`/api/sisfe/documents/${document.id}/download`)} className={buttonVariants({ variant: "outline", size: "sm" })}><Download /> Descargar</a></div></div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">Todavía no se guardaron adjuntos. Ejecutá nuevamente “Conectar y actualizar” con la extensión 0.4.0.</p>}</CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock3 className="size-4" /> Novedades y actuaciones</CardTitle><CardDescription>Movimientos detectados durante las sincronizaciones.</CardDescription></CardHeader><CardContent>{item.movements.length ? <div className="space-y-3">{item.movements.map((movement) => <div key={movement.id} className="relative border-l-2 border-emerald-200 pb-5 pl-5 last:pb-0"><span className="absolute -left-[5px] top-1 size-2 rounded-full bg-emerald-600" /><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{movement.tipo || "Actuación"}</p><span className="text-xs text-muted-foreground">{date(movement.fecha, true)}</span>{item.documents.filter((document) => document.movementId === movement.id).map((document) => <Button key={document.id} variant="outline" size="xs" onClick={() => setViewingDocument(document)}><Eye className="size-3" /> {document.fileName}</Button>)}</div><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{movement.descripcion || "Sin descripción informada por SISFE."}</p></div>)}</div> : <p className="py-12 text-center text-sm text-muted-foreground">SISFE no informó novedades para este expediente.</p>}</CardContent></Card></div>
      <div className="space-y-6"><Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Adjuntos almacenados</p><p className="mt-2 text-2xl font-semibold">{item.documents.length}</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="size-4" /> Radicación actual</CardTitle></CardHeader><CardContent><p className="text-sm font-medium">{item.radicacion || "Sin radicación informada"}</p><p className="mt-2 text-sm text-muted-foreground">{item.ubicacion || "Sin ubicación informada"}</p></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className="size-4" /> Historial detectado</CardTitle><CardDescription>Cambios de radicación, ubicación o fecha.</CardDescription></CardHeader><CardContent>{item.snapshots.length ? <div className="space-y-4">{item.snapshots.map((snapshot) => <div key={snapshot.id} className="border-b pb-4 last:border-0 last:pb-0"><p className="text-xs text-muted-foreground">{date(snapshot.actualizadoEn, true)}</p><p className="mt-1 text-sm font-medium">{snapshot.radicacion}</p><p className="mt-1 text-xs text-muted-foreground">{snapshot.ubicacion}</p></div>)}</div> : <p className="text-sm text-muted-foreground">Sin cambios históricos detectados.</p>}</CardContent></Card></div>
    </div>
    <SisfeDocumentViewer document={viewingDocument} onOpenChange={(open) => { if (!open) setViewingDocument(null) }} />
  </div>
}
