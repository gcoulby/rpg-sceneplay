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

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SYSTEM_TEMPLATE_LIST } from '@/stores/formattingTemplateStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { INDUSTRY_STANDARD_ID } from '@/stores/formattingTypes'

interface ScriptFormatPreferencesDialogProps {
  open: boolean
  /** When true the dialog is non-cancellable — used for the first-run setup. */
  firstRun?: boolean
  onConfirm: (selectedIds: string[]) => void
  onCancel?: () => void
}

export default function ScriptFormatPreferencesDialog({
  open,
  firstRun = false,
  onConfirm,
  onCancel,
}: ScriptFormatPreferencesDialogProps) {
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
  const [prevEnabledScriptFormats, setPrevEnabledScriptFormats] =
    useState(enabledScriptFormats)

  if (enabledScriptFormats !== prevEnabledScriptFormats) {
    setPrevEnabledScriptFormats(enabledScriptFormats)
    if (enabledScriptFormats.length > 0) {
      setSelected(new Set(enabledScriptFormats))
    }
  }

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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // First-run setup is non-cancellable: ignore outside-click/Escape close.
        if (!next && firstRun) return
        if (!next) onCancel?.()
      }}
    >
      <DialogContent
        className="sm:max-w-lg max-h-[85vh] overflow-y-auto"
        showCloseButton={!firstRun}
      >
        <DialogHeader>
          <DialogTitle>
            {firstRun
              ? 'Welcome — choose your script formats'
              : 'Script Format Preferences'}
          </DialogTitle>
        </DialogHeader>

        <p className="text-[13px] text-muted-foreground leading-[1.45]">
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
                className={`flex items-start gap-3 px-3 py-2.5 border rounded-md cursor-pointer text-left text-[13px] w-full transition-colors hover:bg-muted ${
                  isSelected ? 'bg-primary/10 border-primary' : ''
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 cursor-pointer shrink-0"
                  checked={isSelected}
                  onChange={() => toggle(tpl.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <span>{tpl.name}</span>
                    {tpl.scriptTypeGroup && (
                      <span className="bg-muted px-1.5 py-px rounded-[3px] font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.5px]">
                        {tpl.scriptTypeGroup}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.75 text-muted-foreground text-xs leading-[1.4]">
                    {tpl.scriptTypeTagline || tpl.description}
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        <DialogFooter>
          {!firstRun && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleConfirm}>
            {firstRun ? 'Save & Continue' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
