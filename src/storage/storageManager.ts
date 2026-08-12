/**
 * Holds the active storage provider and remembers the chosen mode across
 * reloads (in IndexedDB's `meta` store, never localStorage).
 *
 * Default mode is always `browser` — `disk`/`memory` are only ever entered
 * explicitly, because both need a user gesture to acquire a file.
 */
import type { StorageDoc, StorageMode, StorageProvider } from './types'
import {
  diskHandleProvider,
  supportsDiskPersistence,
} from './providers/diskHandleProvider'
import { memoryProvider } from './providers/memoryProvider'
import { indexedDbProvider } from './providers/indexedDbProvider'
import { idbGet, idbSet, STORES, supportsIndexedDb } from './idb'

const MODE_KEY = 'active-storage-mode'
const providers: Record<StorageMode, StorageProvider> = {
  disk: diskHandleProvider,
  memory: memoryProvider,
  browser: indexedDbProvider,
}
let activeMode: StorageMode = 'browser'

export function getActiveMode(): StorageMode {
  return activeMode
}
export function getActiveProvider(): StorageProvider {
  return providers[activeMode]
}
export function getProvider(mode: StorageMode): StorageProvider {
  return providers[mode]
}

export function availableModes(): Record<StorageMode, boolean> {
  return {
    disk: supportsDiskPersistence(),
    memory: true,
    browser: supportsIndexedDb(),
  }
}

async function getPersistedMode(): Promise<StorageMode | null> {
  try {
    return (await idbGet<StorageMode>(STORES.meta, MODE_KEY)) ?? null
  } catch {
    return null
  }
}
async function setPersistedMode(mode: StorageMode): Promise<void> {
  try {
    await idbSet(STORES.meta, MODE_KEY, mode)
  } catch {
    /* mode dialog just reappears next launch */
  }
}

export interface BootStatus {
  mode: StorageMode
  needsDiskReconnect: boolean
  isFirstRun: boolean
}

export async function restoreStorageOnBoot(): Promise<BootStatus> {
  const persisted = await getPersistedMode()
  const isFirstRun = persisted === null
  activeMode = persisted ?? 'browser'
  let needsDiskReconnect = false
  if (activeMode === 'disk') {
    const result = await diskHandleProvider.restore()
    needsDiskReconnect = result === 'needs-permission' || result === 'none'
  } else if (activeMode === 'browser') {
    await indexedDbProvider.connect()
  }
  return { mode: activeMode, needsDiskReconnect, isFirstRun }
}

export async function chooseMode(
  mode: StorageMode,
  suggestedTitle?: string,
): Promise<boolean> {
  const ok = await providers[mode].connect(suggestedTitle)
  if (!ok) return false
  activeMode = mode
  await setPersistedMode(mode)
  return true
}

/** Disk Persistence's "Open Existing File" — as opposed to `chooseMode('disk',
 *  …)`, which always creates/overwrites via `showSaveFilePicker`. */
export async function openExistingDiskFile(): Promise<StorageDoc | null> {
  const doc = await diskHandleProvider.open()
  if (!doc) return null
  activeMode = 'disk'
  await setPersistedMode('disk')
  return doc
}

/**
 * "Save As"-style mode switch: acquire the new provider WITHOUT loading
 * whatever it's already holding, so the caller can write the document
 * that's currently open into it — as opposed to `chooseMode`, which
 * `restoreStorageOnBoot`/the first-run dialog follow with a load that would
 * otherwise clobber the in-progress document.
 *
 * `memory` needs no acquisition step at all: there's nothing to pick, it's
 * just "stop auto-saving, hold the document in memory from here on."
 */
export async function switchModeKeepingDoc(
  mode: StorageMode,
  suggestedTitle?: string,
): Promise<boolean> {
  if (mode === 'memory') {
    activeMode = 'memory'
    await setPersistedMode('memory')
    return true
  }
  return chooseMode(mode, suggestedTitle)
}

export async function reconnectDisk(): Promise<boolean> {
  const ok = await diskHandleProvider.reconnect()
  if (ok) activeMode = 'disk'
  return ok
}

export async function saveActiveDoc(doc: StorageDoc): Promise<void> {
  await getActiveProvider().save(doc)
}
export async function loadActiveDoc(id?: string): Promise<StorageDoc | null> {
  return getActiveProvider().load(id)
}
