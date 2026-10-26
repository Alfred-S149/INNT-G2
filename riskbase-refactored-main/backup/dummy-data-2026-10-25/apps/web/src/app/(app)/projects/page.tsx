"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AddProjectSheet } from "@/features/projects"

type Status = "Active" | "Review"

interface Project {
  id: string
  name: string
  status: Status
  documents: number
  lastScreenedAt: string
  createdAt: string
}

const projects: Project[] = [
  {
    id: "1",
    name: "Strommen 3A",
    status: "Review",
    documents: 3,
    lastScreenedAt: "2 Jun 2026, 09:45",
    createdAt: "25 Apr 2026, 16:56",
  },
  {
    id: "2",
    name: "Gartnerbyen – Rødovre",
    status: "Active",
    documents: 5,
    lastScreenedAt: "28 Jan 2025, 10:00",
    createdAt: "15 Jan 2025, 10:00",
  },
  {
    id: "3",
    name: "Christiansvej – Glostrup",
    status: "Active",
    documents: 3,
    lastScreenedAt: "15 Feb 2025, 11:00",
    createdAt: "3 Feb 2025, 11:30",
  },
  {
    id: "4",
    name: "Kærmindevej – Glostrup",
    status: "Review",
    documents: 4,
    lastScreenedAt: "25 Feb 2025, 10:00",
    createdAt: "10 Mar 2025, 09:15",
  },
]

export default function ProjectsPage() {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="flex flex-col flex-1 p-8 gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <IconPlus className="size-4" />
          Add project
        </Button>
      </div>

      <Card className="py-0 gap-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Last screened at</TableHead>
              <TableHead>Created at</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow
                key={project.id}
                className="cursor-pointer"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <StatusBadge status={project.status} />
                </TableCell>
                <TableCell>{project.documents}</TableCell>
                <TableCell className="text-muted-foreground">{project.lastScreenedAt}</TableCell>
                <TableCell className="text-muted-foreground">{project.createdAt}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${project.id}`)}>
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <AddProjectSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  )
}
