"use client"

import { isDealbreaker, type CellReview, type FieldResult, type TemplateField } from "@/features/screenings"
import { cn } from "@/lib/utils"
import { GapPill, ScorePill } from "./score-chip"

interface FieldCellProps {
  cellId: string
  field: TemplateField
  result: FieldResult | undefined
  review: CellReview | undefined
  selected: boolean
  onSelect: () => void
}

export function FieldCell({ cellId, field, result, review, selected, onSelect }: FieldCellProps) {
  if (!result) {
    return <div className="px-3 py-2.5 text-xs text-muted-foreground">—</div>
  }

  const isGap = review ? review.status === "follow_up" : result.isGap
  const dealbreaker = isDealbreaker(field, result, review)
  const summary = review?.rationale || (isGap ? field.gapInstruction : result.extractedContent)

  return (
    <button
      type="button"
      data-cell={cellId}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex size-full scroll-mt-24 scroll-ml-[340px] flex-col gap-1.5 px-3 py-2.5 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent",
        selected && "bg-accent ring-2 ring-primary/60 ring-inset"
      )}
    >
      <span className="flex items-center gap-1.5">
        {isGap ? <GapPill /> : <ScorePill score={review?.score ?? result.score} reviewed={!!review} />}
        {dealbreaker && <span className="text-[11px] font-medium text-destructive">Dealbreaker</span>}
      </span>
      {summary && <span className="line-clamp-2 text-xs leading-snug text-foreground/75">{summary}</span>}
    </button>
  )
}
