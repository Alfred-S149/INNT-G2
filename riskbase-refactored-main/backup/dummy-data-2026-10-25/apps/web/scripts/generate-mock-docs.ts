// Generates sample PDFs for the mock project documents in public/mock-docs/, so the
// evidence viewer has real files to open. Every source the mock screenings cite is
// written onto exactly the page it references.
//
//   bun scripts/generate-mock-docs.ts
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { PDFDocument, StandardFonts, type PDFFont, type PDFPage } from "pdf-lib"
import { PROJECT_DETAILS } from "../src/features/projects/data"
import { TEMPLATE_SCREENINGS } from "../src/features/screenings/data"

const OUT = fileURLToPath(new URL("../public/mock-docs", import.meta.url))
const PAGES = 4
const [W, H] = [595, 842]
const MARGIN = 56
const SIZE = 10.5
const LEADING = 15

const FILLER = [
  "Afsnittet bygger på det modtagne materiale samt supplerende registeroplysninger. Vurderingerne er foreløbige og forudsætter, at de anførte forhold bekræftes ved den videre projektering.",
  "Der er ikke foretaget selvstændige målinger ud over det, der fremgår af bilagene. Usikkerheder og forudsætninger er beskrevet i de enkelte delafsnit.",
  "Resultaterne skal læses i sammenhæng med lokalplanens bestemmelser og kommunens gældende retningslinjer for området.",
]

type Citation = { heading: string; text: string }

// documentName → page → citations
const citations = new Map<string, Map<number, Citation[]>>()
for (const template of Object.values(TEMPLATE_SCREENINGS)) {
  const fieldName = Object.fromEntries(template.categories.flatMap((c) => c.fields.map((f) => [f.id, f.name])))
  for (const screening of template.screenings) {
    for (const [fieldId, result] of Object.entries(screening.results)) {
      for (const source of result.sources ?? []) {
        const byPage = citations.get(source.documentName) ?? new Map<number, Citation[]>()
        const list = byPage.get(source.page) ?? []
        list.push({ heading: fieldName[fieldId]!.replace(/­/g, ""), text: result.extractedContent })
        byPage.set(source.page, list)
        citations.set(source.documentName, byPage)
      }
    }
  }
}

function writer(page: PDFPage, font: PDFFont, bold: PDFFont) {
  let y = H - MARGIN
  const safe = (text: string, f: PDFFont) =>
    [...text]
      .map((ch) => {
        try {
          f.encodeText(ch)
          return ch
        } catch {
          return "?"
        }
      })
      .join("")

  function line(text: string, f: PDFFont, size: number) {
    if (y < MARGIN) return false
    page.drawText(safe(text, f), { x: MARGIN, y, size, font: f })
    y -= size * (LEADING / SIZE)
    return true
  }

  function paragraph(text: string, f: PDFFont = font, size = SIZE) {
    const max = W - MARGIN * 2
    let current = ""
    for (const word of text.split(/\s+/)) {
      const next = current ? `${current} ${word}` : word
      if (f.widthOfTextAtSize(safe(next, f), size) > max && current) {
        if (!line(current, f, size)) return
        current = word
      } else {
        current = next
      }
    }
    if (current) line(current, f, size)
    y -= LEADING * 0.6
  }

  return { paragraph, heading: (text: string, size = 12) => paragraph(text, bold, size) }
}

async function build(projectName: string, doc: { name: string; description?: string; markdown?: string }) {
  const pdf = await PDFDocument.create()
  pdf.setTitle(doc.name.replace(/\.pdf$/, ""))
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  for (let n = 1; n <= PAGES; n++) {
    const page = pdf.addPage([W, H])
    const w = writer(page, font, bold)
    page.drawText(`${projectName} · ${doc.name}`, { x: MARGIN, y: 28, size: 8, font })
    page.drawText(`Side ${n} af ${PAGES}`, { x: W - MARGIN - 50, y: 28, size: 8, font })

    if (n === 1) {
      w.heading(doc.name.replace(/\.pdf$/, "").replace(/_/g, " "), 18)
      w.paragraph(projectName)
      if (doc.description) w.paragraph(doc.description)
      for (const raw of (doc.markdown ?? "").split("\n")) {
        const text = raw.trim()
        if (!text || text.startsWith("# ")) continue
        if (text.startsWith("## ")) w.heading(text.slice(3))
        else w.paragraph(text.startsWith("- ") ? `• ${text.slice(2)}` : text)
      }
      continue
    }

    w.heading(`Afsnit ${n - 1}`, 14)
    w.paragraph(FILLER[(n - 2) % FILLER.length]!)
    for (const c of citations.get(doc.name)?.get(n) ?? []) {
      w.heading(c.heading)
      w.paragraph(c.text)
    }
    w.paragraph(FILLER[(n - 1) % FILLER.length]!)
  }
  return pdf.save()
}

mkdirSync(OUT, { recursive: true })
for (const project of Object.values(PROJECT_DETAILS)) {
  for (const doc of project.documents) {
    const file = join(OUT, `${project.id}-${doc.id}.pdf`)
    writeFileSync(file, await build(project.name, doc))
    console.log(file)
  }
}
