"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconPencil,
  IconCopy,
  IconTrash,
  IconTemplate,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CountCell } from "@/components/ui/count-cell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CreateTemplateSheet } from "@/features/templates"

interface Template {
  id: string
  name: string
  description: string
  categories: number
  fields: number
  required: number
  db: number
  gapFields: number
}

const templates: Template[] = [
  {
    id: "1",
    name: "Miljø Screener",
    description: "Skemasæt for miljø detaljer for jordbunds og grundvands forurening",
    categories: 12,
    fields: 48,
    required: 31,
    db: 27,
    gapFields: 4,
  },
  {
    id: "2",
    name: "NCC Standard",
    description: "Komplet pre-screening til alle bolig- og erhvervsprojekter",
    categories: 8,
    fields: 64,
    required: 52,
    db: 41,
    gapFields: 11,
  },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(
    () =>
      templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, filtered.length)

  function handleSearch(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handlePageSize(value: string | null) {
    if (!value) return
    setPageSize(Number(value))
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-col flex-1 p-8 gap-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-2xl font-semibold text-foreground">Templates</h1>
          <span className="text-sm text-muted-foreground">
            {templates.length} templates
          </span>
        </div>
        <Button onClick={() => setSheetOpen(true)}>
          <IconPlus className="size-4" />
          Add template
        </Button>
      </div>

      <Card className="py-0 gap-0">

        {/* Search — plain input to avoid component styling conflicts */}
        <div className="flex items-center gap-2 px-3 border-b border-border">
          <IconSearch className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-10 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[380px]">Template</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead className="border-l border-border">Required</TableHead>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger
                    render={<span />}
                    className="cursor-help"
                  >
                    DB
                  </TooltipTrigger>
                  <TooltipContent>Dealbreaker criteria — scored -2 and flagged as a dealbreaker</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger
                    render={<span />}
                    className="cursor-help"
                  >
                    Gap fields
                  </TooltipTrigger>
                  <TooltipContent>Information gaps — criteria where the source material lacks sufficient content for extraction</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginated.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-64">
                  <div className="flex flex-col items-center justify-center gap-3 h-full text-center">
                    <IconTemplate className="size-9 text-muted-foreground/30" />
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">
                        {search ? "No templates match your search" : "No templates yet"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {search
                          ? "Try a different search term"
                          : "Create your first template to get started"}
                      </p>
                    </div>
                    {!search && (
                      <Button size="sm" onClick={() => setSheetOpen(true)}>
                        <IconPlus className="size-4" />
                        Add template
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((template) => (
                <TableRow
                  key={template.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/templates/${template.id}`)}
                >
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{template.name}</span>
                      <span className="text-xs text-muted-foreground">{template.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CountCell count={template.categories} dot="bg-muted-foreground/60" />
                  </TableCell>
                  <TableCell>
                    <CountCell count={template.fields} dot="bg-muted-foreground/60" />
                  </TableCell>
                  <TableCell className="border-l border-border">
                    <CountCell count={template.required} dot="bg-primary" />
                  </TableCell>
                  <TableCell>
                    <CountCell count={template.db} dot="bg-indicator-db" />
                  </TableCell>
                  <TableCell>
                    <CountCell count={template.gapFields} dot="bg-indicator-gap" />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" aria-label="Template actions" />
                        }
                      >
                        <IconDots className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <IconPencil className="size-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <IconCopy className="size-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <IconTrash className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={handlePageSize}>
              <SelectTrigger size="sm" className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 25].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums">
              {filtered.length === 0 ? "0" : `${rangeStart}–${rangeEnd}`} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next page"
              >
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

      </Card>

      <CreateTemplateSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
