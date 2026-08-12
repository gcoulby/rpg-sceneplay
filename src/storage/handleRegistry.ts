/**
 * Persistence for the active `FileSystemFileHandle`.
 *
 * A handle is structured-cloneable, so it goes straight into IndexedDB — this
 * survives a reload without re-picking the file. It does **not** survive losing
 * write permission (the browser drops that when the last tab for the origin
 * closes); re-granting needs a user gesture, which is handled in
 * `providers/diskHandleProvider.ts`, not here.
 */
import { idbGet, idbSet, idbDelete, STORES } from './idb'

const KEY = 'active-disk-handle'

export async function getStoredHandle(): Promise<FileSystemFileHandle | null> {
  try {
    return (await idbGet<FileSystemFileHandle>(STORES.handles, KEY)) ?? null
  } catch {
    return null
  }
}

export async function storeHandle(handle: FileSystemFileHandle): Promise<void> {
  await idbSet(STORES.handles, KEY, handle)
}

export async function clearStoredHandle(): Promise<void> {
  await idbDelete(STORES.handles, KEY)
}
