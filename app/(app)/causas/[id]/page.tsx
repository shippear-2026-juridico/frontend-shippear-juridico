"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CalendarPlus, Check, ExternalLink, FileText, Link2, MoreHorizontal, Pencil, Plus, Scale, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { eventTypeOptions } from "@/lib/legal-select-options"
import type { CaseEvent, LegalCase } from "@/lib/types"
import { CaseFormDialog } from "@/components/case-form-dialog"
import { CaseStatusBadge, custodyLabel, eventTypeLabel, UrgencyBadge } from "@/components/legal-badges"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

function AddEventDialog({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState("HEARING")
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [description, setDescription] = useState("")
  const mutation = useMutation({ mutationFn: () => api(`/api/cases/${caseId}/events`, { method: "POST", body: JSON.stringify({ type, title, description, startsAt: `${date}T12:00:00` }) }), onSuccess: async () => { toast.success("Evento agregado"); await Promise.all([queryClient.invalidateQueries({ queryKey: ["case", caseId] }), queryClient.invalidateQueries({ queryKey: ["events"] }), queryClient.invalidateQueries({ queryKey: ["dashboard"] })]); setOpen(false); setTitle(""); setDate("") }, onError: (cause) => toast.error(cause instanceof Error ? cause.message : "No se pudo agregar") })
  const submit = (event: FormEvent) => { event.preventDefault(); mutation.mutate() }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button />}><CalendarPlus /> Agregar evento</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nuevo evento</DialogTitle><DialogDescription>Audiencia, vencimiento, tarea o gestion asociada a la causa.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Tipo</Label><Select items={eventTypeOptions} value={type} onValueChange={(value) => setType(value ?? "HEARING")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{eventTypeOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Fecha</Label><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div></div><div className="space-y-2"><Label>Titulo</Label><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Audiencia imputativa" required /></div><div className="space-y-2"><Label>Descripcion</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} /></div><DialogFooter><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Guardando..." : "Agregar"}</Button></DialogFooter></form></DialogContent></Dialog>
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [note, setNote] = useState("")
  const [resourceName, setResourceName] = useState("")
  const [resourceUrl, setResourceUrl] = useState("")
  const { data, isLoading } = useQuery({ queryKey: ["case", id], queryFn: () => api<{ case: LegalCase }>(`/api/cases/${id}`) })
  const legalCase = data?.case

  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["case", id] }), queryClient.invalidateQueries({ queryKey: ["dashboard"] }), queryClient.invalidateQueries({ queryKey: ["cases"] })]) }
  const toggleEvent = useMutation({ mutationFn: (event: CaseEvent) => api(`/api/events/${event.id}`, { method: "PATCH", body: JSON.stringify({ status: event.status === "COMPLETED" ? "PENDING" : "COMPLETED" }) }), onSuccess: refresh, onError: () => toast.error("No se pudo actualizar el evento") })
  const deleteEvent = useMutation({ mutationFn: (eventId: string) => api(`/api/events/${eventId}`, { method: "DELETE" }), onSuccess: refresh, onError: () => toast.error("No se pudo eliminar") })
  const addNote = useMutation({ mutationFn: () => api(`/api/cases/${id}/notes`, { method: "POST", body: JSON.stringify({ content: note }) }), onSuccess: async () => { setNote(""); toast.success("Nota agregada"); await refresh() }, onError: () => toast.error("No se pudo guardar la nota") })
  const addResource = useMutation({ mutationFn: () => api(`/api/cases/${id}/resources`, { method: "POST", body: JSON.stringify({ name: resourceName, url: resourceUrl, type: resourceUrl.includes("drive.google.com") ? "DRIVE_FOLDER" : "EXTERNAL_LINK" }) }), onSuccess: async () => { setResourceName(""); setResourceUrl(""); toast.success("Enlace agregado"); await refresh() }, onError: (cause) => toast.error(cause instanceof Error ? cause.message : "No se pudo guardar") })
  const archive = useMutation({ mutationFn: () => api(`/api/cases/${id}`, { method: "DELETE" }), onSuccess: async () => { toast.success("Causa archivada"); await queryClient.invalidateQueries({ queryKey: ["cases"] }); router.push("/causas") } })

  if (isLoading || !legalCase) return <div className="mx-auto max-w-7xl space-y-5"><Skeleton className="h-10 w-72" /><Skeleton className="h-40 w-full" /><Skeleton className="h-80 w-full" /></div>

  return (
    <div className="mx-auto max-w-7xl">
      <Link href="/causas" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-2" })}><ArrowLeft /> Volver a causas</Link>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{legalCase.primaryIdentifier ? `${legalCase.primaryIdentifier.type} ${legalCase.primaryIdentifier.number}` : "Sin numero"}</span><CaseStatusBadge status={legalCase.status} /><UrgencyBadge {...legalCase.urgency} /></div><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{legalCase.title}</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{legalCase.description || "Sin descripcion cargada."}</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => setEditOpen(true)}><Pencil /> Editar</Button><AddEventDialog caseId={id} /><DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" size="icon" />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end"><AlertDialog><AlertDialogTrigger render={<DropdownMenuItem onSelect={(event) => event.preventDefault()} className="text-destructive" />}><Trash2 /> Archivar causa</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Archivar esta causa?</AlertDialogTitle><AlertDialogDescription>Dejara de aparecer entre las causas activas, pero conservara todo su historial.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => archive.mutate()}>Archivar</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></DropdownMenuContent></DropdownMenu></div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Etapa procesal</p><p className="mt-2 text-sm font-medium">{legalCase.currentStage?.name ?? "Sin definir"}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Imputados</p><p className="mt-2 truncate text-sm font-medium">{legalCase.defendants.map((person) => person.displayName).join(", ") || "Sin registrar"}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Situacion personal</p><p className="mt-2 text-sm font-medium">{custodyLabel(legalCase.currentCustody?.status)}{legalCase.currentCustody?.facility ? ` · ${legalCase.currentCustody.facility.name}` : ""}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Proximo evento</p><p className="mt-2 text-sm font-medium">{legalCase.nextEvent ? `${new Date(legalCase.nextEvent.startsAt).toLocaleDateString("es-AR")} · ${legalCase.nextEvent.title}` : "Sin agenda"}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="mb-4 h-auto flex-wrap"><TabsTrigger value="summary">Resumen</TabsTrigger><TabsTrigger value="agenda">Agenda ({legalCase.events.length})</TabsTrigger><TabsTrigger value="notes">Notas ({legalCase.notes.length})</TabsTrigger><TabsTrigger value="resources">Documentos ({legalCase.resources.length})</TabsTrigger></TabsList>
        <TabsContent value="summary" className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-4" /> Personas involucradas</CardTitle><CardDescription>Imputados registrados en esta primera version.</CardDescription></CardHeader><CardContent className="space-y-2">{legalCase.defendants.length ? legalCase.defendants.map((person) => <div key={person.id} className="rounded-lg border p-3"><p className="text-sm font-medium">{person.displayName}</p><p className="text-xs text-muted-foreground">{person.documentNumber ? `DNI ${person.documentNumber}` : "Documento no registrado"}</p></div>) : <p className="py-8 text-center text-sm text-muted-foreground">Sin personas cargadas.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Scale className="size-4" /> Calificacion legal</CardTitle><CardDescription>Figuras penales asociadas.</CardDescription></CardHeader><CardContent className="space-y-2">{legalCase.offenses.length ? legalCase.offenses.map(({ offense }) => <div key={offense.id} className="rounded-lg border p-3"><p className="text-sm font-medium">{offense.name}</p><p className="mt-1 text-xs text-muted-foreground">{offense.legalReference} · {offense.category.name}</p></div>) : <p className="py-8 text-center text-sm text-muted-foreground">Sin delitos asociados.</p>}</CardContent></Card>
          <Card className="lg:col-span-2"><CardHeader><CardTitle>Historial de detencion</CardTitle></CardHeader><CardContent>{legalCase.custodyRecords.length ? <div className="space-y-3">{legalCase.custodyRecords.map((record) => <div key={record.id} className="flex items-center justify-between border-b pb-3 text-sm"><div><p className="font-medium">{custodyLabel(record.status)}</p><p className="text-xs text-muted-foreground">{record.facility?.name ?? "Sin unidad"}</p></div><p className="text-xs text-muted-foreground">Desde {new Date(record.startedAt).toLocaleDateString("es-AR")}{record.endedAt ? ` hasta ${new Date(record.endedAt).toLocaleDateString("es-AR")}` : " · actual"}</p></div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">Sin historial.</p>}</CardContent></Card>
        </TabsContent>
        <TabsContent value="agenda"><Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Agenda de la causa</CardTitle><CardDescription>Completa eventos para quitarlos de las alertas.</CardDescription></div><AddEventDialog caseId={id} /></CardHeader><CardContent className="space-y-2">{legalCase.events.length ? legalCase.events.map((event) => <div key={event.id} className={`flex items-center gap-3 rounded-lg border p-3 ${event.status === "COMPLETED" ? "opacity-55" : ""}`}><Button size="icon-sm" variant={event.status === "COMPLETED" ? "default" : "outline"} onClick={() => toggleEvent.mutate(event)}><Check /></Button><div className="min-w-0 flex-1"><p className={`text-sm font-medium ${event.status === "COMPLETED" ? "line-through" : ""}`}>{event.title}</p><p className="text-xs text-muted-foreground">{eventTypeLabel(event.type)} · {new Date(event.startsAt).toLocaleDateString("es-AR")}</p></div><Button size="icon-sm" variant="ghost" onClick={() => deleteEvent.mutate(event.id)}><Trash2 /></Button></div>) : <p className="py-12 text-center text-sm text-muted-foreground">Todavia no hay eventos.</p>}</CardContent></Card></TabsContent>
        <TabsContent value="notes"><Card><CardHeader><CardTitle>Notas del expediente</CardTitle><CardDescription>Cada nota conserva autor y fecha.</CardDescription></CardHeader><CardContent><form className="mb-6 flex gap-2" onSubmit={(event) => { event.preventDefault(); addNote.mutate() }}><Textarea className="min-h-20" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Agregar una nota..." /><Button type="submit" disabled={!note.trim() || addNote.isPending}><Plus /> Agregar</Button></form><div className="space-y-3">{legalCase.notes.map((item) => <div key={item.id} className="rounded-lg border bg-muted/20 p-4"><p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p><Separator className="my-3" /><p className="text-xs text-muted-foreground">{item.createdBy.fullName || item.createdBy.email} · {new Date(item.createdAt).toLocaleString("es-AR")}</p></div>)}</div></CardContent></Card></TabsContent>
        <TabsContent value="resources"><Card><CardHeader><CardTitle>Documentos y enlaces</CardTitle><CardDescription>Carpetas de Drive y referencias externas.</CardDescription></CardHeader><CardContent><form className="mb-6 grid gap-2 sm:grid-cols-[220px_1fr_auto]" onSubmit={(event) => { event.preventDefault(); addResource.mutate() }}><Input value={resourceName} onChange={(event) => setResourceName(event.target.value)} placeholder="Nombre" required /><Input type="url" value={resourceUrl} onChange={(event) => setResourceUrl(event.target.value)} placeholder="https://..." required /><Button type="submit" disabled={addResource.isPending}><Link2 /> Agregar</Button></form><div className="grid gap-3 sm:grid-cols-2">{legalCase.resources.map((resource) => <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border p-4 transition hover:bg-muted"><span className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-700">{resource.type === "DRIVE_FOLDER" ? <FileText /> : <ExternalLink />}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{resource.name}</p><p className="truncate text-xs text-muted-foreground">{resource.url}</p></div></a>)}</div></CardContent></Card></TabsContent>
      </Tabs>
      <CaseFormDialog open={editOpen} onOpenChange={setEditOpen} initial={legalCase} />
    </div>
  )
}
