/**
 * Quick single-select picker shown when the user invokes New Screenplay and
 * has 2+ formats enabled in their preferences. The list contains only the
 * enabled formats. Picking one calls onPick(templateId).
 *
 * If only one format is enabled, callers should skip this dialog entirely
 * and apply that format directly.
 */

import React from 'react'
import { SYSTEM_TEMPLATES } from '@/stores/formattingTemplateStore'

interface Props {
  enabledIds: string[]
  onPick: (templateId: string) => void
  onCancel: () => void
}

const ScriptFormatPickerDialog: React.FC<Props> = ({
  enabledIds,
  onPick,
  onCancel,
}) => {
  // Resolve to template objects, filtering out anything stale (e.g. a removed system template).
  const options = enabledIds
    .map((id) => SYSTEM_TEMPLATES[id])
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  return (
    <div
      className="dialog-overlay fixed left-0 top-0 right-0 bg-black/50 z-3000 flex items-start justify-center overflow-y-auto h-(--vv-height,100dvh) pt-[5vh] px-4 pb-4"
      onClick={onCancel}
    >
      <div
        className="bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] w-115 max-w-[92vw] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0 text-(--fd-text)">
          Choose script format
        </div>
        <div className="flex-1 px-5 py-3.5 overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-5 text-center text-[13px] text-(--fd-text-muted)">
              No formats enabled. Open Format → Script Format Preferences to
              choose at least one.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {options.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className="fmt-card flex items-start gap-3 py-2.5 px-3 border border-(--fd-border) rounded-md bg-transparent cursor-pointer text-left text-(--fd-text) font-[inherit] text-[13px] w-full transition-[background,border-color] duration-100 hover:bg-white/5 hover:border-(--fd-accent)"
                  onClick={() => onPick(tpl.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-(--fd-text) flex items-center gap-2">
                      <span>{tpl.name}</span>
                      {tpl.scriptTypeGroup && (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.5px] py-px px-1.5 rounded-[3px] bg-white/6 text-(--fd-text-muted)">
                          {tpl.scriptTypeGroup}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-(--fd-text-muted) mt-0.75 leading-[1.4]">
                      {tpl.scriptTypeTagline || tpl.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="dialog-actions flex justify-end gap-2 py-3 px-5 border-t border-(--fd-border) shrink-0">
          <button className="dialog-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScriptFormatPickerDialog
