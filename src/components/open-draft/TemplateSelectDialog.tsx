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

import React, { useState, useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import {
  useFormattingTemplateStore,
  SYSTEM_TEMPLATES,
  SYSTEM_TEMPLATE_LIST,
} from '@/stores/formattingTemplateStore'
import { INDUSTRY_STANDARD_ID } from '@/stores/formattingTypes'
import { INDUSTRY_STANDARD_TEMPLATE } from '@/stores/industryStandardTemplate'
import type { FormattingTemplate } from '@/stores/formattingTypes'
import TemplateEditorDialog from './TemplateEditorDialog'
import TemplateConflictDialog from './TemplateConflictDialog'
import {
  detectTemplateConflicts,
  resolveTemplateConflicts,
  getEnabledElementOptions,
} from '@/utils/templateConflicts'
import type { TemplateConflicts } from '@/utils/templateConflicts'
import { showToast } from './Toast'

interface TemplateSelectDialogProps {
  editor: Editor | null
  onClose: () => void
}

const TemplateSelectDialog: React.FC<TemplateSelectDialogProps> = ({
  editor,
  onClose,
}) => {
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

  // Resolve which ID is currently the "active" one (null = Industry Standard)
  const resolvedActiveId = activeTemplateId || INDUSTRY_STANDARD_ID

  // Resolve the selected template object — checks system templates first, then user-created.
  const getSelectedTemplate = (): FormattingTemplate => {
    if (!selectedId || selectedId === INDUSTRY_STANDARD_ID) {
      return INDUSTRY_STANDARD_TEMPLATE
    }
    if (SYSTEM_TEMPLATES[selectedId]) return SYSTEM_TEMPLATES[selectedId]
    return (
      templates.find((t) => t.id === selectedId) || INDUSTRY_STANDARD_TEMPLATE
    )
  }

  /** Returns true if the editor doc has no user-authored content (single empty paragraph or empty). */
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
    // Seed starter content for empty docs (e.g. new-script flow). Existing content is left untouched.
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
    onClose()
  }

  const handleApply = () => {
    const template = getSelectedTemplate()

    // Detect conflicts if we have an editor with content
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

  // Split templates by category — SYSTEM_TEMPLATE_LIST owns the canonical order of script-type templates.
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
        className={`p-[10px_12px] cursor-pointer border-b border-(--fd-border) transition-[background] duration-100 last:border-b-0 ${isSelected ? 'bg-(--fd-accent-bg,rgba(59,130,246,.15))' : 'hover:bg-(--fd-hover,rgba(255,255,255,.05))'}`}
        onClick={() => setSelectedId(t.id)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-(--fd-text) flex-1 flex items-center gap-1.5">
            {t.name}
            {isCurrent && (
              <span className="text-[10px] font-semibold uppercase text-(--fd-accent,#3b82f6) bg-(--fd-accent-bg,rgba(59,130,246,.15)) px-1.5 py-px rounded">
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
          <span className="block text-xs text-(--fd-text-dim) mt-1">
            {t.description}
          </span>
        )}
        {/* Actions: system = duplicate only; user = edit/duplicate/delete */}
        <div className="flex gap-1.5 mt-2" onClick={(e) => e.stopPropagation()}>
          {isSystem ? (
            <button
              className="px-2! py-1! text-xs! dialog-btn"
              onClick={async () => {
                const dup = await duplicateTemplate(t.id)
                setEditingTemplate(dup)
              }}
            >
              Duplicate
            </button>
          ) : (
            <>
              <button
                className="px-2! py-1! text-xs! dialog-btn"
                onClick={() => setEditingTemplate(t)}
              >
                Edit
              </button>
              <button
                className="px-2! py-1! text-xs! dialog-btn"
                onClick={async () => {
                  await duplicateTemplate(t.id)
                  showToast('Template duplicated', 'success')
                }}
              >
                Duplicate
              </button>
              <button
                className="hover:bg-[rgba(255,68,68,0.1)]! px-2! py-1! text-[#ff4444]! text-xs! dialog-btn"
                onClick={async () => {
                  if (confirm(`Delete template "${t.name}"?`)) {
                    await deleteTemplate(t.id)
                    if (selectedId === t.id) setSelectedId(INDUSTRY_STANDARD_ID)
                    showToast('Template deleted', 'success')
                  }
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="text-(--fd-text) fixed inset-0 bg-black/50 z-2000 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-(--fd-bg) border border-(--fd-border) rounded-lg p-5 w-130 max-w-[90vw] max-h-[80vh] flex flex-col [&>h3]:m-0 [&>h3]:mb-2 [&>h3]:text-base [&>h3]:text-(--fd-text)"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Script Format / Template</h3>
        <p className="text-[13px] text-(--fd-text-dim) mb-3">
          Choose a script format (screenplay, sitcom, drama, stage play, radio)
          or a custom formatting template. The template controls element-level
          formatting rules; for an empty document, choosing a script type also
          seeds starter content.
        </p>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto border border-(--fd-border) rounded-md max-h-85">
          {/* Script formats (system templates) */}
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.5px] text-(--fd-text-dim) bg-(--fd-bg-dim,rgba(255,255,255,.03)) border-b border-(--fd-border)">
            Script Formats
          </div>
          {systemTemplates.map(renderTemplateItem)}

          {/* User Defined section */}
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.5px] text-(--fd-text-dim) bg-(--fd-bg-dim,rgba(255,255,255,.03)) border-b border-(--fd-border)">
            User Defined
          </div>
          {userTemplates.length === 0 ? (
            <div className="p-3 text-[13px] text-(--fd-text-dim) text-center">
              No custom templates yet.
            </div>
          ) : (
            userTemplates.map(renderTemplateItem)
          )}
        </div>

        {/* Template management buttons */}
        <div className="flex gap-2 mt-3">
          <button
            className="dialog-btn dialog-btn-primary"
            onClick={async () => {
              const t = await createTemplate({ name: 'New Template' })
              setEditingTemplate(t)
            }}
          >
            + Create Template
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button className="dialog-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="dialog-btn dialog-btn-primary"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>

        {/* Template Editor sub-dialog */}
        {editingTemplate && (
          <TemplateEditorDialog
            template={editingTemplate}
            onSave={async (updated) => {
              await updateTemplate(updated.id, updated)
              setEditingTemplate(null)
              showToast('Template saved', 'success')
            }}
            onCancel={() => setEditingTemplate(null)}
          />
        )}

        {/* Template Conflict Resolution sub-dialog */}
        {pendingConflicts && pendingTemplate && (
          <TemplateConflictDialog
            conflicts={pendingConflicts}
            enabledElements={getEnabledElementOptions(pendingTemplate)}
            templateName={pendingTemplate.name}
            onResolve={handleConflictResolve}
            onSkip={handleConflictSkip}
            onCancel={handleConflictCancel}
          />
        )}
      </div>
    </div>
  )
}

export default TemplateSelectDialog
