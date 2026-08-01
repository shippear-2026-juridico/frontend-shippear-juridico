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
