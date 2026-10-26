import type { Metadata } from "next"
import { ComparisonGrid, type CompareProject } from "@/features/compare"
import { PROJECT_DETAILS } from "@/features/projects"
import { SEED_ASSESSMENTS, SEED_REVIEWS, TEMPLATE_SCREENINGS } from "@/features/screenings"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Compare · Riskbase",
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const { template } = await searchParams
  const templates = Object.values(TEMPLATE_SCREENINGS)
  const data = (template && TEMPLATE_SCREENINGS[template]) || templates[0]!

  // Only send the client what the grid shows — document markdown stays on the server.
  const projects: Record<string, CompareProject> = {}
  for (const { projectId } of data.screenings) {
    const p = PROJECT_DETAILS[projectId]
    if (!p) continue
    projects[projectId] = {
      id: p.id,
      name: p.name,
      documents: p.documents.map((d) => ({
        id: d.id,
        name: d.name,
        size: d.size,
        uploadedAt: d.uploadedAt,
        status: d.status,
        description: d.description,
        url: `/mock-docs/${p.id}-${d.id}.pdf`,
      })),
    }
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getClaims()
  const currentUser =
    (auth?.claims.user_metadata?.full_name as string | undefined) ?? auth?.claims.email ?? "You"

  return (
    <ComparisonGrid
      key={data.id}
      templates={templates.map(({ id, name }) => ({ id, name }))}
      data={data}
      projects={projects}
      currentUser={currentUser}
      initialReviews={SEED_REVIEWS}
      initialAssessments={SEED_ASSESSMENTS}
    />
  )
}
