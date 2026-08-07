/**
 * Template Conflict Resolution Dialog.
 *
 * Shown when applying a template to a document that has:
 * 1. Element types the template disables — user picks replacements
 * 2. Inline marks that conflict with locked formatting — user can strip them
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  TemplateConflicts,
  DisabledElementConflict,
  FormattingViolation,
} from '@/utils/open-draft/templateConflicts'

interface TemplateConflictDialogProps {
  open: boolean
  conflicts: TemplateConflicts
  enabledElements: Array<{ id: string; label: string }>
  templateName: string
  onResolve: (resolved: TemplateConflicts) => void
  onSkip: () => void
  onCancel: () => void
}

export default function TemplateConflictDialog({
  open,
  conflicts,
  enabledElements,
  templateName,
  onResolve,
  onSkip,
  onCancel,
}: TemplateConflictDialogProps) {
  const [disabledElements, setDisabledElements] = useState<
    DisabledElementConflict[]
  >(() => conflicts.disabledElements.map((c) => ({ ...c })))
  const [formattingViolations, setFormattingViolations] = useState<
    FormattingViolation[]
  >(() =>
    conflicts.formattingViolations.map((v) => ({ ...v, shouldReformat: true })),
  )

  const updateReplacement = (index: number, replacementType: string) => {
    setDisabledElements((prev) =>
      prev.map((c, i) => (i === index ? { ...c, replacementType } : c)),
    )
  }

  const toggleReformat = (index: number) => {
    setFormattingViolations((prev) =>
      prev.map((v, i) =>
        i === index ? { ...v, shouldReformat: !v.shouldReformat } : v,
      ),
    )
  }

  const handleResolve = () => {
    onResolve({
      disabledElements,
      formattingViolations,
      hasConflicts: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Template Conflicts</DialogTitle>
        </DialogHeader>

        <p className="text-[13px] text-muted-foreground">
          Applying <strong className="text-foreground">{templateName}</strong>{' '}
          requires resolving the following conflicts in your document.
        </p>

        {disabledElements.length > 0 && (
          <div className="space-y-2.5">
            <div>
              <h4 className="font-semibold text-[13px] text-primary uppercase tracking-[0.5px]">
                Disabled Element Types
              </h4>
              <p className="mt-1 text-muted-foreground text-xs">
                These element types are disabled in the template but exist in
                your document. Choose a replacement for each.
              </p>
            </div>
            {disabledElements.map((c, i) => (
              <div
                key={c.elementType}
                className="space-y-2 px-3 py-2.5 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex justify-center items-center bg-[#f59e0b]/15 px-1.5 rounded min-w-6 h-5.5 font-semibold text-[#f59e0b] text-xs">
                    {c.nodeCount}
                  </span>
                  <span className="font-medium text-sm">
                    {c.elementLabel} element{c.nodeCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-muted-foreground text-xs whitespace-nowrap shrink-0">
                    Replace with:
                  </Label>
                  <Select
                    value={c.replacementType}
                    onValueChange={(v) => v && updateReplacement(i, v)}
                  >
                    <SelectTrigger className="flex-1 h-8.5 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {enabledElements.map((el) => (
                        <SelectItem key={el.id} value={el.id}>
                          {el.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}

        {formattingViolations.length > 0 && (
          <div className="space-y-2.5">
            <div>
              <h4 className="font-semibold text-[13px] text-primary uppercase tracking-[0.5px]">
                Formatting Conflicts
              </h4>
              <p className="mt-1 text-muted-foreground text-xs">
                These elements have inline formatting that conflicts with the
                template&apos;s locked rules. Check to strip conflicting marks.
              </p>
            </div>
            {formattingViolations.map((v, i) => (
              <div
                key={v.elementType}
                className="px-3 py-2.5 border rounded-md"
              >
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.75 shrink-0"
                    checked={v.shouldReformat}
                    onChange={() => toggleReformat(i)}
                  />
                  <div>
                    <span className="font-medium text-sm">
                      {v.elementLabel}
                    </span>
                    <span className="block mt-0.5 text-muted-foreground text-xs">
                      {v.nodeCount} element{v.nodeCount !== 1 ? 's' : ''} with{' '}
                      {v.conflictingMarks.join(', ')}
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onSkip}>
            Apply Without Resolving
          </Button>
          <Button onClick={handleResolve}>Resolve &amp; Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
