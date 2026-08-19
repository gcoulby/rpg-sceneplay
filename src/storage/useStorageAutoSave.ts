/**
 * The autosave loop for local-first storage.
 *
 * Saves are debounced: `notifyChange()` (called on every editor change)
 * schedules a write `DEBOUNCE_MS` after the last change, so a burst of
 * typing collapses into one write shortly after the user pauses rather than
 * a write per keystroke. A `MAX_WAIT_MS` cap forces a write during a long
 * unbroken typing session so changes are never held back indefinitely.
 *
 * A slower interval remains as a safety net for state that changes without
 * going through `notifyChange` (e.g. a store mutation from a panel that
 * doesn't call it), and a tab-hide listener flushes immediately so nothing
 * is lost when the user switches away.
 *
 * Skips when: the active mode is `memory` (manual-export by design),
 * autosave has paused after repeated failures, the editor is mid-script-
 * switch, a write is already in flight, or the content is byte-identical to
 * the last successful write.
 */
import { useCallback, useEffect, useRef } from 'react'
import { useBrowserStorageStatusStore } from '@/stores/browserStorageStatusStore'
import { useEditorStore } from '@/stores/editorStore'
import { getActiveMode, saveActiveDoc } from './storageManager'
import { docHasAnyText } from '@/utils/open-draft/docText'
import { hasSaveableCollections } from './saveContent'
import type { StorageDoc } from './types'

const DEBOUNCE_MS = 1_500
const MAX_WAIT_MS = 10_000
const SAFETY_NET_INTERVAL_MS = 10_000

export interface StorageAutoSaveOptions {
  buildDoc: () => StorageDoc | null
  scriptSwitchingRef: React.MutableRefObject<boolean>
}

export interface StorageAutoSaveApi {
  /** Call after any change that should eventually be persisted. Debounces
   *  the actual write — repeated calls push it out, up to MAX_WAIT_MS. */
  notifyChange: () => void
}

export function useStorageAutoSave(
  opts: StorageAutoSaveOptions,
): StorageAutoSaveApi {
  // The interval/timers below are set up once and must not be torn down
  // every time `buildDoc` gets a new identity, so the options are read
  // through a ref. The ref is refreshed in an effect rather than during
  // render — writing to it inline would be a render side effect.
  const optsRef = useRef(opts)
  useEffect(() => {
    optsRef.current = opts
  }, [opts])
  const lastSavedKeyRef = useRef('')
  const isWritingRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSinceRef = useRef<number | null>(null)

  const write = useCallback(async () => {
    if (getActiveMode() === 'memory') return // manual-export mode, by design
    if (useBrowserStorageStatusStore.getState().pausedByError) return
    if (optsRef.current.scriptSwitchingRef.current) return
    if (isWritingRef.current) return

    const doc = optsRef.current.buildDoc()
    if (!doc) return
    // A document is worth writing if it has prose OR real collection content
    // (e.g. an imported PDF, a character sheet) — not prose alone. See
    // `hasSaveableCollections`'s doc comment for why `docHasAnyText` on its
    // own isn't the right check here.
    if (!docHasAnyText(doc.content) && !hasSaveableCollections(doc.content))
      return

    const key = JSON.stringify(doc.content)
    if (key === lastSavedKeyRef.current) return

    isWritingRef.current = true
    const { saveStatus, setSaveStatus } = useEditorStore.getState()
    const hadUnsavedStatus = saveStatus === 'unsaved' || saveStatus === 'error'
    if (hadUnsavedStatus) setSaveStatus('saving')
    try {
      await saveActiveDoc(doc)
      lastSavedKeyRef.current = key
      if (hadUnsavedStatus) useEditorStore.getState().setSaveStatus('saved')
      useBrowserStorageStatusStore.getState().noteSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (hadUnsavedStatus) useEditorStore.getState().setSaveStatus('error', message)
      useBrowserStorageStatusStore.getState().noteFailure(message)
    } finally {
      isWritingRef.current = false
    }
  }, [])

  const flush = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    pendingSinceRef.current = null
    void write()
  }, [write])

  const notifyChange = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    const now = Date.now()
    if (pendingSinceRef.current === null) pendingSinceRef.current = now
    const elapsed = now - pendingSinceRef.current
    const wait = Math.min(DEBOUNCE_MS, Math.max(0, MAX_WAIT_MS - elapsed))

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      pendingSinceRef.current = null
      void write()
    }, wait)
  }, [write])

  useEffect(() => {
    const id = setInterval(() => void write(), SAFETY_NET_INTERVAL_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [write, flush])

  return { notifyChange }
}
