/**
 * Minimal promise wrapper around IndexedDB.
 *
 * One database, five object stores. No external dependency (no idb/dexie) —
 * every store here is single-key get/put, so a library isn't worth the weight.
 *
 * Deliberately **not** localStorage anywhere in this module: its 5–10MB cap is
 * unusable once a document has embedded images.
 */

const DB_NAME = 'opendraft-browser-storage'
const DB_VERSION = 1

export const STORES = {
  documents: 'documents',
  assets: 'assets',
  templates: 'templates',
  handles: 'handles',
  meta: 'meta',
} as const
export type StoreName = (typeof STORES)[keyof typeof STORES]

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      for (const name of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () =>
      reject(new Error('IndexedDB upgrade blocked by another open tab'))
  })
  return dbPromise
}

function wrapRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function idbGet<T>(
  store: StoreName,
  key: IDBValidKey,
): Promise<T | undefined> {
  const db = await openDb()
  return wrapRequest(
    db.transaction(store, 'readonly').objectStore(store).get(key),
  )
}

export async function idbSet(
  store: StoreName,
  key: IDBValidKey,
  value: unknown,
): Promise<void> {
  const db = await openDb()
  await wrapRequest(
    db.transaction(store, 'readwrite').objectStore(store).put(value, key),
  )
}

export async function idbDelete(
  store: StoreName,
  key: IDBValidKey,
): Promise<void> {
  const db = await openDb()
  await wrapRequest(
    db.transaction(store, 'readwrite').objectStore(store).delete(key),
  )
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDb()
  return wrapRequest(
    db.transaction(store, 'readonly').objectStore(store).getAll(),
  )
}

export function supportsIndexedDb(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

/** Best-effort — ask the browser not to evict this origin's storage under
 *  disk pressure. Chromium and Firefox support it, Safari doesn't. Never
 *  block on this or surface a failure. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
