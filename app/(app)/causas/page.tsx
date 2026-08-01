"use client"

import Link from "next/link"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, FolderOpen, Plus, Search } from "lucide-react"
import { api, queryString } from "@/lib/api"
import { caseStatusFilterOptions, urgencyFilterOptions } from "@/lib/legal-select-options"
import type { LegalCase } from "@/lib/types"
import { CaseFormDialog } from "@/components/case-form-dialog"
import { CaseStatusBadge, custodyLabel, UrgencyBadge } from "@/components/legal-badges"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type CasesResponse = { items: LegalCase[]; page: number; pages: number; total: number }

export default function CasesPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [urgency, setUrgency] = useState("")
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ["cases", search, status, urgency, page],
    queryFn: () => api<CasesResponse>(`/api/cases${queryString({ q: search, status, urgency, page, pageSize: 25 })}`),
  })
  const openCreate = () => { setFormKey((current) => current + 1); setCreateOpen(true) }

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader eyebrow="Expedientes" title="Causas" description="Busca, filtra y administra el universo de causas del estudio." actions={<Button onClick={openCreate}><Plus /> Nueva causa</Button>} />
      <Card>
        <CardContent className="p-0">
          <div className="grid gap-3 border-b p-4 md:grid-cols-[1fr_190px_190px]">
            <div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="CUIJ, caratula, imputado o delito..." /></div>
            <Select items={caseStatusFilterOptions} value={status || "ALL"} onValueChange={(value) => { setStatus(!value || value === "ALL" ? "" : value); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{caseStatusFilterOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
            <Select items={urgencyFilterOptions} value={urgency || "ALL"} onValueChange={(value) => { setUrgency(!value || value === "ALL" ? "" : value); setPage(1) }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{urgencyFilterOptions.map(({ value, label }) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table><TableHeader><TableRow><TableHead>Urgencia</TableHead><TableHead>Numero</TableHead><TableHead>Caratula</TableHead><TableHead>Imputado/s</TableHead><TableHead>Delito principal</TableHead><TableHead>Etapa</TableHead><TableHead>Situacion</TableHead><TableHead>Proximo evento</TableHead></TableRow></TableHeader><TableBody>
              {isLoading ? Array.from({ length: 5 }).map((_, index) => <TableRow key={index}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) : data?.items.length ? data.items.map((item) => (
                <TableRow key={item.id} className="cursor-pointer"><TableCell><Link href={`/causas/${item.id}`}><UrgencyBadge {...item.urgency} /></Link></TableCell><TableCell className="font-mono text-xs"><Link href={`/causas/${item.id}`}>{item.primaryIdentifier ? `${item.primaryIdentifier.type} ${item.primaryIdentifier.number}` : "—"}</Link></TableCell><TableCell className="max-w-64 font-medium"><Link href={`/causas/${item.id}`} className="block truncate">{item.title}</Link></TableCell><TableCell className="max-w-52 truncate">{item.defendants.map((person) => person.displayName).join(", ") || "—"}</TableCell><TableCell className="max-w-52 truncate">{item.offenses[0]?.offense.name ?? "—"}</TableCell><TableCell className="max-w-52 truncate">{item.currentStage?.name ?? "—"}</TableCell><TableCell>{custodyLabel(item.currentCustody?.status)}</TableCell><TableCell>{item.nextEvent ? <div><p className="text-xs font-medium">{new Date(item.nextEvent.startsAt).toLocaleDateString("es-AR")}</p><p className="max-w-40 truncate text-xs text-muted-foreground">{item.nextEvent.title}</p></div> : "—"}</TableCell></TableRow>
              )) : <TableRow><TableCell colSpan={8} className="h-48 text-center text-muted-foreground">No hay causas que coincidan con los filtros.</TableCell></TableRow>}
            </TableBody></Table>
          </div>
          <div className="grid gap-3 p-4 md:hidden">{isLoading ? <Skeleton className="h-36" /> : data?.items.map((item) => (
            <Link key={item.id} href={`/causas/${item.id}`} className="rounded-xl border bg-background p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[11px] text-muted-foreground">{item.primaryIdentifier ? `${item.primaryIdentifier.type} ${item.primaryIdentifier.number}` : "Sin numero"}</p><h2 className="mt-1 font-medium">{item.title}</h2></div><UrgencyBadge {...item.urgency} /></div><p className="mt-3 truncate text-sm text-muted-foreground">{item.defendants.map((person) => person.displayName).join(", ") || "Sin imputados"}</p><div className="mt-3 flex items-center justify-between"><CaseStatusBadge status={item.status} /><FolderOpen className="size-4 text-muted-foreground" /></div></Link>
          ))}</div>
          <div className="flex items-center justify-between border-t px-4 py-3"><p className="text-xs text-muted-foreground">{data?.total ?? 0} causas</p><div className="flex items-center gap-2"><Button size="icon-sm" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft /></Button><span className="text-xs">Pagina {data?.page ?? page} de {data?.pages ?? 1}</span><Button size="icon-sm" variant="outline" disabled={page >= (data?.pages ?? 1)} onClick={() => setPage((current) => current + 1)}><ChevronRight /></Button></div></div>
        </CardContent>
      </Card>
      <CaseFormDialog key={formKey} open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
