import { Badge } from "@/components/ui/badge"

const urgencyMap: Record<string, { label: string; className: string }> = {
  OVERDUE: { label: "Vencida", className: "border-red-200 bg-red-50 text-red-700" },
  URGENT: { label: "Urgente", className: "border-orange-200 bg-orange-50 text-orange-700" },
  UPCOMING: { label: "Proxima", className: "border-amber-200 bg-amber-50 text-amber-700" },
  NORMAL: { label: "En termino", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  NONE: { label: "Sin agenda", className: "border-stone-200 bg-stone-50 text-stone-500" },
}

export function UrgencyBadge({ level, days }: { level: string; days?: number | null }) {
  const value = urgencyMap[level] ?? urgencyMap.NONE
  return <Badge variant="outline" className={value.className}>{value.label}{days !== null && days !== undefined ? ` · ${days}d` : ""}</Badge>
}

export function CaseStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = { ACTIVE: "Activa", SUSPENDED: "Suspendida", CLOSED: "Cerrada", ARCHIVED: "Archivada" }
  return <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>{labels[status] ?? status}</Badge>
}

export const eventTypeLabel = (type: string) => ({ HEARING: "Audiencia", DEADLINE: "Vencimiento", TASK: "Tarea", FILING: "Presentacion", MEETING: "Reunion", OTHER: "Otro" }[type] ?? type)
export const custodyLabel = (status?: string | null) => ({ DETAINED: "Detenido", HOUSE_ARREST: "Domiciliaria", RELEASED: "En libertad" }[status ?? ""] ?? "Sin registrar")
