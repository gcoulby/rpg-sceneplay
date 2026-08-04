/**
 * Multi-select dialog: the user checks which script formats they ever write in.
 * The set is persisted in settingsStore. Used both for first-run setup (auto-shown
 * the first time the user creates a new screenplay) and for later management
 * via Format > Script Format Preferences...
 *
 * On confirm:
 *  - Saves the selection
 *  - Marks formatPreferencesInitialized = true
 *  - Calls onConfirm(ids) so the caller (e.g. New Screenplay flow) can proceed
 */

import React, { useState, useEffect } from 'react'
import { SYSTEM_TEMPLATE_LIST } from '@/stores/formattingTemplateStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { INDUSTRY_STANDARD_ID } from '@/stores/formattingTypes'

interface Props {
  /** When true the dialog is non-cancellable — used for the first-run setup. */
  firstRun?: boolean
  onConfirm: (selectedIds: string[]) => void
  onCancel?: () => void
}

const ScriptFormatPreferencesDialog: React.FC<Props> = ({
  firstRun = false,
  onConfirm,
  onCancel,
}) => {
  const enabledScriptFormats = useSettingsStore((s) => s.enabledScriptFormats)
  const setEnabledScriptFormats = useSettingsStore(
    (s) => s.setEnabledScriptFormats,
  )
  const setFormatPreferencesInitialized = useSettingsStore(
    (s) => s.setFormatPreferencesInitialized,
  )

  // Default selection on first run: just Film Screenplay. Otherwise hydrate from saved.
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (enabledScriptFormats.length > 0) return new Set(enabledScriptFormats)
    return new Set([INDUSTRY_STANDARD_ID])
  })

  useEffect(() => {
    // If the user has saved a selection in another tab/session, reflect it on open.
    if (enabledScriptFormats.length > 0) {
      setSelected(new Set(enabledScriptFormats))
    }
  }, [enabledScriptFormats])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    const ids = SYSTEM_TEMPLATE_LIST.map((t) => t.id).filter((id) =>
      selected.has(id),
    )
    // Guarantee at least one selection so New Screenplay can always proceed.
    const finalIds = ids.length > 0 ? ids : [INDUSTRY_STANDARD_ID]
    setEnabledScriptFormats(finalIds)
    setFormatPreferencesInitialized(true)
    onConfirm(finalIds)
  }

  return (
    <div
      className="text-(--fd-text-muted) dialog-overlay fixed left-0 top-0 right-0 bg-black/50 z-3000 flex items-start justify-center h-(--vv-height,100dvh) px-4 pt-[5vh] pb-4 overflow-y-auto"
      onClick={firstRun ? undefined : onCancel}
    >
      <div
        className="fmt-dialog bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,.6)] w-140 max-w-[92vw] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base text-(--fd-text)">
          {firstRun
            ? 'Welcome — choose your script formats'
            : 'Script Format Preferences'}
        </div>
        <div className="flex-1 p-[14px_20px] overflow-y-auto">
          <p className="m-0 mb-3 text-[13px] text-(--fd-text-muted) leading-[1.45]">
            {firstRun
              ? 'Pick the formats you commonly write in. When you create a new script, OpenDraft will offer just these options. You can change this later from the Format menu.'
              : 'Choose which formats appear in the New Screenplay picker. If only one is selected, new scripts use it directly without prompting.'}
          </p>
          <div className="flex flex-col gap-1.5">
            {SYSTEM_TEMPLATE_LIST.map((tpl) => {
              const isSelected = selected.has(tpl.id)
              return (
                <label
                  key={tpl.id}
                  className={`fmt-card flex items-start gap-3 p-[10px_12px] border border-(--fd-border) rounded-md bg-transparent cursor-pointer text-left text-(--fd-text) font-[inherit] text-[13px] w-full transition-[background,border-color] duration-100 hover:bg-(--fd-hover,rgba(255,255,255,.05)) hover:border-(--fd-accent)${isSelected ? ' is-selected bg-(--fd-accent-bg,rgba(59,130,246,.12)) border-(--fd-accent)' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 shrink-0 cursor-pointer accent-(--fd-accent)"
                    checked={isSelected}
                    onChange={() => toggle(tpl.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-(--fd-text) flex items-center gap-2">
                      <span>{tpl.name}</span>
                      {tpl.scriptTypeGroup && (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.5px] px-1.5 py-px rounded-[3px] bg-(--fd-bg-dim,rgba(255,255,255,.06)) text-(--fd-text-dim)">
                          {tpl.scriptTypeGroup}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-(--fd-text-dim) mt-0.75 leading-[1.4]">
                      {tpl.scriptTypeTagline || tpl.description}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
        <div className="dialog-actions flex justify-end gap-2 px-5 py-3 border-t border-(--fd-border)">
          {!firstRun && (
            <button className="dialog-btn" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            className="dialog-btn dialog-btn-primary"
            onClick={handleConfirm}
          >
            {firstRun ? 'Save & Continue' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScriptFormatPreferencesDialog
