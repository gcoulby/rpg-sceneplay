/**
 * The autosave loop for local-first storage.
 *
 * Ticks on an interval and on tab-hide. Skips when: the active mode is `memory`
 * (manual-export by design), autosave has paused after repeated failures, the
 * editor is mid-script-switch, a write is already in flight, or the content is
 * byte-identical to the last successful write.
 */
import { useEffect, useRef } from 'react'
import { useBrowserStorageStatusStore } from '@/stores/browserStorageStatusStore'
import { getActiveMode, saveActiveDoc } from './storageManager'
import { docHasAnyText } from '@/utils/open-draft/docText'
import type { StorageDoc } from './types'

const AUTOSAVE_INTERVAL_MS = 10_000

export interface StorageAutoSaveOptions {
  buildDoc: () => StorageDoc | null
  scriptSwitchingRef: React.MutableRefObject<boolean>
}

export function useStorageAutoSave(opts: StorageAutoSaveOptions): void {
  // The interval below is set up once and must not be torn down every time
  // `buildDoc` gets a new identity, so the options are read through a ref. The
  // ref is refreshed in an effect rather than during render — writing to it
  // inline would be a render side effect.
  const optsRef = useRef(opts)
  useEffect(() => {
    optsRef.current = opts
  }, [opts])
  const lastSavedKeyRef = useRef('')
  const isWritingRef = useRef(false)

  useEffect(() => {
    const tick = async () => {
      if (getActiveMode() === 'memory') return // manual-export mode, by design
      if (useBrowserStorageStatusStore.getState().pausedByError) return
      if (optsRef.current.scriptSwitchingRef.current) return
      if (isWritingRef.current) return

      const doc = optsRef.current.buildDoc()
      if (!doc || !docHasAnyText(doc.content)) return

      const key = JSON.stringify(doc.content)
      if (key === lastSavedKeyRef.current) return

      isWritingRef.current = true
      try {
        await saveActiveDoc(doc)
        lastSavedKeyRef.current = key
        useBrowserStorageStatusStore.getState().noteSuccess()
      } catch (err) {
        useBrowserStorageStatusStore
          .getState()
          .noteFailure(err instanceof Error ? err.message : String(err))
      } finally {
        isWritingRef.current = false
      }
    }

    const id = setInterval(() => void tick(), AUTOSAVE_INTERVAL_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') void tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
}
