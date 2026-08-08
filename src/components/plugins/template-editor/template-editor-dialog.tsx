/**
 * Template Editor Dialog — full-featured editor for formatting templates.
 *
 * Allows customizing every aspect of each element type:
 * text style, layout, transitions, placeholder, colors, etc.
 * Also supports adding/removing custom element types.
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import type {
  FormattingTemplate,
  FormattingElementRule,
} from '@/stores/formattingTypes'
import { createDefaultRule } from '@/stores/formattingTypes'
import { uuid } from './template-editor-utils'
import ElementListPanel from './element-list-panel'
import ElementDetailPanel from './element-detail-panel'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TemplateEditorDialogProps {
  open: boolean
  template: FormattingTemplate | null
  onSave: (template: FormattingTemplate) => void
  onCancel: () => void
}

export default function TemplateEditorDialog({
  open,
  template,
  onSave,
  onCancel,
}: TemplateEditorDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<'enforce' | 'override'>('override')
  const [rules, setRules] = useState<Record<string, FormattingElementRule>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [initialId, setInitialId] = useState<string | null>(null)
  const [prevOpen, setPrevOpen] = useState(open)

  // Re-hydrate local edit state exactly once per closed→open transition,
  // rather than every render — see title-page-editor.tsx for the same pattern.
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open && template) {
      setName(template.name)
      setDescription(template.description)
      setMode(template.mode)
      const clonedRules = JSON.parse(JSON.stringify(template.rules))
      setRules(clonedRules)
      setSelectedId(Object.keys(clonedRules)[0] || null)
      setInitialId(template.id)
    }
  }

  const selectedRule = selectedId ? rules[selectedId] : null

  const updateRule = (id: string, updates: Partial<FormattingElementRule>) => {
    setRules((prev) => ({ ...prev, [id]: { ...prev[id], ...updates } }))
  }

  const addCustomElement = () => {
    const id = uuid()
    const newRule = createDefaultRule(id, 'Custom Element', false)
    setRules((prev) => ({ ...prev, [id]: newRule }))
    setSelectedId(id)
  }

  const removeElement = (id: string) => {
    setRules((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    if (selectedId === id) {
      setSelectedId(Object.keys(rules).find((k) => k !== id) || null)
    }
  }

  const handleSave = () => {
    if (!template) return
    onSave({
      ...template,
      id: initialId ?? template.id,
      name,
      description,
      mode,
      rules,
      updatedAt: new Date().toISOString(),
    })
  }

  const elementOptions = Object.values(rules)
    .filter((r) => r.enabled)
    .map((r) => ({ id: r.id, label: r.label }))

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="flex flex-col p-0 sm:max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>
        <ScrollArea className="rounded-md w-full h-[65vh]">
          <div className="flex flex-wrap gap-3 px-4 py-3 border-b">
            <div className="flex-1 space-y-1 min-w-45">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                Name
              </Label>
              <Input
                className="h-8.5 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
              />
            </div>
            <div className="flex-1 space-y-1 min-w-45">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                Description
              </Label>
              <Input
                className="h-8.5 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div className="flex-1 space-y-1 min-w-45">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                Mode
              </Label>
              <div className="flex gap-1">
                <Toggle
                  pressed={mode === 'enforce'}
                  onPressedChange={(v) => v && setMode('enforce')}
                  className="flex-1"
                >
                  Enforce
                </Toggle>
                <Toggle
                  pressed={mode === 'override'}
                  onPressedChange={(v) => v && setMode('override')}
                  className="flex-1"
                >
                  Override
                </Toggle>
              </div>
              <span className="block mt-0.5 text-[11px] text-muted-foreground">
                {mode === 'enforce'
                  ? 'Formatting is locked — users cannot change element-level styling.'
                  : 'Formatting sets defaults — users can override per-instance.'}
              </span>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <ElementListPanel
              rules={rules}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggleEnabled={(id, enabled) => updateRule(id, { enabled })}
              onAdd={addCustomElement}
              onRemove={removeElement}
            />
            {selectedRule ? (
              <ElementDetailPanel
                rule={selectedRule}
                mode={mode}
                elementOptions={elementOptions}
                onUpdate={(updates) => updateRule(selectedId!, updates)}
              />
            ) : (
              <div className="flex flex-1 justify-center items-center text-muted-foreground text-sm">
                Select an element from the list to edit its formatting.
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="px-10 pt-4 pb-8 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
