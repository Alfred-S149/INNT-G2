"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  IconPlus,
  IconChevronLeft,
  IconDots,
  IconPencil,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconTable,
} from "@tabler/icons-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { CreateCategorySheet, CreateFieldSheet } from "@/features/templates"
import type { CategoryFormData } from "@/features/templates"

interface Field {
  id: string
  name: string
  weight: number
  required: boolean
  dealbreaker: boolean
  extractionPrompt: string
  gapInstruction: string
}

interface Category {
  id: string
  name: string
  weight: number
  description: string
  fields: Field[]
}

const INITIAL_TEMPLATE = {
  id: "1",
  name: "Miljø Screener",
  categories: [
    {
      id: "cat-1", name: "Forurening & jordbund", weight: 0.85, description: "",
      fields: [
        { id: "f-1", name: "Forureningsstatus (jord/areal)", weight: 0.8, required: true, dealbreaker: true, extractionPrompt: "Find oplysninger om forureningskortlægning, miljøhistorik, prøvetagning og samlet forureningsvurdering for projektområdet.", gapInstruction: "Mangler forureningsstatus/afklaring af jord- eller arealforurening." },
        { id: "f-2", name: "Jordbundsforhold & funderings-/OSBL-hensyn", weight: 0.55, required: true, dealbreaker: false, extractionPrompt: "Find oplysninger om jordbundsundersøgelser, funderingsforhold og eventuelle OSBL-hensyn.", gapInstruction: "Mangler jordbundsrapport eller funderings-dokumentation." },
        { id: "f-3", name: "Oprensning & afværgeforanstaltninger (omfang)", weight: 0.6, required: true, dealbreaker: true, extractionPrompt: "Find oplysninger om omfang og type af oprensning samt afværgeforanstaltninger.", gapInstruction: "Mangler information om oprensningsbehov eller afværgestrategi." },
        { id: "f-4", name: "Omkostninger til miljø/oprensning", weight: 0.45, required: false, dealbreaker: false, extractionPrompt: "Find estimater for omkostninger til miljøoprensning.", gapInstruction: "" },
        { id: "f-5", name: "Prøvetagning & datagrundlag (omfang/antal)", weight: 0.3, required: false, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
      ],
    },
    {
      id: "cat-2", name: "Støj & vibrationer", weight: 0.75, description: "",
      fields: [
        { id: "f-6", name: "Støj (jernbane) – vurdering & grænser", weight: 0.75, required: true, dealbreaker: true, extractionPrompt: "Find støjkortlægning/grænseværdier for jernbane, afstande samt evt. krav til afhjælpning/afskærmning.", gapInstruction: "Mangler dokumentation for jernbanestøj (grænseværdier eller afhjælpning)." },
        { id: "f-7", name: "Støj (vej) – vurdering & grænser", weight: 0.7, required: true, dealbreaker: true, extractionPrompt: "Find vejstøjkortlægning, grænseværdier og eventuelle støjdæmpende foranstaltninger.", gapInstruction: "Mangler vejstøj-dokumentation." },
        { id: "f-8", name: "Vibrationer – målinger/grænser/mindsteafstand", weight: 0.45, required: false, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
        { id: "f-9", name: "Afhjælpning: støjskærme/bygningsmæssige tiltag", weight: 0.4, required: false, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
      ],
    },
    {
      id: "cat-3", name: "Klimatilpasning & regnvand", weight: 0.7, description: "",
      fields: [
        { id: "f-10", name: "Oversvømmelsesrisiko", weight: 0.7, required: true, dealbreaker: true, extractionPrompt: "", gapInstruction: "" },
        { id: "f-11", name: "Regnvandshåndtering", weight: 0.6, required: true, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
        { id: "f-12", name: "Klimatilpasningsplan", weight: 0.5, required: false, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
        { id: "f-13", name: "Blå-grønne løsninger", weight: 0.4, required: false, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
      ],
    },
    {
      id: "cat-4", name: "Bæredygtighed & materialer", weight: 0.65, description: "",
      fields: [
        { id: "f-14", name: "Miljøcertificering (DGNB/BREEAM)", weight: 0.6, required: true, dealbreaker: true, extractionPrompt: "", gapInstruction: "" },
        { id: "f-15", name: "CO2-aftryk & livscyklusvurdering", weight: 0.55, required: false, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
        { id: "f-16", name: "Genanvendelse af materialer", weight: 0.45, required: false, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
        { id: "f-17", name: "Farlige materialer (PCB, asbest)", weight: 0.5, required: true, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
      ],
    },
    {
      id: "cat-5", name: "Natur & biodiversitet", weight: 0.45, description: "",
      fields: [
        { id: "f-18", name: "Beskyttede naturtyper", weight: 0.45, required: false, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
        { id: "f-19", name: "Arter & habitater", weight: 0.35, required: false, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
        { id: "f-20", name: "Grønne korridorer & spredningsveje", weight: 0.3, required: false, dealbreaker: false, extractionPrompt: "", gapInstruction: "" },
      ],
    },
  ] as Category[],
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
      {children}
    </span>
  )
}

interface FieldDetailsPanelProps {
  field: Field
  onDirtyChange: (dirty: boolean) => void
  onCancel: () => void
  onSave: (updated: Field) => void
}

function FieldDetailsPanel({ field, onDirtyChange, onCancel, onSave }: FieldDetailsPanelProps) {
  const [name, setName] = useState(field.name)
  const [weight, setWeight] = useState(Math.round(field.weight * 100))
  const [extractionPrompt, setExtractionPrompt] = useState(field.extractionPrompt)
  const [gapInstruction, setGapInstruction] = useState(field.gapInstruction)
  const [required, setRequired] = useState(field.required)
  const [dealbreaker, setDealbreaker] = useState(field.dealbreaker)

  const isDirty =
    name !== field.name ||
    weight !== Math.round(field.weight * 100) ||
    extractionPrompt !== field.extractionPrompt ||
    gapInstruction !== field.gapInstruction ||
    required !== field.required ||
    dealbreaker !== field.dealbreaker

  useEffect(() => {
    onDirtyChange(isDirty)
  }, [isDirty])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel()
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [name, weight, extractionPrompt, gapInstruction, required, dealbreaker])

  function handleDealbreaker(v: boolean) {
    setDealbreaker(v)
    if (v) setRequired(true)
  }

  function handleReset() {
    setName(field.name)
    setWeight(Math.round(field.weight * 100))
    setExtractionPrompt(field.extractionPrompt)
    setGapInstruction(field.gapInstruction)
    setRequired(field.required)
    setDealbreaker(field.dealbreaker)
  }

  function handleSave() {
    onSave({ ...field, name, weight: weight / 100, extractionPrompt, gapInstruction, required, dealbreaker })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex flex-col gap-6 px-6 py-6 overflow-y-auto flex-1">

        <div className="flex flex-col gap-4">
          <SectionLabel>Basic info</SectionLabel>
          <div className="flex flex-col gap-2">
            <label htmlFor="detail-name" className="text-sm font-medium text-foreground">Field name</label>
            <Input id="detail-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Weight</label>
              <span className="text-sm text-muted-foreground tabular-nums">{weight}%</span>
            </div>
            <Slider
              value={[weight]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => setWeight(typeof v === "number" ? v : v[0])}
            />
            <p className="text-xs text-muted-foreground">Higher weight = stronger influence on the final risk score</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-border">
          <SectionLabel>Extraction guidance</SectionLabel>
          <div className="flex flex-col gap-2">
            <label htmlFor="detail-extraction" className="text-sm">
              <span className="font-medium text-foreground">Extraction prompt</span>
              <span className="text-muted-foreground"> — what information should be extracted</span>
            </label>
            <textarea
              id="detail-extraction"
              value={extractionPrompt}
              onChange={(e) => setExtractionPrompt(e.target.value)}
              rows={4}
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="detail-gap" className="text-sm">
              <span className="font-medium text-primary">Gap instruction</span>
              <span className="text-muted-foreground"> — what constitutes missing info?</span>
            </label>
            <textarea
              id="detail-gap"
              value={gapInstruction}
              onChange={(e) => setGapInstruction(e.target.value)}
              rows={3}
              className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-border">
          <SectionLabel>Flags</SectionLabel>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Required</span>
              <span className="text-xs text-muted-foreground">Must be scored for screening to complete</span>
            </div>
            <Switch
              checked={required}
              onCheckedChange={(v: boolean) => setRequired(v)}
              disabled={dealbreaker}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Dealbreaker</span>
              <span className="text-xs text-muted-foreground">Automatically marks field as required</span>
            </div>
            <Switch checked={dealbreaker} onCheckedChange={handleDealbreaker} />
          </div>
        </div>

      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
        {isDirty ? (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!isDirty}>Cancel</Button>
          <Button onClick={handleSave} disabled={!isDirty || !name.trim()}>Save</Button>
        </div>
      </div>
    </div>
  )
}

export default function TemplateDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [template, setTemplate] = useState(INITIAL_TEMPLATE)
  const [editingName, setEditingName] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [pendingNav, setPendingNav] = useState<{ categoryId: string; fieldId?: string } | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ type: "category" | "field"; id: string; name: string } | null>(null)
  const [categorySheetOpen, setCategorySheetOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryFormData | undefined>(undefined)
  const [createFieldOpen, setCreateFieldOpen] = useState(false)

  const selectedCategoryId = searchParams.get("category") ?? template.categories[0]?.id
  const selectedFieldId = searchParams.get("field") ?? null
  const selectedCategory = template.categories.find((c) => c.id === selectedCategoryId) ?? template.categories[0]
  const selectedField = selectedCategory?.fields.find((f) => f.id === selectedFieldId) ?? null

  function doNavigate(categoryId: string, fieldId?: string) {
    setIsDirty(false)
    const params = new URLSearchParams()
    params.set("category", categoryId)
    if (fieldId) params.set("field", fieldId)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  function tryNavigate(categoryId: string, fieldId?: string) {
    if (isDirty && selectedFieldId) {
      setPendingNav({ categoryId, fieldId })
      return
    }
    doNavigate(categoryId, fieldId)
  }

  function moveCategory(id: string, dir: "up" | "down") {
    setTemplate((prev) => {
      const cats = [...prev.categories]
      const idx = cats.findIndex((c) => c.id === id)
      const newIdx = dir === "up" ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= cats.length) return prev
      ;[cats[idx], cats[newIdx]] = [cats[newIdx], cats[idx]]
      return { ...prev, categories: cats }
    })
  }

  function moveField(catId: string, fieldId: string, dir: "up" | "down") {
    setTemplate((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) => {
        if (cat.id !== catId) return cat
        const fields = [...cat.fields]
        const idx = fields.findIndex((f) => f.id === fieldId)
        const newIdx = dir === "up" ? idx - 1 : idx + 1
        if (newIdx < 0 || newIdx >= fields.length) return cat
        ;[fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]]
        return { ...cat, fields }
      }),
    }))
  }

  function confirmDelete() {
    if (!deleteDialog) return
    if (deleteDialog.type === "category") {
      const remaining = template.categories.filter((c) => c.id !== deleteDialog.id)
      setTemplate((prev) => ({ ...prev, categories: remaining }))
      if (selectedCategory?.id === deleteDialog.id) {
        const target = remaining[0]
        router.push(target ? `?category=${target.id}` : "?", { scroll: false })
      }
    } else {
      const isSelected = selectedFieldId === deleteDialog.id
      setTemplate((prev) => ({
        ...prev,
        categories: prev.categories.map((cat) => ({
          ...cat,
          fields: cat.fields.filter((f) => f.id !== deleteDialog.id),
        })),
      }))
      if (isSelected) {
        router.push(`?category=${selectedCategoryId}`, { scroll: false })
        setIsDirty(false)
      }
    }
    setDeleteDialog(null)
  }

  function handleCategorySave(data: CategoryFormData) {
    if (data.id) {
      setTemplate((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === data.id ? { ...c, name: data.name, weight: data.weight / 100, description: data.description } : c
        ),
      }))
    } else {
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: data.name,
        weight: data.weight / 100,
        description: data.description,
        fields: [],
      }
      setTemplate((prev) => ({ ...prev, categories: [...prev.categories, newCat] }))
      router.push(`?category=${newCat.id}`, { scroll: false })
    }
  }

  function handleFieldSave(updated: Field) {
    setTemplate((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) => ({
        ...cat,
        fields: cat.fields.map((f) => (f.id === updated.id ? updated : f)),
      })),
    }))
    setIsDirty(false)
  }

  function openCreateCategory() {
    setEditingCategory(undefined)
    setCategorySheetOpen(true)
  }

  function openEditCategory(cat: Category) {
    setEditingCategory({ id: cat.id, name: cat.name, weight: Math.round(cat.weight * 100), description: cat.description })
    setCategorySheetOpen(true)
  }

  const dbCount = (cat: Category) => cat.fields.filter((f) => f.dealbreaker).length

  const catRefs = useRef<(HTMLButtonElement | null)[]>([])
  const fieldRefs = useRef<(HTMLButtonElement | null)[]>([])

  function handleCatKeyDown(e: React.KeyboardEvent, idx: number) {
    const len = template.categories.length
    if (e.key === "ArrowDown") {
      e.preventDefault()
      const next = (idx + 1) % len
      catRefs.current[next]?.focus()
      tryNavigate(template.categories[next].id)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prev = (idx - 1 + len) % len
      catRefs.current[prev]?.focus()
      tryNavigate(template.categories[prev].id)
    }
  }

  function handleFieldKeyDown(e: React.KeyboardEvent, idx: number) {
    const fields = selectedCategory?.fields ?? []
    if (e.key === "ArrowDown") {
      e.preventDefault()
      const next = (idx + 1) % fields.length
      fieldRefs.current[next]?.focus()
      tryNavigate(selectedCategoryId!, fields[next].id)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const prev = (idx - 1 + fields.length) % fields.length
      fieldRefs.current[prev]?.focus()
      tryNavigate(selectedCategoryId!, fields[prev].id)
    }
  }

  return (
    <div className="flex flex-col flex-1 p-8 gap-5 overflow-hidden h-full">

      {/* Page header */}
      <div className="flex flex-col gap-1 shrink-0">
        <div className="flex items-center justify-between">
          <Link
            href="/templates"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <IconChevronLeft className="size-3.5" />
            Back
          </Link>
          <Link
            href={`/compare?template=${template.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconTable className="size-3.5" />
            Screenings
          </Link>
        </div>
        {editingName ? (
          <input
            value={template.name}
            onChange={(e) => setTemplate((p) => ({ ...p, name: e.target.value }))}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false) }}
            className="text-2xl font-semibold bg-transparent outline-none border-b border-primary w-full max-w-sm"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            title="Click to rename"
            className="text-2xl font-semibold text-foreground hover:text-foreground/70 transition-colors text-left w-fit"
          >
            {template.name}
          </button>
        )}
      </div>

      {/* Three-column editor */}
      <div className="flex flex-1 min-h-0 rounded-xl border border-border overflow-hidden">

        {/* Column 1 — Categories */}
        <div className="w-[270px] shrink-0 flex flex-col border-r border-border bg-muted/40">
          <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0 bg-muted/40">
            <SectionLabel>Categories</SectionLabel>
            <Button variant="ghost" size="icon-sm" aria-label="Add category" onClick={openCreateCategory}>
              <IconPlus className="size-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 p-2">
            {template.categories.map((cat, idx) => {
              const isSelected = cat.id === selectedCategory?.id
              const db = dbCount(cat)
              return (
                <div key={cat.id} className="group/cat relative">
                  <button
                    ref={(el) => { catRefs.current[idx] = el }}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => tryNavigate(cat.id)}
                    onKeyDown={(e) => handleCatKeyDown(e, idx)}
                    className={cn(
                      "flex flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors w-full pr-8",
                      isSelected ? "bg-muted border border-border" : "hover:bg-muted/50"
                    )}
                  >
                    <span className={cn("text-sm font-medium truncate", isSelected ? "text-foreground" : "text-foreground/80")}>
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-primary tabular-nums">{cat.weight}</span>
                      <span className="text-xs text-muted-foreground">{cat.fields.length} fields</span>
                      {db > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="size-1.5 rounded-[3px] bg-indicator-db shrink-0" />
                          {db} DB
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" aria-label="Category actions" className="hover:bg-foreground/8 dark:hover:bg-foreground/10" />}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <IconDots className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditCategory(cat)}>
                          <IconPencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={idx === 0}
                          onClick={() => moveCategory(cat.id, "up")}
                        >
                          <IconChevronUp className="size-4" />
                          Move up
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={idx === template.categories.length - 1}
                          onClick={() => moveCategory(cat.id, "down")}
                        >
                          <IconChevronDown className="size-4" />
                          Move down
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteDialog({ type: "category", id: cat.id, name: cat.name })}
                        >
                          <IconTrash className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Column 2 — Fields */}
        <div className="w-[370px] shrink-0 flex flex-col border-r border-border">
          <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-foreground truncate">{selectedCategory?.name}</span>
              {selectedCategory && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {selectedCategory.fields.length} fields
                </span>
              )}
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Add field" onClick={() => setCreateFieldOpen(true)}>
              <IconPlus className="size-4 shrink-0" />
            </Button>
          </div>

          {selectedCategory?.fields.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-6">
              <p className="text-sm font-medium text-foreground">No fields yet</p>
              <p className="text-sm text-muted-foreground">Add the first field to this category</p>
              <Button size="sm" onClick={() => setCreateFieldOpen(true)}>
                <IconPlus className="size-4" />
                Add field
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5 overflow-y-auto flex-1 p-2">
              {selectedCategory?.fields.map((field, idx) => {
                const isSelected = field.id === selectedField?.id
                const isThisDirty = isDirty && isSelected
                return (
                  <div key={field.id} className="group/field relative">
                    <button
                      ref={(el) => { fieldRefs.current[idx] = el }}
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => tryNavigate(selectedCategoryId!, field.id)}
                      onKeyDown={(e) => handleFieldKeyDown(e, idx)}
                      className={cn(
                        "flex items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition-colors w-full pr-8",
                        isSelected ? "bg-muted border border-border" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("text-sm font-medium truncate", isSelected ? "text-foreground" : "text-foreground/80")}>
                            {field.name}
                          </span>
                          {isThisDirty && (
                            <span className="size-1.5 rounded-full bg-primary shrink-0" title="Unsaved changes" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-medium text-primary tabular-nums">{field.weight}</span>
                          {field.required && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded h-4 font-medium">required</Badge>
                          )}
                          {field.dealbreaker && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded h-4 font-medium">dealbreaker</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 pt-0.5 shrink-0">
                        {field.dealbreaker && <span className="size-2 rounded-[3px] bg-indicator-db shrink-0" />}
                        {field.gapInstruction && <span className="size-2 rounded-[3px] bg-indicator-gap shrink-0" />}
                      </div>
                    </button>
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/field:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={<Button variant="ghost" size="icon-sm" aria-label="Field actions" className="hover:bg-foreground/8 dark:hover:bg-foreground/10" />}
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <IconDots className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => tryNavigate(selectedCategoryId!, field.id)}>
                            <IconPencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={idx === 0}
                            onClick={() => moveField(selectedCategoryId!, field.id, "up")}
                          >
                            <IconChevronUp className="size-4" />
                            Move up
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={idx === (selectedCategory?.fields.length ?? 0) - 1}
                            onClick={() => moveField(selectedCategoryId!, field.id, "down")}
                          >
                            <IconChevronDown className="size-4" />
                            Move down
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteDialog({ type: "field", id: field.id, name: field.name })}
                          >
                            <IconTrash className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Column 3 — Field details */}
        <div className="flex flex-col flex-1 min-w-0 bg-muted/40">
          <div className="flex items-center px-6 h-11 border-b border-border shrink-0 bg-muted/40">
            <SectionLabel>Field details</SectionLabel>
          </div>
          {selectedField ? (
            <FieldDetailsPanel
              key={selectedField.id}
              field={selectedField}
              onDirtyChange={setIsDirty}
              onCancel={() => tryNavigate(selectedCategoryId!)}
              onSave={handleFieldSave}
            />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center px-8">
              <p className="text-sm font-medium text-foreground">No field selected</p>
              <p className="text-sm text-muted-foreground">Select a field to view and edit its details</p>
            </div>
          )}
        </div>

      </div>

      {/* Discard changes dialog */}
      <AlertDialog open={!!pendingNav} onOpenChange={(open) => { if (!open) setPendingNav(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to this field. They will be lost if you navigate away.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingNav) doNavigate(pendingNav.categoryId, pendingNav.fieldId)
                setPendingNav(null)
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => { if (!open) setDeleteDialog(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialog?.type === "category" ? "category" : "field"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog?.type === "category"
                ? `"${deleteDialog?.name}" and all its fields will be permanently deleted.`
                : `"${deleteDialog?.name}" will be permanently deleted.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateCategorySheet
        open={categorySheetOpen}
        onOpenChange={setCategorySheetOpen}
        initialData={editingCategory}
        onSave={handleCategorySave}
      />

      <CreateFieldSheet
        open={createFieldOpen}
        onOpenChange={setCreateFieldOpen}
        categories={template.categories}
        defaultCategoryId={selectedCategory?.id}
      />
    </div>
  )
}
