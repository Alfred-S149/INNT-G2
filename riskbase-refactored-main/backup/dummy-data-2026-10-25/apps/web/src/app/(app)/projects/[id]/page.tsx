"use client"

import { use, useState, useRef, useEffect, type ComponentType, type DragEvent, type ChangeEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  IconChevronLeft,
  IconUpload,
  IconFileText,
  IconTrash,
  IconMarkdown,
  IconClipboardList,
  IconSparkles,
  IconMessageCircle,
} from "@tabler/icons-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { StatusBadge } from "@/components/ui/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { PROJECT_DETAILS, type ProjectDocument, type ActivityType } from "@/features/projects"
import type { RiskLevel, ScreeningStatus } from "@/features/screenings/types"


const statusDot: Record<ScreeningStatus, string> = {
  Completed: "bg-primary",
  "In progress": "bg-warning",
  Review: "bg-warning",
  Draft: "bg-muted-foreground",
}

const riskDot: Record<RiskLevel, string> = {
  Low: "bg-success",
  Medium: "bg-warning",
  High: "bg-severe",
  Critical: "bg-destructive",
}

const activityIcon: Record<ActivityType, ComponentType<{ className?: string }>> = {
  created: IconSparkles,
  upload: IconUpload,
  parsed: IconMarkdown,
  screening: IconClipboardList,
  comment: IconMessageCircle,
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function mockDescription(fileName: string): string {
  return `AI-genereret resumé af "${fileName}" — dokumentet er parset til Markdown og indekseret til brug i screeninger.`
}

function mockMarkdown(fileName: string): string {
  return `# ${fileName}\n\n*Automatisk parset fra originaldokumentet og gemt i storage-bucket.*\n\nIndholdet er nu tilgængeligt for AI-baseret udtræk i forbindelse med screeninger.`
}

// ─── Document preview ─────────────────────────────────────────────────────────

// Minimal line-based renderer for the mock Markdown — avoids pulling in a
// full Markdown library for what's currently just a handful of headings.
function MarkdownView({ content }: { content: string }) {
  const lines = content.split("\n")
  return (
    <div className="flex flex-col gap-2 text-sm text-foreground leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <h4 key={i} className="font-semibold mt-2">{line.slice(4)}</h4>
        if (line.startsWith("## ")) return <h3 key={i} className="text-base font-semibold mt-3">{line.slice(3)}</h3>
        if (line.startsWith("# ")) return <h2 key={i} className="text-lg font-semibold">{line.slice(2)}</h2>
        if (line.trim() === "") return <div key={i} className="h-1" />
        if (line.startsWith("*") && line.endsWith("*") && line.length > 1) {
          return <p key={i} className="italic text-muted-foreground">{line.slice(1, -1)}</p>
        }
        return <p key={i} className="text-muted-foreground">{line}</p>
      })}
    </div>
  )
}

function PdfPane({ doc }: { doc: ProjectDocument }) {
  if (doc.fileUrl) {
    return (
      <iframe
        src={doc.fileUrl}
        title={`${doc.name} preview`}
        className="w-full h-full rounded-md border border-border"
      />
    )
  }
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full text-center px-6 rounded-md border border-dashed border-border bg-muted/20">
      <IconFileText className="size-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">Original PDF not available</p>
      <p className="text-xs text-muted-foreground">
        This is a seeded demo document — only files uploaded this session can be previewed here.
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const project = PROJECT_DETAILS[id] ?? PROJECT_DETAILS["1"]

  const [documents, setDocuments] = useState(project.documents)
  const [activity, setActivity] = useState(project.activity)
  const [newComment, setNewComment] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null)
  const [editedMarkdown, setEditedMarkdown] = useState("")
  const [previewTab, setPreviewTab] = useState<"preview" | "edit">("preview")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const objectUrlsRef = useRef<string[]>([])

  useEffect(() => {
    const timeouts = timeoutsRef.current
    const objectUrls = objectUrlsRef.current
    return () => {
      timeouts.forEach(clearTimeout)
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const today = documents[0]?.uploadedAt ?? "Today"
    const newDocs: ProjectDocument[] = Array.from(fileList).map((file, i) => {
      // Real file bytes are only available client-side for files picked in
      // this session — the object URL lets the preview render the actual
      // PDF. Seeded/mock documents have no underlying file, so they fall
      // back to a placeholder in the preview.
      const fileUrl = file.type === "application/pdf" ? URL.createObjectURL(file) : undefined
      if (fileUrl) objectUrlsRef.current.push(fileUrl)
      return {
        id: `d-new-${i}-${file.name}`,
        name: file.name,
        size: formatSize(file.size),
        uploadedAt: today,
        status: "processing",
        fileUrl,
      }
    })
    setDocuments((prev) => [...newDocs, ...prev])

    // Backend uploads the file, parses it to Markdown, stores that in the
    // bucket alongside the original, and generates a description — mocked
    // here with a delay since there's no API wired up yet.
    newDocs.forEach((doc) => {
      const timeout = setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? { ...d, status: "ready", description: mockDescription(doc.name), markdown: mockMarkdown(doc.name) }
              : d
          )
        )
      }, 1800)
      timeoutsRef.current.push(timeout)
    })
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    addFiles(e.target.files)
    e.target.value = ""
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function removeDocument(docId: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== docId))
    setPreviewDoc((prev) => (prev?.id === docId ? null : prev))
  }

  function openPreview(doc: ProjectDocument) {
    setPreviewDoc(doc)
    setEditedMarkdown(doc.markdown ?? "")
    setPreviewTab("preview")
  }

  const isMarkdownDirty = !!previewDoc && editedMarkdown !== (previewDoc.markdown ?? "")

  function saveMarkdown() {
    if (!previewDoc) return
    setDocuments((prev) =>
      prev.map((d) => (d.id === previewDoc.id ? { ...d, markdown: editedMarkdown } : d))
    )
    setPreviewDoc((prev) => (prev ? { ...prev, markdown: editedMarkdown } : prev))
  }

  function resetMarkdown() {
    setEditedMarkdown(previewDoc?.markdown ?? "")
  }

  function postComment() {
    const body = newComment.trim()
    if (!body) return
    const now = new Date()
    const timestamp = `${now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, ${now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
    setActivity((prev) => [
      ...prev,
      { id: `a-new-${prev.length}-${now.getTime()}`, type: "comment", actor: "Alfred Steensen", message: "commented", timestamp, body },
    ])
    setNewComment("")
  }

  return (
    <div className="flex flex-col flex-1 p-8 gap-6">

      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/projects"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <IconChevronLeft className="size-3.5" />
          Back
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        <span className="text-sm text-muted-foreground">Created {project.createdAt}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Documents */}
        <Card className="py-0 gap-0 overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <span className="text-sm font-medium text-foreground">Documents</span>
            <span className="text-xs text-muted-foreground">
              {documents.length} file{documents.length !== 1 && "s"}
            </span>
          </div>

          {/* Upload dropzone */}
          <div className="p-5 border-b border-border">
            <label
              htmlFor="document-upload"
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-8 text-center cursor-pointer transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
              )}
            >
              <IconUpload className="size-6 text-muted-foreground" />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">Click to upload or drag and drop</span>
                <span className="text-xs text-muted-foreground">PDF, DOCX up to 25 MB</span>
              </div>
              <input
                ref={fileInputRef}
                id="document-upload"
                type="file"
                multiple
                className="sr-only"
                onChange={handleFileInput}
              />
            </label>
          </div>

          {/* Document list */}
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
              <p className="text-sm font-medium text-foreground">No documents yet</p>
              <p className="text-sm text-muted-foreground">Upload the first document to get started</p>
            </div>
          ) : (
            <ul>
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-start justify-between gap-4 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <IconFileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex flex-col min-w-0 gap-0.5">
                      <span className="text-sm font-medium text-foreground truncate">{doc.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {doc.size} · Uploaded {doc.uploadedAt}
                      </span>
                      {doc.status === "processing" ? (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Spinner className="size-3" />
                          Parsing to Markdown and generating description…
                        </span>
                      ) : (
                        doc.description && (
                          <p className="text-xs text-muted-foreground leading-snug mt-1 line-clamp-2">
                            {doc.description}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.status === "ready" && doc.markdown && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`View and edit Markdown for ${doc.name}`}
                        onClick={() => openPreview(doc)}
                      >
                        <IconMarkdown className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${doc.name}`}
                      onClick={() => removeDocument(doc.id)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Screenings for this project */}
        <Card className="py-0 gap-0 overflow-hidden lg:col-span-1">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <span className="text-sm font-medium text-foreground">Screenings</span>
            <span className="text-xs text-muted-foreground">{project.screenings.length}</span>
          </div>
          {project.screenings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 px-6 py-10 text-center">
              <p className="text-sm text-muted-foreground">No screenings yet</p>
            </div>
          ) : (
            <ul>
              {project.screenings.map((screening) => (
                <li key={screening.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/screenings/${screening.id}`)}
                    className="flex flex-col gap-2 w-full px-5 py-3 border-b border-border last:border-0 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{screening.template}</span>
                      <span className="text-sm font-semibold tabular-nums text-foreground shrink-0">
                        {(screening.score / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="gap-1.5 rounded-md text-xs py-0">
                        <span className={cn("size-1.5 rounded-[3px] shrink-0", statusDot[screening.status])} />
                        {screening.status}
                      </Badge>
                      <Badge variant="secondary" className="gap-1.5 rounded-md text-xs py-0">
                        <span className={cn("size-1.5 rounded-[3px] shrink-0", riskDot[screening.risk])} />
                        {screening.risk}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{screening.screenedAt}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

      </div>

      {/* Activity feed */}
      <Card className="py-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">Activity</span>
          <span className="text-xs text-muted-foreground">
            {activity.length} update{activity.length !== 1 && "s"}
          </span>
        </div>

        {/* Comment composer */}
        <div className="flex gap-3 px-5 py-4 border-b border-border">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="text-xs">AS</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write an update or comment…"
              rows={2}
              className="min-h-16 resize-none"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={postComment} disabled={!newComment.trim()}>
                Post
              </Button>
            </div>
          </div>
        </div>

        {/* Feed — newest first */}
        <ul className="flex flex-col px-5 pb-1">
          {[...activity].reverse().map((item, idx, feed) => {
            const Icon = activityIcon[item.type]
            const isLast = idx === feed.length - 1
            return (
              <li key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center pt-3">
                  <span className="flex items-center justify-center size-6 rounded-full bg-muted text-muted-foreground shrink-0">
                    <Icon className="size-3.5" />
                  </span>
                  {!isLast && <span className="w-px flex-1 bg-border" />}
                </div>
                <div className={cn("flex-1 min-w-0 pt-3", isLast ? "pb-3" : "pb-5")}>
                  <p className="text-sm">
                    <span className="font-medium text-foreground">{item.actor}</span>{" "}
                    <span className="text-muted-foreground">{item.message}</span>
                  </p>
                  {item.body && (
                    <div className="mt-2 rounded-lg bg-muted/40 p-3 text-sm text-foreground whitespace-pre-wrap">
                      {item.body}
                    </div>
                  )}
                  <span className="mt-1 block text-xs text-muted-foreground">{item.timestamp}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Document preview: original PDF next to the parsed Markdown */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) setPreviewDoc(null) }}>
        <DialogContent className="flex flex-col w-[95vw] max-w-6xl h-[85vh] p-0 gap-0 sm:max-w-6xl">
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle className="truncate">{previewDoc?.name}</DialogTitle>
            <DialogDescription>Original file next to the parsed Markdown stored in the bucket</DialogDescription>
          </DialogHeader>
          {previewDoc && (
            <div className="grid flex-1 min-h-0 grid-cols-1 divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
              <div className="flex flex-col min-h-0 p-4">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 shrink-0">
                  Original PDF
                </span>
                <div className="flex-1 min-h-0">
                  <PdfPane doc={previewDoc} />
                </div>
              </div>
              <div className="flex flex-col min-h-0 p-4">
                <Tabs
                  value={previewTab}
                  onValueChange={(v) => setPreviewTab(v as "preview" | "edit")}
                  className="flex flex-1 min-h-0 flex-col gap-2"
                >
                  <div className="flex items-center justify-between shrink-0">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Parsed Markdown
                    </span>
                    <TabsList variant="line">
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="edit">Edit</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="preview" className="min-h-0 overflow-y-auto pr-1">
                    <MarkdownView content={editedMarkdown} />
                  </TabsContent>

                  <TabsContent value="edit" className="flex min-h-0 flex-col">
                    <Textarea
                      value={editedMarkdown}
                      onChange={(e) => setEditedMarkdown(e.target.value)}
                      spellCheck={false}
                      className="h-full field-sizing-fixed resize-none font-mono text-xs leading-relaxed"
                    />
                  </TabsContent>

                  <div className="flex items-center justify-between border-t border-border pt-2 shrink-0">
                    {isMarkdownDirty ? (
                      <span className="text-xs text-muted-foreground">Unsaved changes</span>
                    ) : <span />}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={resetMarkdown} disabled={!isMarkdownDirty}>
                        Reset
                      </Button>
                      <Button size="sm" onClick={saveMarkdown} disabled={!isMarkdownDirty}>
                        Save
                      </Button>
                    </div>
                  </div>
                </Tabs>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
