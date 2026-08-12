/**
 * "Browser" — the default. No picker, no permission dance; works the moment the
 * app loads.
 */
import type { StorageDoc, StorageDocSummary, StorageProvider } from '../types'
import {
  idbGet,
  idbSet,
  idbDelete,
  idbGetAll,
  STORES,
  requestPersistentStorage,
} from '../idb'

interface StoredDocRow extends StorageDoc {
  sizeBytes: number
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID()
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

class IndexedDbProvider implements StorageProvider {
  readonly mode = 'browser' as const
  readonly label = 'Browser'
  private persistRequested = false

  isReady(): boolean {
    return true
  }
  async connect(): Promise<boolean> {
    if (!this.persistRequested) {
      this.persistRequested = true
      void requestPersistentStorage()
    }
    return true
  }
  disconnect(): void {}

  async list(): Promise<StorageDocSummary[]> {
    const rows = await idbGetAll<StoredDocRow>(STORES.documents)
    return rows
      .map((r) => ({
        id: r.id,
        title: r.meta.title || 'Untitled',
        updatedAt: r.updatedAt,
        sizeBytes: r.sizeBytes,
      }))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
  }

  async load(id?: string): Promise<StorageDoc | null> {
    if (!id) return null
    return (await idbGet<StoredDocRow>(STORES.documents, id)) ?? null
  }

  async save(doc: StorageDoc): Promise<void> {
    const id = doc.id || uuid()
    const sizeBytes = new Blob([JSON.stringify(doc.content)]).size
    await idbSet(STORES.documents, id, { ...doc, id, sizeBytes })
  }

  async remove(id: string): Promise<void> {
    await idbDelete(STORES.documents, id)
  }
  newId(): string {
    return uuid()
  }
}

export const indexedDbProvider = new IndexedDbProvider()
