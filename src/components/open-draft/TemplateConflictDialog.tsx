/**
 * Template Conflict Resolution Dialog.
 *
 * Shown when applying a template to a document that has:
 * 1. Element types the template disables — user picks replacements
 * 2. Inline marks that conflict with locked formatting — user can strip them
 */

import React, { useState } from 'react'
import type {
  TemplateConflicts,
  DisabledElementConflict,
  FormattingViolation,
} from '@/utils/open-draft/templateConflicts'

interface TemplateConflictDialogProps {
  conflicts: TemplateConflicts
  enabledElements: Array<{ id: string; label: string }>
  templateName: string
  onResolve: (resolved: TemplateConflicts) => void
  onSkip: () => void
  onCancel: () => void
}

const TemplateConflictDialog: React.FC<TemplateConflictDialogProps> = ({
  conflicts,
  enabledElements,
  templateName,
  onResolve,
  onSkip,
  onCancel,
}) => {
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
    <div
      className="z-2100 fixed inset-0 flex justify-center items-center bg-black/60"
      onClick={onCancel}
    >
      <div
        className="bg-(--fd-bg) border border-(--fd-border) rounded-lg p-5 w-[520px] max-w-[92vw] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="m-0 mb-1.5 text-base text-(--fd-text)">
          Template Conflicts
        </h3>
        <p className="m-0 mb-4 text-[#aaa] text-[13px]">
          Applying <strong>{templateName}</strong> requires resolving the
          following conflicts in your document.
        </p>

        {/* Disabled Element Types */}
        {disabledElements.length > 0 && (
          <div className="mb-4">
            <h4 className="m-0 mb-1 text-[13px] font-semibold text-(--fd-accent) uppercase tracking-[0.5px]">
              Disabled Element Types
            </h4>
            <p className="m-0 mb-2.5 text-[#aaa] text-xs">
              These element types are disabled in the template but exist in your
              document. Choose a replacement for each.
            </p>
            {disabledElements.map((c, i) => (
              <div
                key={c.elementType}
                className="bg-white/3 border border-(--fd-border) rounded-md py-2.5 px-3 mb-2"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex justify-center items-center bg-[#f59e0b]/15 px-1.5 rounded min-w-6 h-[22px] font-semibold text-[#f59e0b] text-xs">
                    {c.nodeCount}
                  </span>
                  <span className="text-sm font-medium text-(--fd-text)">
                    {c.elementLabel} element{c.nodeCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[#aaa] text-xs whitespace-nowrap">
                    Replace with:
                  </label>
                  <select
                    className="dialog-input h-[34px] bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border flex-1"
                    value={c.replacementType}
                    onChange={(e) => updateReplacement(i, e.target.value)}
                  >
                    {enabledElements.map((el) => (
                      <option key={el.id} value={el.id}>
                        {el.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formatting Violations */}
        {formattingViolations.length > 0 && (
          <div className="mb-4">
            <h4 className="m-0 mb-1 text-[13px] font-semibold text-(--fd-accent) uppercase tracking-[0.5px]">
              Formatting Conflicts
            </h4>
            <p className="m-0 mb-2.5 text-[#aaa] text-xs">
              These elements have inline formatting that conflicts with the
              template&apos;s locked rules. Check to strip conflicting marks.
            </p>
            {formattingViolations.map((v, i) => (
              <div
                key={v.elementType}
                className="bg-white/3 border border-(--fd-border) rounded-md py-2.5 px-3 mb-2"
              >
                <label className="flex items-start gap-2 cursor-pointer text-sm text-(--fd-text)">
                  <input
                    type="checkbox"
                    className="mt-[3px] shrink-0"
                    checked={v.shouldReformat}
                    onChange={() => toggleReformat(i)}
                  />
                  <div>
                    <span className="text-sm font-medium text-(--fd-text)">
                      {v.elementLabel}
                    </span>
                    <span className="block mt-0.5 text-[#aaa] text-xs">
                      {v.nodeCount} element{v.nodeCount !== 1 ? 's' : ''} with{' '}
                      {v.conflictingMarks.join(', ')}
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="dialog-btn h-8.5 px-4.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover)"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="dialog-btn h-8.5 px-4.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover)"
            onClick={onSkip}
          >
            Apply Without Resolving
          </button>
          <button
            className="dialog-btn dialog-btn-primary h-8.5 px-4.5 bg-(--fd-accent) border border-(--fd-accent) rounded cursor-pointer text-sm text-white hover:opacity-90"
            onClick={handleResolve}
          >
            Resolve &amp; Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemplateConflictDialog
