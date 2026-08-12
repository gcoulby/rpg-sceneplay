/**
 * On-load storage picker.
 *
 * Three modes: Disk Persistence (Chromium only), Import File without
 * Persistence, and Browser (the default). Picking Browser drops into a second
 * view listing documents already in IndexedDB, so returning users open straight
 * into their work instead of being asked blank/sample/import again.
 *
 * Visual language is deliberately the same as `WelcomeDialog` — same overlay,
 * card, hero, and option-button treatment, same `--fd-*` theme variables — so
 * the two first-run surfaces read as one flow.
 */
import React, { useCallback, useEffect, useState } from 'react'
import type { StorageDocSummary, StorageMode } from './types'
import {
  availableModes,
  chooseMode,
  openExistingDiskFile,
} from './storageManager'
import { indexedDbProvider } from './providers/indexedDbProvider'
import { relativeTime } from '@/utils/open-draft/relativeTime'

const OPTION_BUTTON_CLASS =
  'flex items-center gap-3 w-full py-3 px-3.5 bg-white/5 border border-(--fd-border) rounded-lg cursor-pointer transition-colors duration-150 text-left hover:bg-[rgba(74,158,255,0.1)] hover:border-(--fd-accent) disabled:opacity-50 disabled:cursor-not-allowed'
const OPTION_ICON_CLASS =
  'flex justify-center items-center bg-[rgba(74,158,255,0.12)] rounded-lg w-9 h-9 text-[22px] shrink-0'
const OPTION_LABEL_CLASS =
  'flex flex-col gap-0.5 [&_strong]:text-[13px] [&_strong]:font-semibold [&_strong]:text-(--fd-text) [&_small]:text-[11px] [&_small]:text-(--fd-text-muted)'

export interface StorageModeDialogProps {
  /** Suggested filename when the user picks Disk Persistence. */
  suggestedTitle?: string
  /** Mode acquired. `docId` is set only when an existing Browser document was
   *  chosen, in which case the caller loads it and skips blank/sample/import. */
  onModeChosen: (mode: StorageMode, docId?: string) => void
}

