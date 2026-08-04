import React, { useState, useCallback } from 'react'
import {
  useEditorStore,
  resolveMoresContds,
  DEFAULT_MORES_CONTDS,
} from '@/stores/editorStore'

interface Props {
  onClose: () => void
}

// Common industry presets; "Custom…" reveals a free-text override.
const CONTD_PRESETS = ["(CONT'D)", '(CONTINUED)', "(cont'd)", '(CONT.)']
const MORE_PRESETS = ['(MORE)', '(MORE...)', '(more)']
const CUSTOM = '__custom__'

/**
 * "Mores & Continueds" settings (per-document, like Final Draft). Controls the
 * two independent kinds of dialogue continuation and their marker text:
 *  - character (CONT'D): same character resumes after action, within a scene
 *  - dialogue page break: (MORE) / (CONT'D) when a speech splits across pages
 * The character (CONT'D) never carries across a scene heading — that is a fixed
 * industry rule, so there is no setting for it.
 */
const MoresContdsDialog: React.FC<Props> = ({ onClose }) => {
  const { pageLayout, setPageLayout } = useEditorStore()
  const initial = resolveMoresContds(pageLayout)

  const [characterContd, setCharacterContd] = useState(initial.characterContd)
  const [dialogueBreakContd, setDialogueBreakContd] = useState(
    initial.dialogueBreakContd,
  )
  const [contdText, setContdText] = useState(initial.contdText)
  const [moreText, setMoreText] = useState(initial.moreText)
  // Custom-override mode for each dropdown (on when the value isn't a preset).
  const [contdCustom, setContdCustom] = useState(
    !CONTD_PRESETS.includes(initial.contdText),
  )
  const [moreCustom, setMoreCustom] = useState(
    !MORE_PRESETS.includes(initial.moreText),
  )

  const handleApply = useCallback(() => {
    setPageLayout({
      ...pageLayout,
      moresContds: {
        characterContd,
        dialogueBreakContd,
        contdText: contdText.trim() || DEFAULT_MORES_CONTDS.contdText,
        moreText: moreText.trim() || DEFAULT_MORES_CONTDS.moreText,
      },
    })
    onClose()
  }, [
    pageLayout,
    setPageLayout,
    characterContd,
    dialogueBreakContd,
    contdText,
    moreText,
    onClose,
  ])

  const handleReset = useCallback(() => {
    setCharacterContd(DEFAULT_MORES_CONTDS.characterContd)
    setDialogueBreakContd(DEFAULT_MORES_CONTDS.dialogueBreakContd)
    setContdText(DEFAULT_MORES_CONTDS.contdText)
    setMoreText(DEFAULT_MORES_CONTDS.moreText)
    setContdCustom(false)
    setMoreCustom(false)
  }, [])

  return (
    <div
      className="dialog-overlay fixed inset-x-0 top-0 z-3000 flex items-start justify-center h-(--vv-height,100dvh) px-4 pt-[5vh] pb-4 overflow-y-auto bg-black/50 text-(--fd-text)"
      onClick={onClose}
    >
      <div
        className="tp-editor-dialog bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,.6)] max-w-135 w-full flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header py-3.5 px-5 border-b border-(--fd-border) font-semibold text-(--fd-text) shrink-0">
          Mores &amp; Continueds
        </div>
        <div className="block flex-1 p-5 overflow-y-auto tp-editor-body">
          <label className="flex items-center gap-2.5 mb-1 cursor-pointer">
            <input
              type="checkbox"
              checked={characterContd}
              onChange={(e) => setCharacterContd(e.target.checked)}
            />
            <span>
              Automatic character{' '}
              {contdText.trim() || DEFAULT_MORES_CONTDS.contdText}
            </span>
          </label>
          <p className="opacity-70 mt-0 mb-4 ml-6.5 text-xs">
            Adds the marker when a character speaks again after an action line
            within the same scene. It is never added across a scene heading.
          </p>

          <label className="flex items-center gap-2.5 mb-1 cursor-pointer">
            <input
              type="checkbox"
              checked={dialogueBreakContd}
              onChange={(e) => setDialogueBreakContd(e.target.checked)}
            />
            <span>
              Show {moreText.trim() || DEFAULT_MORES_CONTDS.moreText} /{' '}
              {contdText.trim() || DEFAULT_MORES_CONTDS.contdText} when dialogue
              breaks across pages
            </span>
          </label>
          <p className="opacity-70 mt-0 mb-4 ml-6.5 text-xs">
            When a single speech splits over a page break, shows{' '}
            {moreText.trim() || DEFAULT_MORES_CONTDS.moreText} at the bottom of
            the page and the character name with{' '}
            {contdText.trim() || DEFAULT_MORES_CONTDS.contdText} at the top of
            the next.
          </p>

          <div className="flex flex-col gap-0.75 col-span-full props-field props-field-wide">
            <label className="props-label text-[11px] text-(--fd-text-muted) uppercase tracking-[0.4px]">
              Continued text
            </label>
            <select
              className="props-input h-7.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-[13px] outline-none focus:border-(--fd-accent)"
              value={contdCustom ? CUSTOM : contdText}
              onChange={(e) => {
                if (e.target.value === CUSTOM) setContdCustom(true)
                else {
                  setContdCustom(false)
                  setContdText(e.target.value)
                }
              }}
            >
              {CONTD_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value={CUSTOM}>Custom…</option>
            </select>
            {contdCustom && (
              <input
                className="props-input h-7.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-[13px] outline-none focus:border-(--fd-accent) mt-1.5"
                value={contdText}
                onChange={(e) => setContdText(e.target.value)}
                placeholder="(CONT'D)"
                autoFocus
              />
            )}
          </div>

          <div className="flex flex-col gap-0.75 col-span-full mt-3 props-field props-field-wide">
            <label className="props-label text-[11px] text-(--fd-text-muted) uppercase tracking-[0.4px]">
              More text
            </label>
            <select
              className="props-input h-7.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-[13px] outline-none focus:border-(--fd-accent)"
              value={moreCustom ? CUSTOM : moreText}
              onChange={(e) => {
                if (e.target.value === CUSTOM) setMoreCustom(true)
                else {
                  setMoreCustom(false)
                  setMoreText(e.target.value)
                }
              }}
            >
              {MORE_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value={CUSTOM}>Custom…</option>
            </select>
            {moreCustom && (
              <input
                className="props-input h-7.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-[13px] outline-none focus:border-(--fd-accent) mt-1.5"
                value={moreText}
                onChange={(e) => setMoreText(e.target.value)}
                placeholder="(MORE)"
              />
            )}
          </div>
        </div>
        <div className="dialog-actions flex justify-end gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0">
          <button onClick={handleReset} className="mr-auto">
            Reset to defaults
          </button>
          <button onClick={onClose}>Cancel</button>
          <button
            className="dialog-primary bg-(--fd-accent)! border-(--fd-accent)! text-white!"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default MoresContdsDialog
