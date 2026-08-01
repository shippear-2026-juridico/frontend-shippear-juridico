export type SelectOption = {
  value: string
  label: string
}

export const identifierTypeOptions: SelectOption[] = [
  "CUIJ", "FRO", "CFP", "CCC", "CPF", "CPN", "CNT", "COM", "FBB", "FCB", "FCR",
  "FCT", "FGR", "FLP", "FMP", "FMZ", "FPA", "FPO", "FRE", "FSA", "FSM", "FTU",
].map((value) => ({ value, label: value }))

export const jurisdictionOptions: SelectOption[] = [
  { value: "SANTA_FE", label: "Santa Fe" },
  { value: "FEDERAL", label: "Federal" },
  { value: "OTHER", label: "Otra" },
]

export const procedureCodeOptions: SelectOption[] = [
  { value: "NONE", label: "Sin definir" },
  { value: "CPPSF", label: "CPPSF · Santa Fe" },
  { value: "CPPF", label: "CPPF · Federal" },
  { value: "AMBOS", label: "Ambos códigos" },
  { value: "MENORES", label: "Justicia de menores" },
]

export const caseStatusOptions: SelectOption[] = [
  { value: "ACTIVE", label: "Activa" },
  { value: "SUSPENDED", label: "Suspendida" },
  { value: "CLOSED", label: "Cerrada" },
  { value: "ARCHIVED", label: "Archivada" },
]

export const caseStatusFilterOptions: SelectOption[] = [
  { value: "ALL", label: "Todos los estados" },
  { value: "ACTIVE", label: "Activas" },
  { value: "SUSPENDED", label: "Suspendidas" },
  { value: "CLOSED", label: "Cerradas" },
  { value: "ARCHIVED", label: "Archivadas" },
]

export const urgencyFilterOptions: SelectOption[] = [
  { value: "ALL", label: "Toda urgencia" },
  { value: "OVERDUE", label: "Vencidas" },
  { value: "URGENT", label: "Urgentes" },
  { value: "UPCOMING", label: "Próximas" },
  { value: "NONE", label: "Sin agenda" },
]

export const priorityOptions: SelectOption[] = [
  { value: "0", label: "Normal" },
  { value: "1", label: "Alta" },
  { value: "2", label: "Crítica" },
]

export const custodyStatusOptions: SelectOption[] = [
  { value: "NONE", label: "Sin registrar" },
  { value: "DETAINED", label: "Detenido" },
  { value: "HOUSE_ARREST", label: "Prisión domiciliaria" },
  { value: "RELEASED", label: "En libertad" },
]

export const eventTypeOptions: SelectOption[] = [
  { value: "HEARING", label: "Audiencia" },
  { value: "DEADLINE", label: "Vencimiento" },
  { value: "TASK", label: "Tarea" },
  { value: "FILING", label: "Presentación" },
  { value: "MEETING", label: "Reunión" },
  { value: "OTHER", label: "Otro" },
]
