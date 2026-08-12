/**
 * Ambient state for automatic local saves: which mode is active, when the last
 * write landed, what went wrong if one didn't, and whether autosave has given
 * up.
 *
 * The anti-nagging rule lives here, mirroring `backupStatusStore`. A failed
 * autosave must never block the editor or repeat a toast every interval.
 * Callers toast on the FIRST failure, stay quiet for the next two, and on the
 * third `pausedByError` goes true, which stops the autosave loop until the user
 * reconnects or saves manually.
 */
import { create } from 'zustand'
import type { StorageMode } from '@/storage/types'

/** Consecutive failures after which automatic saving stops trying. */
export const AUTOSAVE_FAILURE_LIMIT = 3

interface BrowserStorageStatusState {
  mode: StorageMode
  lastSavedAt: number | null
  lastError: string | null
  consecutiveFailures: number
  /** True once autosave has stopped trying; cleared by resume(). */
  pausedByError: boolean
  /** True when a stored disk handle exists but write permission has lapsed —
   *  re-granting needs a user gesture, so the UI must offer a button. */
  needsDiskReconnect: boolean

  setMode: (mode: StorageMode) => void
  setNeedsDiskReconnect: (needs: boolean) => void
  noteSuccess: () => void
  /** Returns the new consecutive-failure count so callers can decide to toast. */
  noteFailure: (message: string) => number
  /** Clear the failure state — a reconnect or a successful manual save. */
  resume: () => void
}

export const useBrowserStorageStatusStore = create<BrowserStorageStatusState>(
  (set, get) => ({
    mode: 'browser',
    lastSavedAt: null,
    lastError: null,
    consecutiveFailures: 0,
    pausedByError: false,
    needsDiskReconnect: false,

    setMode: (mode) => set({ mode }),
    setNeedsDiskReconnect: (needsDiskReconnect) => set({ needsDiskReconnect }),

    noteSuccess: () =>
      set({
        lastSavedAt: Date.now(),
        lastError: null,
        consecutiveFailures: 0,
        pausedByError: false,
      }),

    noteFailure: (message) => {
      const failures = get().consecutiveFailures + 1
      set({
        lastError: message,
        consecutiveFailures: failures,
        pausedByError: failures >= AUTOSAVE_FAILURE_LIMIT,
      })
      return failures
    },

    resume: () =>
      set({ consecutiveFailures: 0, pausedByError: false, lastError: null }),
  }),
)
