"use client"

import { FormEvent, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Plus, Search, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { api, queryString } from "@/lib/api"
import { caseStatusOptions, custodyStatusOptions, identifierTypeOptions, jurisdictionOptions, priorityOptions, procedureCodeOptions, type SelectOption } from "@/lib/legal-select-options"
import type { CaseInput, Facility, LegalCase, Offense, Stage } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

type Catalogs = { stages: Stage[]; facilities: Facility[]; offenses: Offense[] }

const emptyInput: CaseInput = {
  title: "", description: "", identifierType: "CUIJ", identifierNumber: "", jurisdiction: "SANTA_FE",
  procedureCode: "CPPSF", status: "ACTIVE", priority: 0, currentStageId: null, defendants: [{ displayName: "" }],
  offenseIds: [], custodyStatus: null, facilityId: null, note: "", driveUrl: "",
}

const fromCase = (item: LegalCase): CaseInput => ({
  title: item.title,
  description: item.description ?? "",
  identifierType: item.primaryIdentifier?.type ?? "CUIJ",
  identifierNumber: item.primaryIdentifier?.number ?? "",
  jurisdiction: item.jurisdiction,
  procedureCode: item.procedureCode ?? "",
  status: item.status,
  priority: item.priority,
  currentStageId: item.currentStageId,
  defendants: item.defendants.length ? item.defendants.map((contact) => ({ displayName: contact.displayName, documentNumber: contact.documentNumber ?? "" })) : [{ displayName: "" }],
  offenseIds: item.offenses.map((relation) => relation.offense.id),
  custodyStatus: item.currentCustody?.status ?? null,
  facilityId: item.currentCustody?.facilityId ?? null,
  note: "",
  driveUrl: "",
})

export function CaseFormDialog({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (open: boolean) => void; initial?: LegalCase | null }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<CaseInput>(() => initial ? fromCase(initial) : emptyInput)
  const [offenseSearch, setOffenseSearch] = useState("")
  const catalogs = useQuery({ queryKey: ["catalogs", offenseSearch], queryFn: () => api<Catalogs>(`/api/catalogs${queryString({ q: offenseSearch })}`), enabled: open })
  const baseCatalogs = useQuery({ queryKey: ["catalogs", "base"], queryFn: () => api<Catalogs>("/api/catalogs"), enabled: open })

  const selectedOffenses = useMemo(() => {
    const all = [...(catalogs.data?.offenses ?? []), ...(baseCatalogs.data?.offenses ?? []), ...(initial?.offenses.map((item) => item.offense) ?? [])]
    return form.offenseIds.map((id) => all.find((item) => item.id === id)).filter(Boolean) as Offense[]
  }, [baseCatalogs.data, catalogs.data, form.offenseIds, initial])
  const stageOptions = useMemo<SelectOption[]>(() => [
    { value: "NONE", label: "Sin definir" },
    ...(baseCatalogs.data?.stages.map((stage) => ({ value: stage.id, label: stage.name })) ?? []),
  ], [baseCatalogs.data?.stages])
  const facilityOptions = useMemo<SelectOption[]>(() => [
    { value: "NONE", label: "Sin unidad" },
    ...(baseCatalogs.data?.facilities.map((facility) => ({ value: facility.id, label: facility.name })) ?? []),
  ], [baseCatalogs.data?.facilities])

  const mutation = useMutation({
    mutationFn: () => api<{ case: LegalCase }>(initial ? `/api/cases/${initial.id}` : "/api/cases", { method: initial ? "PUT" : "POST", body: JSON.stringify({ ...form, defendants: form.defendants.filter((item) => item.displayName.trim()) }) }),
    onSuccess: async (result) => {
      toast.success(initial ? "Causa actualizada" : "Causa creada")
      queryClient.setQueryData(["case", result.case.id], { case: result.case })
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["cases"] }), queryClient.invalidateQueries({ queryKey: ["dashboard"] })])
      onOpenChange(false)
    },
    onError: (cause) => toast.error(cause instanceof Error ? cause.message : "No se pudo guardar"),
  })
  const submit = (event: FormEvent) => { event.preventDefault(); mutation.mutate() }
  const set = <K extends keyof CaseInput>(key: K, value: CaseInput[K]) => setForm((current) => ({ ...current, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{initial ? "Editar causa" : "Nueva causa"}</DialogTitle><DialogDescription>Completa los datos principales. Podras agregar agenda, notas y documentos desde el detalle.</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-6">
          <section className="space-y-4">
            <div><h3 className="text-sm font-semibold">Identificacion</h3><p className="text-xs text-muted-foreground">Numero, caratula y jurisdiccion.</p></div>
            <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
              <div className="space-y-2"><Label>Tipo</Label><Select items={identifierTypeOptions} value={form.identifierType} onValueChange={(value) => set("identifierType", value ?? "CUIJ")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{identifierTypeOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Numero de causa</Label><Input value={form.identifierNumber} onChange={(event) => set("identifierNumber", event.target.value)} placeholder="21-09649494-4 o 7163/2025" /></div>
            </div>
            <div className="space-y-2"><Label>Caratula *</Label><Input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="Riquelme y otros s/ Homicidio" required /></div>
            <div className="space-y-2"><Label>Descripcion</Label><Textarea value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Resumen breve del asunto..." /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>Jurisdiccion</Label><Select items={jurisdictionOptions} value={form.jurisdiction} onValueChange={(value) => { const next = value ?? "SANTA_FE"; set("jurisdiction", next); set("procedureCode", next === "SANTA_FE" ? "CPPSF" : next === "FEDERAL" ? "CPPF" : "") }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{jurisdictionOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Codigo procesal</Label><Select items={procedureCodeOptions} value={form.procedureCode || "NONE"} onValueChange={(value) => set("procedureCode", !value || value === "NONE" ? "" : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{procedureCodeOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Estado general</Label><Select items={caseStatusOptions} value={form.status} onValueChange={(value) => set("status", value ?? "ACTIVE")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{caseStatusOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </section>
          <Separator />
          <section className="space-y-4">
            <div><h3 className="text-sm font-semibold">Imputados</h3><p className="text-xs text-muted-foreground">Puedes registrar varias personas en la misma causa.</p></div>
            {form.defendants.map((defendant, index) => <div key={index} className="grid gap-2 sm:grid-cols-[1fr_180px_auto]"><Input value={defendant.displayName} onChange={(event) => set("defendants", form.defendants.map((item, itemIndex) => itemIndex === index ? { ...item, displayName: event.target.value } : item))} placeholder="Apellido, Nombre" /><Input value={defendant.documentNumber ?? ""} onChange={(event) => set("defendants", form.defendants.map((item, itemIndex) => itemIndex === index ? { ...item, documentNumber: event.target.value } : item))} placeholder="DNI (opcional)" /><Button type="button" variant="ghost" size="icon" disabled={form.defendants.length === 1} onClick={() => set("defendants", form.defendants.filter((_, itemIndex) => itemIndex !== index))}><Trash2 /></Button></div>)}
            <Button type="button" variant="outline" size="sm" onClick={() => set("defendants", [...form.defendants, { displayName: "" }])}><Plus /> Agregar imputado</Button>
          </section>
          <Separator />
          <section className="space-y-4">
            <div><h3 className="text-sm font-semibold">Calificacion legal</h3><p className="text-xs text-muted-foreground">Selecciona una o varias figuras del catalogo penal.</p></div>
            <div className="flex min-h-9 flex-wrap gap-2 rounded-lg border p-2">{selectedOffenses.length ? selectedOffenses.map((offense) => <Badge key={offense.id} variant="secondary" className="gap-1">{offense.name} · {offense.legalReference}<button type="button" onClick={() => set("offenseIds", form.offenseIds.filter((id) => id !== offense.id))}><X className="size-3" /></button></Badge>) : <span className="px-1 text-sm text-muted-foreground">Sin figuras seleccionadas</span>}</div>
            <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={offenseSearch} onChange={(event) => setOffenseSearch(event.target.value)} placeholder="Buscar por delito, ley o articulo..." /></div>
            {offenseSearch && <div className="max-h-44 overflow-auto rounded-lg border p-1">{catalogs.data?.offenses.map((offense) => { const selected = form.offenseIds.includes(offense.id); return <button type="button" key={offense.id} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => set("offenseIds", selected ? form.offenseIds.filter((id) => id !== offense.id) : [...form.offenseIds, offense.id])}><Check className={`size-4 ${selected ? "opacity-100" : "opacity-0"}`} /><span className="flex-1">{offense.name}</span><span className="text-xs text-muted-foreground">{offense.legalReference}</span></button>})}</div>}
          </section>
          <Separator />
          <section className="space-y-4">
            <div><h3 className="text-sm font-semibold">Proceso y situacion personal</h3></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Etapa procesal</Label><Select items={stageOptions} value={form.currentStageId ?? "NONE"} onValueChange={(value) => set("currentStageId", !value || value === "NONE" ? null : value)}><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger><SelectContent>{stageOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Prioridad interna</Label><Select items={priorityOptions} value={String(form.priority)} onValueChange={(value) => set("priority", Number(value ?? 0))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{priorityOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Privacion de libertad</Label><Select items={custodyStatusOptions} value={form.custodyStatus ?? "NONE"} onValueChange={(value) => set("custodyStatus", !value || value === "NONE" ? null : value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{custodyStatusOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Unidad / lugar</Label><Select items={facilityOptions} value={form.facilityId ?? "NONE"} onValueChange={(value) => set("facilityId", !value || value === "NONE" ? null : value)} disabled={!form.custodyStatus || form.custodyStatus === "RELEASED"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{facilityOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </section>
          {!initial && <><Separator /><section className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Nota inicial</Label><Textarea value={form.note} onChange={(event) => set("note", event.target.value)} placeholder="Estrategia, pendientes..." /></div><div className="space-y-2"><Label>Carpeta de Drive</Label><Input type="url" value={form.driveUrl} onChange={(event) => set("driveUrl", event.target.value)} placeholder="https://drive.google.com/..." /></div></section></>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={mutation.isPending || !form.title.trim()}>{mutation.isPending ? "Guardando..." : "Guardar causa"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
