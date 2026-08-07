/**
 * Template selection and management dialog for per-document template assignment.
 * Opened from Format > Formatting Template... in the menu bar.
 *
 * Templates are categorized as:
 * - System Standard: read-only templates (e.g. Industry Standard) — cannot be edited or deleted
 * - User Defined: custom templates created by the user — fully editable
 *
 * When applying a template, detects conflicts (disabled elements, locked formatting
 * violations) and shows a resolution dialog before applying.
 */

import { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  useFormattingTemplateStore,
  SYSTEM_TEMPLATES,
  SYSTEM_TEMPLATE_LIST,
} from '@/stores/formattingTemplateStore'
import { INDUSTRY_STANDARD_ID } from '@/stores/formattingTypes'
import { INDUSTRY_STANDARD_TEMPLATE } from '@/stores/industryStandardTemplate'
import type { FormattingTemplate } from '@/stores/formattingTypes'
import TemplateEditorDialog from './template-editor-dialog'
import TemplateConflictDialog from './template-conflict-dialog'
import {
  detectTemplateConflicts,
  resolveTemplateConflicts,
  getEnabledElementOptions,
} from '@/utils/open-draft/templateConflicts'
import type { TemplateConflicts } from '@/utils/open-draft/templateConflicts'
import { showToast } from '@/actions/show-toast'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TemplateSelectDialogProps {
  editor: Editor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TemplateSelectDialog({
  editor,
  open,
  onOpenChange,
}: TemplateSelectDialogProps) {
  const {
    templates,
    activeTemplateId,
    setActiveTemplateId,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  } = useFormattingTemplateStore()

  const [selectedId, setSelectedId] = useState<string | null>(activeTemplateId)
  const [editingTemplate, setEditingTemplate] =
    useState<FormattingTemplate | null>(null)
  const [pendingConflicts, setPendingConflicts] =
    useState<TemplateConflicts | null>(null)
  const [pendingTemplate, setPendingTemplate] =
    useState<FormattingTemplate | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const resolvedActiveId = activeTemplateId || INDUSTRY_STANDARD_ID

  const getSelectedTemplate = (): FormattingTemplate => {
    if (!selectedId || selectedId === INDUSTRY_STANDARD_ID) {
      return INDUSTRY_STANDARD_TEMPLATE
    }
    if (SYSTEM_TEMPLATES[selectedId]) return SYSTEM_TEMPLATES[selectedId]
    return (
      templates.find((t) => t.id === selectedId) || INDUSTRY_STANDARD_TEMPLATE
    )
  }

  const isEmptyDoc = (): boolean => {
    if (!editor || editor.isDestroyed) return false
    const doc = editor.state.doc
    if (doc.childCount === 0) return true
    if (doc.childCount === 1 && doc.firstChild?.textContent === '') return true
    return false
  }

  const applyTemplate = (template: FormattingTemplate) => {
    if (template.id === INDUSTRY_STANDARD_ID) {
      setActiveTemplateId(null)
    } else {
      setActiveTemplateId(template.id)
    }
    if (
      template.starterDocument &&
      template.starterDocument.length > 0 &&
      editor &&
      !editor.isDestroyed &&
      isEmptyDoc()
    ) {
      try {
        editor
          .chain()
          .focus()
          .setContent({
            type: 'doc',
            content: template.starterDocument as unknown as Record<
              string,
              unknown
            >[],
          })
          .run()
      } catch (err) {
        console.warn(
          '[TemplateSelectDialog] failed to seed starter document',
          err,
        )
      }
    }
    onOpenChange(false)
  }

  const handleApply = () => {
    const template = getSelectedTemplate()
    if (editor && !editor.isDestroyed) {
      const conflicts = detectTemplateConflicts(editor, template)
      if (conflicts.hasConflicts) {
        setPendingTemplate(template)
        setPendingConflicts(conflicts)
        return
      }
    }
    applyTemplate(template)
  }

  const handleConflictResolve = (resolved: TemplateConflicts) => {
    if (editor && pendingTemplate) {
      resolveTemplateConflicts(editor, pendingTemplate, resolved)
    }
    if (pendingTemplate) applyTemplate(pendingTemplate)
    setPendingConflicts(null)
    setPendingTemplate(null)
  }

  const handleConflictSkip = () => {
    if (pendingTemplate) applyTemplate(pendingTemplate)
    setPendingConflicts(null)
    setPendingTemplate(null)
  }

  const handleConflictCancel = () => {
    setPendingConflicts(null)
    setPendingTemplate(null)
  }

  const systemTemplates: FormattingTemplate[] = SYSTEM_TEMPLATE_LIST
  const userTemplates: FormattingTemplate[] = templates.filter(
    (t) => t.category !== 'system',
  )

  const renderTemplateItem = (t: FormattingTemplate) => {
    const isSystem = t.category === 'system'
    const isSelected =
      (t.id === INDUSTRY_STANDARD_ID &&
        (!selectedId || selectedId === INDUSTRY_STANDARD_ID)) ||
      t.id === selectedId
    const isCurrent = t.id === resolvedActiveId
    return (
      <div
        key={t.id}
        className={`px-3 py-2.5 cursor-pointer border-b last:border-b-0 transition-colors ${
          isSelected ? 'bg-primary/10' : 'hover:bg-muted'
        }`}
        onClick={() => setSelectedId(t.id)}
      >
        <div className="flex items-center gap-2">
          <span className="flex flex-1 items-center gap-1.5 font-medium text-sm">
            {t.name}
            {isCurrent && (
              <span className="bg-primary/15 px-1.5 py-px rounded font-semibold text-[10px] text-primary uppercase">
                current
              </span>
            )}
          </span>
          <span
            className={`text-[11px] px-2 py-px rounded capitalize ${
              t.mode === 'enforce'
                ? 'text-[#f59e0b] bg-[rgba(245,158,11,0.15)]'
                : 'text-[#10b981] bg-[rgba(16,185,129,0.15)]'
            }`}
          >
            {t.mode}
          </span>
        </div>
        {t.description && (
          <span className="block mt-1 text-muted-foreground text-xs">
            {t.description}
          </span>
        )}
        <div className="flex gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
          {isSystem ? (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                const dup = await duplicateTemplate(t.id)
                setEditingTemplate(dup)
              }}
            >
              Duplicate
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingTemplate(t)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await duplicateTemplate(t.id)
                  showToast({
                    description: 'Template duplicated',
                    type: 'success',
                  })
                }}
              >
                Duplicate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="hover:bg-red-500/10 text-red-500"
                onClick={async () => {
                  if (confirm(`Delete template "${t.name}"?`)) {
                    await deleteTemplate(t.id)
                    if (selectedId === t.id) setSelectedId(INDUSTRY_STANDARD_ID)
                    showToast({
                      description: 'Template deleted',
                      type: 'success',
                    })
                  }
                }}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex flex-col sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Script Format / Template</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground">
            Choose a script format (screenplay, sitcom, drama, stage play,
            radio) or a custom formatting template. The template controls
            element-level formatting rules; for an empty document, choosing a
            script type also seeds starter content.
          </p>

          <ScrollArea className="rounded-md w-full h-[45vh]">
            <div className="flex-1 rounded-md overflow-y-auto">
              <div className="bg-muted px-3 py-1.5 border-b font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.5px]">
                Script Formats
              </div>
              {systemTemplates.map(renderTemplateItem)}

              <div className="bg-muted px-3 py-1.5 border-b font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.5px]">
                User Defined
              </div>
              {userTemplates.length === 0 ? (
                <div className="p-3 text-[13px] text-muted-foreground text-center">
                  No custom templates yet.
                </div>
              ) : (
                userTemplates.map(renderTemplateItem)
              )}
            </div>

            <Button
              variant="outline"
              className="self-start"
              onClick={async () => {
                const t = await createTemplate({ name: 'New Template' })
                setEditingTemplate(t)
              }}
            >
              + Create Template
            </Button>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TemplateEditorDialog
        open={editingTemplate !== null}
        template={editingTemplate}
        onSave={async (updated: FormattingTemplate) => {
          await updateTemplate(updated.id, updated)
          setEditingTemplate(null)
          showToast({ description: 'Template saved', type: 'success' })
        }}
        onCancel={() => setEditingTemplate(null)}
      />

      {pendingConflicts && pendingTemplate && (
        <TemplateConflictDialog
          open={pendingConflicts !== null && pendingTemplate !== null}
          conflicts={
            pendingConflicts ?? {
              disabledElements: [],
              formattingViolations: [],
              hasConflicts: false,
            }
          }
          enabledElements={
            pendingTemplate ? getEnabledElementOptions(pendingTemplate) : []
          }
          templateName={pendingTemplate?.name ?? ''}
          onResolve={handleConflictResolve}
          onSkip={handleConflictSkip}
          onCancel={handleConflictCancel}
        />
      )}
    </>
  )
}