const StorageModeDialog: React.FC<StorageModeDialogProps> = ({
  suggestedTitle,
  onModeChosen,
}) => {
  const [view, setView] = useState<'modes' | 'browser' | 'disk'>('modes')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [docs, setDocs] = useState<StorageDocSummary[] | null>(null)
  const modes = availableModes()

  // Load the saved-document list as soon as the Browser view opens.
  useEffect(() => {
    if (view !== 'browser' || docs !== null) return
    let cancelled = false
    indexedDbProvider
      .list()
      .then((rows) => {
        if (!cancelled) setDocs(rows)
      })
      .catch(() => {
        if (!cancelled) setDocs([])
      })
    return () => {
      cancelled = true
    }
  }, [view, docs])

  /** `busy` guards against a double-click re-entering showSaveFilePicker while
   *  the first call is still awaiting — the browser rejects the second. */
  const pick = useCallback(
    async (mode: StorageMode) => {
      if (busy) return
      if (mode === 'browser') {
        setView('browser')
        return
      }
      if (mode === 'disk') {
        setView('disk')
        return
      }
      setBusy(true)
      setError(null)
      try {
        const ok = await chooseMode(mode, suggestedTitle)
        if (!ok) return // user cancelled the picker — stay on the dialog
        onModeChosen(mode)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setBusy(false)
      }
    },
    [busy, suggestedTitle, onModeChosen],
  )

  const pickDiskNew = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const ok = await chooseMode('disk', suggestedTitle)
      if (!ok) return // user cancelled the picker — stay on the dialog
      onModeChosen('disk')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }, [busy, suggestedTitle, onModeChosen])

  const pickDiskOpen = useCallback(async () => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const doc = await openExistingDiskFile()
      if (!doc) return // user cancelled the picker — stay on the dialog
      onModeChosen('disk')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }, [busy, onModeChosen])

  return (
    <div className="dialog-overlay fixed inset-x-0 top-0 z-3000 flex items-start justify-center h-(--vv-height,100dvh) px-4 pt-[5vh] pb-4 overflow-y-auto bg-black/50">
      <div
        className="welcome-card bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-xl shadow-[0_12px_40px_rgba(0,0,0,.5)] w-95 text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[linear-gradient(135deg,#1a2a3a_0%,#2b2b2b_100%)] px-6 pt-8 pb-5 welcome-hero">
          <div className="w-12 h-12 mx-auto mb-3 bg-(--fd-accent) rounded-[10px] flex items-center justify-center font-bold text-[18px] text-white tracking-[1px]">
            OD
          </div>
          <h1 className="m-0 mb-1 font-semibold text-[22px] text-white">
            RPG Sceneplay
          </h1>
          <p className="text-[13px] text-(--fd-text-muted) m-0">
            {view === 'modes'
              ? 'Everything stays on this device — pick where your work is kept'
              : view === 'disk'
                ? 'Save automatically into a file on disk'
                : 'Saved in this browser'}
          </p>
        </div>

        {view === 'disk' ? (
          <>
            <p className="mt-4 mx-6 text-xs font-semibold text-(--fd-text-muted) uppercase tracking-[0.5px]">
              New or existing file?
            </p>

            <div className="flex flex-col gap-2 px-6 pt-3">
              <button
                className={OPTION_BUTTON_CLASS}
                disabled={busy}
                onClick={() => void pickDiskNew()}
              >
                <span className={OPTION_ICON_CLASS}>&#128196;</span>
                <span className={OPTION_LABEL_CLASS}>
                  <strong>New File</strong>
                  <small>Create a file to save into</small>
                </span>
              </button>

              <button
                className={OPTION_BUTTON_CLASS}
                disabled={busy}
                onClick={() => void pickDiskOpen()}
              >
                <span className={OPTION_ICON_CLASS}>&#128193;</span>
                <span className={OPTION_LABEL_CLASS}>
                  <strong>Open Existing File</strong>
                  <small>Continue saving into a .sceneplay file</small>
                </span>
              </button>
            </div>
          </>
        ) : view === 'modes' ? (
          <>
            <p className="mt-4 mx-6 text-xs font-semibold text-(--fd-text-muted) uppercase tracking-[0.5px]">
              Where should your work be saved?
            </p>

            <div className="flex flex-col gap-2 px-6 pt-3">
              <button
                className={OPTION_BUTTON_CLASS}
                disabled={busy}
                onClick={() => void pick('browser')}
              >
                <span className={OPTION_ICON_CLASS}>&#128190;</span>
                <span className={OPTION_LABEL_CLASS}>
                  <strong>Browser</strong>
                  <small>Automatic, no setup — recommended</small>
                </span>
              </button>

              <button
                className={OPTION_BUTTON_CLASS}
                disabled={busy || !modes.disk}
                onClick={() => void pick('disk')}
              >
                <span className={OPTION_ICON_CLASS}>&#128193;</span>
                <span className={OPTION_LABEL_CLASS}>
                  <strong>Disk Persistence</strong>
                  <small>
                    {modes.disk
                      ? 'Save automatically into a file you choose'
                      : 'Not supported in this browser'}
                  </small>
                </span>
              </button>

              <button
                className={OPTION_BUTTON_CLASS}
                disabled={busy}
                onClick={() => void pick('memory')}
              >
                <span className={OPTION_ICON_CLASS}>&#128194;</span>
                <span className={OPTION_LABEL_CLASS}>
                  <strong>Import File without Persistence</strong>
                  <small>Open a .sceneplay file, export to save</small>
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 mx-6 text-xs font-semibold text-(--fd-text-muted) uppercase tracking-[0.5px]">
              Open a document
            </p>

            <div className="flex flex-col gap-2 px-6 pt-3">
              <button
                className={OPTION_BUTTON_CLASS}
                onClick={() => onModeChosen('browser')}
              >
                <span className={OPTION_ICON_CLASS}>&#43;</span>
                <span className={OPTION_LABEL_CLASS}>
                  <strong>New script</strong>
                  <small>Start a fresh document</small>
                </span>
              </button>

              {docs === null ? (
                <p className="py-2 text-[12px] text-(--fd-text-muted) m-0">
                  Loading…
                </p>
              ) : (
                docs.map((doc) => (
                  <button
                    key={doc.id}
                    className={OPTION_BUTTON_CLASS}
                    onClick={() => onModeChosen('browser', doc.id)}
                  >
                    <span className={OPTION_ICON_CLASS}>&#128196;</span>
                    <span className={OPTION_LABEL_CLASS}>
                      <strong>{doc.title}</strong>
                      <small>Edited {relativeTime(doc.updatedAt)}</small>
                    </span>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {error && (
          <p className="mt-3 mx-6 text-[12px] text-(--fd-danger,#ff6b6b) m-0">
            {error}
          </p>
        )}

        <p className="py-3.5 px-6 pb-5 text-[11px] text-(--fd-text-muted) m-0 [&_strong]:text-(--fd-text)">
          You can change this later from the <strong>File</strong> menu
        </p>
      </div>
    </div>
  )
}

export default StorageModeDialog
