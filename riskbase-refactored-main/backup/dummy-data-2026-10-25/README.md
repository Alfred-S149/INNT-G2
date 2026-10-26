# Dummy data backup — 25 Oct 2026

Snapshot of the Next.js app's mock data and the UI that rendered it, taken before
the app was wired to the real Supabase data. Paths mirror `apps/web/`.

| What | Where |
| --- | --- |
| Projects, documents, activity | `apps/web/src/features/projects/data.ts` |
| Template "Miljø Screener", screening results, sources, seeded reviews and assessments | `apps/web/src/features/screenings/data.ts` |
| Inline mock data in pages (overview, projects, screenings, templates) | `apps/web/src/app/(app)/**/page.tsx` |
| Template list used by "Run screening" | `apps/web/src/features/screenings/components/run-screening-sheet.tsx` |
| Sample PDFs with cited passages on the referenced pages | `apps/web/public/mock-docs/` |
| PDF generator | `apps/web/scripts/generate-mock-docs.ts` (`bun scripts/generate-mock-docs.ts` from `apps/web`) |

This folder is outside the app's TypeScript and ESLint scope, so it is never built.
Restore a file by copying it back to the same path under `apps/web/`.
