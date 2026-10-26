"use client"

import { useReducer, useState, type KeyboardEvent } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { IconArrowDown, IconArrowUp, IconSearch } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  finalScore,
  scopeScore,
  type CellEvent,
  type CellReview,
  type ProspectAssessment,
  type Score,
  type TemplateField,
  type TemplateScreening,
  type TemplateScreenings,
} from "@/features/screenings"
import { cn } from "@/lib/utils"
import { buildCase, progressOf, sourcesOf } from "../assessment"
import { cellKey, nowLabel, reviewReducer } from "../review-state"
import type { CompareProject, DataRoomDocument, SortKey, SortState, ViewerTarget } from "../types"
import type { Citation } from "./document-viewer"
import { AssessmentPanel } from "./assessment-panel"
import { FieldCell } from "./field-cell"
import { ReviewPanel } from "./review-panel"
import { RecommendationTag, ScoreMeter } from "./score-chip"
import { ScopePicker } from "./scope-picker"

// pdf.js needs the browser — load the viewer only on the client, and only when opened.
const DocumentViewer = dynamic(() => import("./document-viewer").then((m) => m.DocumentViewer), { ssr: false })

const COL_PROJECT = 248
const COL_SCORE = 88
const COL_FIELD = 168

type Panel = { kind: "criterion"; screeningId: string; fieldId: string } | { kind: "assessment"; screeningId: string }

interface Cell {
  screening: TemplateScreening
  field: TemplateField
}

interface ComparisonGridProps {
  templates: { id: string; name: string }[]
  data: TemplateScreenings
  projects: Record<string, CompareProject>
  currentUser: string
  initialReviews: Record<string, Record<string, CellReview>>
  initialAssessments: Record<string, ProspectAssessment>
}

