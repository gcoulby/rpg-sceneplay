import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SHEET_TEMPLATES } from '../templates'
import type { CharacterSheet, SheetTemplate } from '../types'

interface SheetOptionsDialogProps {
  sheet: CharacterSheet
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveName: (name: string) => void
  onRequestTemplateChange: (template: SheetTemplate) => void
}

/** Editable any time, separate from moduleLayout content. Changing the
 *  template routes through onRequestTemplateChange so the caller can show
 *  the confirm-then-clear-values flow rather than swapping instantly. */
const SheetOptionsDialog: React.FC<SheetOptionsDialogProps> = ({
  sheet,
  open,
  onOpenChange,
  onSaveName,
  onRequestTemplateChange,
}) => {
  const [name, setName] = useState(sheet.options.name)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onSaveName(name)
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sheet Options</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sheet-name" className="text-xs">
              Sheet name
            </Label>
            <Input
              id="sheet-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Template</Label>
            <Select
              value={sheet.templateId ?? ''}
              onValueChange={(id) => {
                const template = SHEET_TEMPLATES.find((t) => t.id === id)
                if (template) onRequestTemplateChange(template)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="No template (custom)" />
              </SelectTrigger>
              <SelectContent>
                {SHEET_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-(--fd-text-muted) text-[11px]">
              Switching templates replaces this sheet's layout and clears its
              values, after confirmation.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onSaveName(name)
              onOpenChange(false)
            }}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SheetOptionsDialog
