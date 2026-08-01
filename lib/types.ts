export type User = { id: string; email: string; fullName: string | null }
export type Workspace = { id: string; name: string; slug: string; timezone: string }
export type Session = { user: User; workspace: Workspace; role: string }
export type Identifier = { id: string; type: string; number: string; isPrimary: boolean }
export type Contact = { id: string; displayName: string; documentNumber: string | null }
export type Stage = { id: string; jurisdiction: string; procedureCode: string | null; name: string; category: string }
export type Facility = { id: string; name: string; system: string }
export type Offense = { id: string; name: string; legalReference: string; category: { id: string; name: string } }
export type CaseEvent = {
  id: string
  caseId: string
  type: string
  title: string
  description: string | null
  startsAt: string
  status: string
  case?: { id: string; title: string; identifiers: Identifier[] }
}
export type CaseNote = { id: string; content: string; isPinned: boolean; createdAt: string; createdBy: User }
export type CaseResource = { id: string; type: string; name: string; url: string; createdAt: string }
export type LegalCase = {
  id: string
  title: string
  description: string | null
  jurisdiction: string
  procedureCode: string | null
  status: string
  priority: number
  currentStageId: string | null
  currentStage: Stage | null
  primaryIdentifier: Identifier | null
  identifiers: Identifier[]
  defendants: Contact[]
  parties: Array<{ id: string; role: string; contact: Contact }>
  offenses: Array<{ id: string; offense: Offense }>
  currentCustody: { id: string; status: string; facilityId: string | null; facility: Facility | null } | null
  custodyRecords: Array<{ id: string; status: string; startedAt: string; endedAt: string | null; facility: Facility | null }>
  nextEvent: CaseEvent | null
  events: CaseEvent[]
  notes: CaseNote[]
  resources: CaseResource[]
  urgency: { level: string; days: number | null }
  updatedAt: string
}
export type CaseInput = {
  title: string
  description?: string
  identifierType: string
  identifierNumber: string
  jurisdiction: string
  procedureCode?: string
  status: string
  priority: number
  currentStageId?: string | null
  defendants: Array<{ displayName: string; documentNumber?: string }>
  offenseIds: string[]
  custodyStatus?: string | null
  facilityId?: string | null
  note?: string
  driveUrl?: string
}

export type SisfeSyncRun = {
  id: string
  status: "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED" | "NEEDS_LOGIN"
  startedAt: string
  finishedAt: string | null
  foundCount: number
  syncedCount: number
  changedCount: number
  movementCount: number
  errorCount: number
  errorMessage: string | null
}

export type SisfeStatus = {
  connected: boolean
  expiresAt: string | null
  lastValidatedAt: string | null
  total: number
  lastRun: SisfeSyncRun | null
}

export type SisfeExpediente = {
  id: string
  legalCaseId: string | null
  sisfeId: string
  cuij: string | null
  numero: string
  caratula: string
  fechaInicio: string | null
  fechaActualizacion: string | null
  radicacion: string | null
  ubicacion: string | null
  localidad: string | null
  visible: string | null
  digital: boolean
  lastSeenAt: string
  lastSyncedAt: string
  createdAt: string
  updatedAt: string
  _count?: { movements: number; snapshots: number; documents: number }
}

export type SisfeMovement = {
  id: string
  sisfeId: string | null
  fecha: string | null
  tipo: string | null
  descripcion: string | null
  firstSeenAt: string
  lastSeenAt: string
}

export type SisfeSnapshot = {
  id: string
  ubicacion: string
  radicacion: string
  actualizadoEn: string
  createdAt: string
}

export type SisfeDocument = {
  id: string
  movementId: string | null
  source: "ACTUACION" | "CARGO"
  status: "PENDING" | "AVAILABLE"
  externalId: string
  fileName: string
  mimeType: string
  byteSize: number | null
  sha256: string | null
  fecha: string | null
  observacion: string | null
  attempts: number
  lastError: string | null
  prioritized: boolean
  prioritizedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SisfeDocumentQueueItem = Pick<SisfeDocument,
  "id" | "source" | "status" | "externalId" | "fileName" | "mimeType" | "byteSize" |
  "attempts" | "lastError" | "prioritized" | "createdAt" | "updatedAt"
> & {
  expediente: { id: string; sisfeId: string; cuij: string | null; numero: string; caratula: string }
  movement: { sisfeId: string | null } | null
}

export type SisfeDocumentQueue = {
  items: SisfeDocumentQueueItem[]
  total: number
  page: number
  pages: number
  stats: { total: number; available: number; pending: number; errors: number; prioritized: number; percentage: number }
  nextPending: SisfeDocumentQueueItem | null
}

export type SisfeExpedienteDetail = SisfeExpediente & {
  movements: SisfeMovement[]
  snapshots: SisfeSnapshot[]
  documents: SisfeDocument[]
  legalCase: { id: string; title: string } | null
}
