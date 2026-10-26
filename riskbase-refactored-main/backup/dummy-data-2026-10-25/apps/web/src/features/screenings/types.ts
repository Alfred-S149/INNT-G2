export type Score = -2 | -1 | 0 | 1 | 2
export type ScreeningStatus = "Completed" | "In progress" | "Review" | "Draft"
export type RiskLevel = "Low" | "Medium" | "High" | "Critical"

export interface TemplateField {
  id: string
  name: string
  weight: number
  isDealbreakerField: boolean
  extractionPrompt: string
  gapInstruction: string
}

export interface TemplateCategory {
  id: string
  name: string
  fields: TemplateField[]
}

export interface FieldResult {
  /** The AI's proposed score. */
  score: Score
  confidence: number
  extractedContent: string
  isGap: boolean
  sources?: SourceRef[]
}

/** One project's screening against a template, with a result per criterion. */
export interface TemplateScreening {
  id: string
  projectId: string
  project: string
  status: ScreeningStatus
  screenedAt: string
  files: string[]
  maut: number
  results: Record<string, FieldResult>
}

export interface TemplateScreenings {
  id: string
  name: string
  categories: TemplateCategory[]
  screenings: TemplateScreening[]
}

// ─── Human review ────────────────────────────────────────────────────────────

/** A passage in a source document that the AI based its assessment on. */
export interface SourceRef {
  documentName: string
  page: number
  quote: string
  /** Set when a reviewer cited the passage themselves rather than the AI. */
  addedBy?: string
  addedAt?: string
}

/**
 * pending   — AI proposal only, nobody has looked at it yet
 * accepted  — a reviewer agrees with the AI score
 * overridden — a reviewer set a different score (rationale required)
 * follow_up — can't be settled yet, e.g. a document must be requested (note required)
 */
export type ReviewStatus = "pending" | "accepted" | "overridden" | "follow_up"

export interface CellReview {
  status: Exclude<ReviewStatus, "pending">
  /** The reviewer's score — only differs from the AI score when overridden. */
  score: Score
  rationale: string
  reviewer: string
  reviewedAt: string
}

export type CellEventType = "ai_assessed" | "accepted" | "overridden" | "follow_up" | "reopened" | "evidence_added"

/** Audit trail entry for one criterion on one screening. */
export interface CellEvent {
  id: string
  type: CellEventType
  actor: string
  at: string
  text?: string
  fromScore?: Score
  toScore?: Score
}

export type Recommendation = "go" | "hold" | "no_go"

/**
 * The consolidated assessment of a prospect: the reviewer's written conclusion and
 * recommendation, built on the reviewed criteria and the evidence they cite.
 */
export interface ProspectAssessment {
  status: "draft" | "final"
  conclusion: string
  recommendation: Recommendation | null
  author: string
  updatedAt: string
}