export function ComparisonGrid({
  templates,
  data,
  projects,
  currentUser,
  initialReviews,
  initialAssessments,
}: ComparisonGridProps) {
  const router = useRouter()

  const allFields = data.categories.flatMap((c) => c.fields)
  const categoryOf = Object.fromEntries(data.categories.flatMap((c) => c.fields.map((f) => [f.id, c.name])))

  const [state, dispatch] = useReducer(reviewReducer, {
    reviews: initialReviews,
    events: {},
    assessments: initialAssessments,
    uploads: {},
    addedSources: {},
    seq: 0,
  })
  const [scope, setScope] = useState<Set<string>>(() => new Set(allFields.map((f) => f.id)))
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortState>({ key: "scope", dir: "desc" })
  const [panel, setPanel] = useState<Panel | null>(null)
  const [viewer, setViewer] = useState<ViewerTarget | null>(null)

  const reviewOf = (screeningId: string, fieldId: string) => state.reviews[screeningId]?.[fieldId]

  // ── Data room & evidence ──

  const documentsOf = (projectId: string): DataRoomDocument[] => [
    ...(projects[projectId]?.documents ?? []),
    ...(state.uploads[projectId] ?? []),
  ]

  function citationsOf(screening: TemplateScreening): Citation[] {
    return allFields.flatMap((field) =>
      sourcesOf(screening, field.id, state.addedSources[screening.id]).map((source) => ({
        fieldId: field.id,
        fieldName: field.name,
        source,
      }))
    )
  }

  function citedByOf(screening: TemplateScreening): Record<string, number> {
    const fieldsByDoc = new Map<string, Set<string>>()
    for (const c of citationsOf(screening)) {
      fieldsByDoc.set(c.source.documentName, (fieldsByDoc.get(c.source.documentName) ?? new Set()).add(c.fieldId))
    }
    return Object.fromEntries([...fieldsByDoc].map(([doc, fields]) => [doc, fields.size]))
  }

  function upload(projectId: string, files: File[]) {
    dispatch({
      type: "upload",
      projectId,
      documents: files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: nowLabel(),
        status: "ready",
        url: URL.createObjectURL(file),
        addedBy: currentUser,
      })),
    })
  }

  // ── Derived view ──

  const categoriesInScope = data.categories
    .map((c) => ({ ...c, fields: c.fields.filter((f) => scope.has(f.id)) }))
    .filter((c) => c.fields.length > 0)
  const fieldsInScope = categoriesInScope.flatMap((c) => c.fields)

  const rows = (() => {
    const q = query.trim().toLowerCase()
    const withScore = data.screenings
      .filter((s) => !q || s.project.toLowerCase().includes(q))
      .map((s) => ({ screening: s, score: scopeScore(s, fieldsInScope, state.reviews[s.id]) }))

    const value = (row: (typeof withScore)[number]): number | string | null => {
      if (sort.key === "project") return row.screening.project
      if (sort.key === "scope") return row.score
      return finalScore(row.screening.results[sort.key], reviewOf(row.screening.id, sort.key))
    }

    return withScore.sort((a, b) => {
      const va = value(a)
      const vb = value(b)
      if (va === null) return vb === null ? 0 : 1
      if (vb === null) return -1
      const cmp = typeof va === "string" ? va.localeCompare(String(vb)) : va - (vb as number)
      return sort.dir === "asc" ? cmp : -cmp
    })
  })()

  // Reading order of the cells on screen — drives prev/next and "save and next".
  const visibleCells: Cell[] = rows.flatMap(({ screening }) =>
    fieldsInScope.filter((f) => screening.results[f.id]).map((field) => ({ screening, field }))
  )

  const overall = visibleCells.reduce(
    (acc, { screening, field }) => {
      acc.total++
      const review = reviewOf(screening.id, field.id)
      if (review && review.status !== "follow_up") acc.reviewed++
      return acc
    },
    { total: 0, reviewed: 0 }
  )

  // ── Selection & navigation ──

  const selectedIndex =
    panel?.kind === "criterion"
      ? visibleCells.findIndex((c) => c.screening.id === panel.screeningId && c.field.id === panel.fieldId)
      : -1
  const selectedCell = selectedIndex >= 0 ? visibleCells[selectedIndex] : undefined

  function openCell(cell: Cell | undefined, opts: { focus?: boolean } = {}) {
    if (!cell) return
    setPanel({ kind: "criterion", screeningId: cell.screening.id, fieldId: cell.field.id })
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-cell="${cellKey(cell.screening.id, cell.field.id)}"]`)
      if (opts.focus) el?.focus()
      else el?.scrollIntoView({ block: "nearest", inline: "nearest" })
    })
  }

  function onGridKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      setPanel(null)
      return
    }
    if (!selectedCell || !e.key.startsWith("Arrow")) return
    e.preventDefault()
    const r = rows.findIndex((row) => row.screening.id === selectedCell.screening.id) +
      (e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0)
    const c = fieldsInScope.findIndex((f) => f.id === selectedCell.field.id) +
      (e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0)
    const screening = rows[r]?.screening
    const field = fieldsInScope[c]
    if (screening && field && screening.results[field.id]) openCell({ screening, field }, { focus: true })
  }

  function eventsFor({ screening, field }: Cell): CellEvent[] {
    const result = screening.results[field.id]!
    const base: CellEvent[] = [
      { id: "ai", type: "ai_assessed", actor: "Riskbase AI", at: screening.screenedAt, toScore: result.score },
    ]
    const seeded = initialReviews[screening.id]?.[field.id]
    if (seeded) {
      base.push({
        id: "seed",
        type: seeded.status,
        actor: seeded.reviewer,
        at: seeded.reviewedAt,
        text: seeded.rationale || undefined,
        fromScore: seeded.status === "overridden" ? result.score : undefined,
        toScore: seeded.status === "overridden" ? seeded.score : undefined,
      })
    }
    return [...base, ...(state.events[cellKey(screening.id, field.id)] ?? [])]
  }

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "project" ? "asc" : "desc" }
    )
  }

  const leftWidth = COL_PROJECT + COL_SCORE
  const assessmentScreening =
    panel?.kind === "assessment" ? data.screenings.find((s) => s.id === panel.screeningId) : undefined

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Header ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-background px-8 py-4">
        <div className="mr-auto flex flex-col gap-0.5">
          <h1 className="text-base font-semibold">Compare</h1>
          <span className="text-xs text-muted-foreground">
            {overall.reviewed} of {overall.total} assessments reviewed
          </span>
        </div>

        <Select
          items={templates.map((t) => ({ value: t.id, label: t.name }))}
          value={data.id}
          onValueChange={(v: string | null) => {
            if (v && v !== data.id) router.push(`/compare?template=${encodeURIComponent(v)}`)
          }}
        >
          <SelectTrigger size="sm" className="w-44" aria-label="Template">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ScopePicker categories={data.categories} selected={scope} onChange={setScope} />

        <div className="relative">
          <IconSearch className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find prospect"
            aria-label="Find prospect"
            className="h-7 w-44 pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {fieldsInScope.length === 0 ? (
          <EmptyMessage>No criteria in scope. Choose what to compare under Scope.</EmptyMessage>
        ) : rows.length === 0 ? (
          <EmptyMessage>No prospects match “{query}”.</EmptyMessage>
        ) : (
          <div className="min-w-0 flex-1 overflow-auto" onKeyDown={onGridKeyDown}>
            <table
              className="border-separate border-spacing-0 text-left"
              style={{ minWidth: leftWidth + fieldsInScope.length * COL_FIELD }}
            >
              <thead className="sticky top-0 z-30">
                <tr>
                  <th colSpan={2} className="sticky left-0 z-40 border-b border-border bg-muted" style={{ width: leftWidth }} />
                  {categoriesInScope.map((cat) => (
                    <th
                      key={cat.id}
                      colSpan={cat.fields.length}
                      className="border-b border-l border-border bg-muted px-3 py-2 text-xs font-semibold whitespace-nowrap text-foreground/80"
                    >
                      {cat.name}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th
                    className="sticky left-0 z-40 border-b border-border bg-card px-4 py-2.5 align-bottom"
                    style={{ width: COL_PROJECT, minWidth: COL_PROJECT }}
                  >
                    <SortButton active={sort.key === "project"} dir={sort.dir} onClick={() => toggleSort("project")}>
                      Prospect
                    </SortButton>
                  </th>
                  <th
                    className="sticky z-40 border-r border-b border-border bg-card px-3 py-2.5 align-bottom"
                    style={{ left: COL_PROJECT, width: COL_SCORE, minWidth: COL_SCORE }}
                  >
                    <SortButton
                      active={sort.key === "scope"}
                      dir={sort.dir}
                      onClick={() => toggleSort("scope")}
                      title="Weighted 0–1 score across the criteria in scope. Reviewed scores replace AI proposals."
                    >
                      Score
                    </SortButton>
                  </th>
                  {fieldsInScope.map((field, i) => {
                    const firstInCategory = categoriesInScope.some((c) => c.fields[0]?.id === field.id)
                    return (
                      <th
                        key={field.id}
                        className={cn("border-b border-border bg-card px-3 py-2.5 align-bottom", firstInCategory && i > 0 && "border-l")}
                        style={{ width: COL_FIELD, minWidth: COL_FIELD }}
                      >
                        <SortButton
                          active={sort.key === field.id}
                          dir={sort.dir}
                          onClick={() => toggleSort(field.id)}
                          title={field.extractionPrompt || field.name}
                        >
                          <span className="line-clamp-2 text-left">{field.name}</span>
                        </SortButton>
                      </th>
                    )
                  })}
                </tr>
              </thead>

              <tbody>
                {rows.map(({ screening, score }) => {
                  const progress = progressOf(screening, allFields, state.reviews[screening.id])
                  const assessment = state.assessments[screening.id]
                  const assessmentOpen = panel?.kind === "assessment" && panel.screeningId === screening.id

                  return (
                    <tr key={screening.id} className="group/row">
                      <td
                        className="sticky left-0 z-20 border-b border-border bg-card p-0 align-top group-hover/row:bg-accent"
                        style={{ width: COL_PROJECT, minWidth: COL_PROJECT }}
                      >
                        <button
                          type="button"
                          onClick={() => setPanel({ kind: "assessment", screeningId: screening.id })}
                          className={cn(
                            "flex size-full flex-col gap-1.5 px-4 py-2.5 text-left",
                            assessmentOpen && "bg-accent shadow-[inset_2px_0_0_var(--primary)]"
                          )}
                        >
                          <span className="truncate text-sm font-semibold text-foreground">{screening.project}</span>
                          {assessment?.status === "final" && assessment.recommendation ? (
                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <RecommendationTag value={assessment.recommendation} />
                              Assessed
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {progress.reviewed}/{progress.total} reviewed
                              {assessment && " · draft"}
                            </span>
                          )}
                        </button>
                      </td>

                      <td
                        className="sticky z-20 border-r border-b border-border bg-card px-3 py-2.5 align-top group-hover/row:bg-accent"
                        style={{ left: COL_PROJECT, width: COL_SCORE, minWidth: COL_SCORE }}
                      >
                        <div className="flex flex-col gap-1.5 pt-0.5">
                          <span className="text-sm font-semibold tabular-nums">{score === null ? "—" : score.toFixed(2)}</span>
                          <ScoreMeter value={score} />
                        </div>
                      </td>

                      {fieldsInScope.map((field, i) => {
                        const firstInCategory = categoriesInScope.some((c) => c.fields[0]?.id === field.id)
                        return (
                          <td
                            key={field.id}
                            className={cn("border-b border-border bg-background p-0 align-top group-hover/row:bg-accent/40", firstInCategory && i > 0 && "border-l")}
                            style={{ width: COL_FIELD, minWidth: COL_FIELD }}
                          >
                            <FieldCell
                              cellId={cellKey(screening.id, field.id)}
                              field={field}
                              result={screening.results[field.id]}
                              review={reviewOf(screening.id, field.id)}
                              selected={panel?.kind === "criterion" && panel.screeningId === screening.id && panel.fieldId === field.id}
                              onSelect={() => openCell({ screening, field })}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedCell && (
          <ReviewPanel
            projectId={selectedCell.screening.projectId}
            projectName={selectedCell.screening.project}
            screeningId={selectedCell.screening.id}
            categoryName={categoryOf[selectedCell.field.id] ?? ""}
            field={selectedCell.field}
            result={selectedCell.screening.results[selectedCell.field.id]!}
            review={reviewOf(selectedCell.screening.id, selectedCell.field.id)}
            events={eventsFor(selectedCell)}
            sources={sourcesOf(selectedCell.screening, selectedCell.field.id, state.addedSources[selectedCell.screening.id])}
            onOpenSource={(source) =>
              setViewer({
                projectId: selectedCell.screening.projectId,
                screeningId: selectedCell.screening.id,
                documentName: source.documentName,
                focus: { page: source.page, quote: source.quote },
              })
            }
            position={{ index: selectedIndex, total: visibleCells.length }}
            onReview={(status, reviewScore: Score, rationale, advance) => {
              const { screening, field } = selectedCell
              dispatch({
                type: "review",
                screeningId: screening.id,
                fieldId: field.id,
                aiScore: screening.results[field.id]!.score,
                review: { status, score: reviewScore, rationale, reviewer: currentUser, reviewedAt: nowLabel() },
              })
              if (advance) {
                // `state` is still pre-dispatch here, so skip the current cell explicitly.
                const unreviewed = (c: Cell, i: number) => i !== selectedIndex && !reviewOf(c.screening.id, c.field.id)
                const next =
                  visibleCells.find((c, i) => i > selectedIndex && unreviewed(c, i)) ?? visibleCells.find(unreviewed)
                if (next) openCell(next)
              }
            }}
            onReopen={() =>
              dispatch({
                type: "reopen",
                screeningId: selectedCell.screening.id,
                fieldId: selectedCell.field.id,
                actor: currentUser,
                at: nowLabel(),
              })
            }
            onNavigate={(dir) => openCell(visibleCells[selectedIndex + dir])}
            onClose={() => setPanel(null)}
          />
        )}

        {assessmentScreening && projects[assessmentScreening.projectId] && (
          <AssessmentPanel
            project={{ ...projects[assessmentScreening.projectId]!, documents: documentsOf(assessmentScreening.projectId) }}
            templateName={data.name}
            caseFile={buildCase(
              assessmentScreening,
              data.categories,
              state.reviews[assessmentScreening.id],
              state.addedSources[assessmentScreening.id]
            )}
            citedBy={citedByOf(assessmentScreening)}
            onUpload={(files) => upload(assessmentScreening.projectId, files)}
            onOpenDocument={(documentName, focus) =>
              setViewer({
                projectId: assessmentScreening.projectId,
                screeningId: assessmentScreening.id,
                documentName,
                focus,
              })
            }
            score={scopeScore(assessmentScreening, allFields, state.reviews[assessmentScreening.id])}
            assessment={state.assessments[assessmentScreening.id]}
            onSave={(draft) =>
              dispatch({
                type: "save_assessment",
                screeningId: assessmentScreening.id,
                assessment: { ...draft, author: currentUser, updatedAt: nowLabel() },
              })
            }
            onOpenCriterion={(field) => openCell({ screening: assessmentScreening, field })}
            onClose={() => setPanel(null)}
          />
        )}
      </div>

      {viewer && (() => {
        const screening = data.screenings.find((sc) => sc.id === viewer.screeningId)
        if (!screening) return null
        return (
          <DocumentViewer
            key={`${viewer.projectId}:${viewer.documentName}:${viewer.focus?.page ?? ""}:${viewer.focus?.quote ?? ""}`}
            documents={documentsOf(viewer.projectId)}
            documentName={viewer.documentName}
            focus={viewer.focus}
            citations={citationsOf(screening)}
            fields={allFields}
            onSelectDocument={(documentName) => setViewer({ ...viewer, documentName, focus: undefined })}
            onCite={(fieldId, source) =>
              dispatch({
                type: "add_source",
                screeningId: screening.id,
                fieldId,
                source: { ...source, addedBy: currentUser, addedAt: nowLabel() },
              })
            }
            onClose={() => setViewer(null)}
          />
        )
      })()}
    </div>
  )
}

// ─── Bits ────────────────────────────────────────────────────────────────────

function SortButton({
  active,
  dir,
  onClick,
  title,
  children,
}: {
  active: boolean
  dir: "asc" | "desc"
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
  const Icon = dir === "asc" ? IconArrowUp : IconArrowDown
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-start gap-1 text-xs font-medium text-foreground/80 hover:text-foreground",
        active && "text-foreground"
      )}
    >
      {children}
      {active && <Icon className="mt-px size-3 shrink-0" />}
    </button>
  )
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center p-12 text-sm text-muted-foreground">{children}</div>
}
