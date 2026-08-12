/**
 * "Disk Persistence" — automatic saving straight into a file the user picked,
 * draw.io-style.
 *
 * Chromium-only: `showSaveFilePicker`/`showOpenFilePicker` don't exist in
 * Firefox or Safari. That's a real browser gap, not something to polyfill
 * around.
 *
 * Two behaviours come with the platform rather than being design choices:
 *   1. Write permission needs a fresh user gesture after a reload — it can't be
 *      silently re-escalated from a timer.
 *   2. Writes must be serialized through one queue, so two overlapping autosave
 *      ticks can't interleave into the same file.
 */
import type { StorageDoc, StorageDocSummary, StorageProvider } from '../types'
import {
  serializeOdraft,
  parseOdraftLoose,
  SCENEPLAY_EXTENSION,
  type ScriptMeta,
} from '../formats/sceneplayFormat'
import {
  getStoredHandle,
  storeHandle,
  clearStoredHandle,
} from '../handleRegistry'
import { collectAssetRefs, packAssets } from '../assetStore'
import type { OdraftAsset } from '../formats/sceneplayFormat'

export function supportsDiskPersistence(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window
}

type PermissionState = 'granted' | 'prompt' | 'denied' | 'unknown'

class DiskHandleProvider implements StorageProvider {
  readonly mode = 'disk' as const
  readonly label = 'Disk Persistence'
  private handle: FileSystemFileHandle | null = null
  private permission: PermissionState = 'unknown'
  private writeChain: Promise<void> = Promise.resolve()
  /** Last packed asset set, keyed by the ids it covers. In disk mode the file IS
   *  the storage, so images have to be embedded or they break on reload — but
   *  base64-encoding every image on every 10s tick is wasteful, and the set only
   *  changes when an image is added or removed. */
  private packedCache: { key: string; assets: OdraftAsset[] } | null = null

  private async assetsFor(
    doc: StorageDoc,
  ): Promise<{ assets: OdraftAsset[]; truncated: boolean }> {
    if (doc.assets && doc.assets.length > 0)
      return { assets: doc.assets, truncated: false }
    const key = collectAssetRefs(doc.content)
      .map((r) => r.id)
      .sort()
      .join(',')
    if (!key) return { assets: [], truncated: false }
    if (this.packedCache?.key === key)
      return { assets: this.packedCache.assets, truncated: false }
    const packed = await packAssets(doc.content)
    this.packedCache = { key, assets: packed.assets }
    return packed
  }

  isReady(): boolean {
    return this.handle !== null && this.permission === 'granted'
  }
  hasHandle(): boolean {
    return this.handle !== null
  }
  get filename(): string | null {
    return this.handle?.name ?? null
  }
  async list(): Promise<StorageDocSummary[]> {
    return []
  }

  async restore(): Promise<'granted' | 'needs-permission' | 'none'> {
    const stored = await getStoredHandle()
    if (!stored) return 'none'
    this.handle = stored
    this.permission = await this.queryPermission()
    return this.permission === 'granted' ? 'granted' : 'needs-permission'
  }

  async reconnect(): Promise<boolean> {
    if (!this.handle) return false
    const granted = await this.requestPermission()
    this.permission = granted ? 'granted' : 'denied'
    return granted
  }

  async connect(suggestedTitle?: string): Promise<boolean> {
    if (!supportsDiskPersistence()) return false
    try {
      const picker = (window as any).showSaveFilePicker as (
        opts: any,
      ) => Promise<FileSystemFileHandle>
      const handle = await picker({
        suggestedName: `${suggestedTitle || 'Untitled'}.${SCENEPLAY_EXTENSION}`,
        types: [
          {
            description: 'Sceneplay',
            accept: { 'application/json': [`.${SCENEPLAY_EXTENSION}`] },
          },
        ],
      })
      this.handle = handle
      this.permission = 'granted'
      await storeHandle(handle)
      return true
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return false
      throw err
    }
  }

  disconnect(): void {
    this.handle = null
    this.permission = 'unknown'
    void clearStoredHandle()
  }

  async open(): Promise<StorageDoc | null> {
    if (!supportsDiskPersistence()) return null
    try {
      const picker = (window as any).showOpenFilePicker as (
        opts: any,
      ) => Promise<FileSystemFileHandle[]>
      const [handle] = await picker({
        types: [
          {
            description: 'Sceneplay',
            accept: {
              'application/json': [`.${SCENEPLAY_EXTENSION}`, '.odraft'],
            },
          },
        ],
      })
      this.handle = handle
      this.permission = 'granted'
      await storeHandle(handle)
      return this.load()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      throw err
    }
  }

  async load(): Promise<StorageDoc | null> {
    if (!this.handle) return null
    const file = await this.handle.getFile()
    const text = await file.text()
    const parsed = parseOdraftLoose(text)
    return {
      id: this.handle.name,
      meta: parsed.meta,
      content: parsed.content,
      assets: parsed.assets,
      updatedAt: new Date(file.lastModified).toISOString(),
    }
  }

  async save(doc: StorageDoc): Promise<void> {
    if (!this.handle) throw new Error('No file connected for disk save')
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      this.permission = granted ? 'granted' : 'denied'
      if (!granted) throw new Error('Write permission was not granted')
    }
    const meta: ScriptMeta = {
      id: doc.id,
      title: doc.meta.title,
      author: doc.meta.author,
      format: 'json',
      created_at: '',
      updated_at: doc.updatedAt,
      page_count: doc.meta.page_count,
      size_bytes: 0,
      color: doc.meta.color,
      pinned: false,
      sort_order: 0,
      preview: '',
    } as ScriptMeta
    const { assets, truncated } = await this.assetsFor(doc)
    const text = serializeOdraft(meta, doc.content, {
      assets,
      assetsOmitted: truncated,
      exportedAt: doc.updatedAt,
    })
    const handle = this.handle
    this.writeChain = this.writeChain.then(async () => {
      const writable = await handle.createWritable()
      await writable.write(text)
      await writable.close()
    })
    await this.writeChain
  }

  private async queryPermission(): Promise<PermissionState> {
    if (!this.handle) return 'unknown'
    try {
      return await (this.handle as any).queryPermission({ mode: 'readwrite' })
    } catch {
      return 'unknown'
    }
  }
  private async requestPermission(): Promise<boolean> {
    if (!this.handle) return false
    try {
      return (
        (await (this.handle as any).requestPermission({
          mode: 'readwrite',
        })) === 'granted'
      )
    } catch {
      return false
    }
  }
}

export const diskHandleProvider = new DiskHandleProvider()
