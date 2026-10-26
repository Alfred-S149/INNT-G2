"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CreateTemplateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTemplateSheet({ open, onOpenChange }: CreateTemplateSheetProps) {
  const [name, setName] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: wire to API
    setName("")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[560px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>Create template</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex flex-col gap-2 px-6 py-6">
            <label htmlFor="template-name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input
              id="template-name"
              placeholder="Enter name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <SheetFooter className="mt-auto px-6 py-5 border-t border-border flex flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
