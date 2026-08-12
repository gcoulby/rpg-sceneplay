/**
 * Local asset storage.
 *
 * Images used to be uploaded to the backend and referenced from the document by
 * `{ assetId, projectId, filename }`, with the URL resolved by the server. With
 * no server the bytes live in IndexedDB's `assets` store, as `Blob`s — IndexedDB
 * stores blobs natively, so nothing is base64-encoded for storage. Base64 is
 * only used when embedding assets into an exported `.sceneplay`, where the file
 * has to be self-contained.
 *
 * Assets are scoped to the document that owns them (`docId`), matching what the
 * old `projectId` scoping did for the asset manager's listing.
 *
 * ## Object-URL lifecycle
 *
 * `getAssetObjectUrl` mints a *new* `URL.createObjectURL` on every call, and the
 * caller owns it. Mirror the pattern in `ScreenplayImageView`: create it inside
 * an effect, revoke it in that effect's cleanup. `useAssetUrl` below does
 * exactly that and is the preferred entry point for components.
 */
import { useEffect, useState } from 'react'
import { idbGet, idbSet, idbDelete, idbGetAll, STORES } from './idb'
import type { OdraftAsset } from './formats/sceneplayFormat'

/** Metadata half of a stored asset — what the asset manager lists. */
export interface AssetMeta {
  id: string
  /** Document that owns this asset; null for one that predates scoping. */
  docId: string | null
  filename: string
  original_name: string
  mime_type: string
  size_bytes: number
  tags: string[]
  created_at: string
}

/** A row in the `assets` object store: metadata plus the bytes. */
export interface StoredAsset extends AssetMeta {
  blob: Blob
}

/** Default ceiling on embedded image bytes per exported file. */
export const DEFAULT_ASSET_CAP_BYTES = 25 * 1024 * 1024

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID()
  return `asset-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// ── Read / write ────────────────────────────────────────────────────────────

/** Put a blob into the assets store under `id`, preserving existing metadata
 *  when the row already exists (used by the import path, which knows the id). */
export async function saveAsset(
  id: string,
  blob: Blob,
  meta: Partial<AssetMeta> = {},
): Promise<StoredAsset> {
  const existing = await idbGet<StoredAsset>(STORES.assets, id)
  const row: StoredAsset = {
    id,
    docId: meta.docId ?? existing?.docId ?? null,
    filename: meta.filename ?? existing?.filename ?? id,
    original_name: meta.original_name ?? existing?.original_name ?? id,
    mime_type: meta.mime_type ?? existing?.mime_type ?? blob.type,
    size_bytes: blob.size,
    tags: meta.tags ?? existing?.tags ?? [],
    created_at: existing?.created_at ?? new Date().toISOString(),
    blob,
  }
  await idbSet(STORES.assets, id, row)
  return row
}

/** Store a picked/dropped File and return its record. Replaces the backend's
 *  `uploadAsset`. */
export async function addAssetFile(
  file: File,
  opts: { docId?: string | null; tags?: string[] } = {},
): Promise<StoredAsset> {
  return saveAsset(uuid(), file, {
    docId: opts.docId ?? null,
    filename: file.name,
    original_name: file.name,
    mime_type: file.type || 'application/octet-stream',
    tags: opts.tags ?? [],
  })
}

export async function getAsset(id: string): Promise<StoredAsset | undefined> {
  return idbGet<StoredAsset>(STORES.assets, id)
}

/**
 * A fresh object URL for the asset's bytes, or null when it isn't stored.
 * **The caller must revoke it** — see the lifecycle note at the top of the file.
 */
export async function getAssetObjectUrl(id: string): Promise<string | null> {
  const row = await getAsset(id)
  if (!row?.blob) return null
  return URL.createObjectURL(row.blob)
}

/** Asset metadata, without the blobs. Pass a `docId` to scope the list. */
export async function listAssets(docId?: string | null): Promise<AssetMeta[]> {
  const rows = await idbGetAll<StoredAsset>(STORES.assets)
  return rows
    .filter((r) => (docId ? r.docId === docId : true))
    .map(({ blob: _blob, ...meta }) => meta)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export async function removeAsset(id: string): Promise<void> {
  await idbDelete(STORES.assets, id)
}

export async function setAssetTags(id: string, tags: string[]): Promise<void> {
  const row = await getAsset(id)
  if (!row) return
  await idbSet(STORES.assets, id, { ...row, tags })
}

// ── React binding ───────────────────────────────────────────────────────────

/**
 * Resolve an asset id to an object URL for the lifetime of the component.
 *
 * Same shape as the blob-fetch effect in `ScreenplayImageView`: the URL is
 * created in the effect and revoked in its cleanup, so nothing leaks when the
 * component unmounts or the id changes.
 */
export function useAssetUrl(id: string | null | undefined): string {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!id) return
    let objectUrl: string | null = null
    let cancelled = false
    void (async () => {
      const resolved = await getAssetObjectUrl(id)
      if (!resolved) return
      objectUrl = resolved
      if (cancelled) URL.revokeObjectURL(resolved)
      else setUrl(resolved)
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      // Clear the state too: the URL above has just been revoked, so leaving it
      // in place would hand the caller a dead blob: URL.
      setUrl('')
    }
  }, [id])
  return url
}

/**
 * Resolve many asset ids at once, for components that need a synchronous
 * `(id) => url` accessor to hand to children. Every URL is revoked together
 * when the set of ids changes or the component unmounts.
 */
export function useAssetUrls(ids: string[]): Record<string, string> {
  const key = ids.join(',')
  const [urls, setUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    const wanted = key ? key.split(',') : []
    const created: string[] = []
    let cancelled = false
    void (async () => {
      const next: Record<string, string> = {}
      for (const id of wanted) {
        const url = await getAssetObjectUrl(id)
        if (!url) continue
        created.push(url)
        next[id] = url
      }
      if (cancelled) created.forEach((u) => URL.revokeObjectURL(u))
      else setUrls(next)
    })()
    return () => {
      cancelled = true
      created.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [key])
  return urls
}

// ── Embedding into an exported file ─────────────────────────────────────────
//
// Ported from the deleted `services/snapshotAssets.ts`. Base64-encoding the
// referenced assets into the exported JSON is the only thing that makes an
// exported file portable — without it a document opened elsewhere comes back
// with every image broken.

interface AssetRef {
  id: string
  filename: string
}

function addRef(
  out: Map<string, AssetRef>,
  id: unknown,
  filename: unknown,
): void {
  if (typeof id !== 'string' || !id) return
  if (out.has(id)) return
  out.set(id, {
    id,
    filename: typeof filename === 'string' && filename ? filename : id,
  })
}

/**
 * Every asset the payload references: inline screenplay images, title-page
 * images, and character-profile images.
 */
export function collectAssetRefs(
  content: Record<string, unknown> | null | undefined,
): AssetRef[] {
  const out = new Map<string, AssetRef>()
  if (!content) return []

  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const n = node as { attrs?: Record<string, unknown>; content?: unknown[] }
    if (n.attrs) addRef(out, n.attrs.assetId, n.attrs.filename)
    if (Array.isArray(n.content)) n.content.forEach(walk)
  }
  walk(content)

  // Character profiles keep their portraits as the same asset rows.
  const profiles = content._characterProfiles
  if (Array.isArray(profiles)) {
    for (const p of profiles) {
      const images = (p as Record<string, unknown>)?.images
      if (!Array.isArray(images)) continue
      for (const img of images) {
        if (typeof img === 'string') addRef(out, img, undefined)
        else if (img && typeof img === 'object') {
          const rec = img as Record<string, unknown>
          addRef(out, rec.assetId ?? rec.id, rec.filename)
        }
      }
    }
  }

  // The project map's background image and any per-cell images.
  const map = content._map
  if (map && typeof map === 'object') {
    const m = map as Record<string, unknown>
    const background = m.background
    if (background && typeof background === 'object') {
      addRef(out, (background as Record<string, unknown>).assetId, undefined)
    }
    const cells = m.cells
    if (Array.isArray(cells)) {
      for (const cell of cells) {
        const rec = cell as Record<string, unknown>
        addRef(out, rec.imageAssetId, undefined)
      }
    }
  }

  return Array.from(out.values())
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000 // chunked so a large image can't blow the call stack
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

function mimeFor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'svg') return 'image/svg+xml'
  return 'application/octet-stream'
}

/**
 * Read and base64-encode the assets a payload references, stopping at
 * `capBytes`.
 *
 * An asset that can't be read is skipped and marks the result truncated — an
 * export missing one image is far better than a failed export.
 */
export async function packAssets(
  content: Record<string, unknown> | null | undefined,
  capBytes: number = DEFAULT_ASSET_CAP_BYTES,
): Promise<{ assets: OdraftAsset[]; truncated: boolean }> {
  const refs = collectAssetRefs(content)
  const assets: OdraftAsset[] = []
  let total = 0
  let truncated = false

  for (const ref of refs) {
    try {
      const row = await getAsset(ref.id)
      if (!row?.blob) {
        truncated = true
        continue
      }
      const bytes = new Uint8Array(await row.blob.arrayBuffer())
      if (total + bytes.byteLength > capBytes) {
        truncated = true
        break
      }
      total += bytes.byteLength
      assets.push({
        id: ref.id,
        filename: row.original_name || ref.filename,
        mime_type: row.mime_type || mimeFor(ref.filename),
        data_base64: toBase64(bytes),
      })
    } catch (err) {
      console.warn('[assets] could not read asset', ref.id, err)
      truncated = true
    }
  }

  return { assets, truncated }
}

/**
 * Decode embedded assets back into the store, preserving their ids so the
 * imported document's references still resolve. Failures are logged, not
 * thrown: an imported script with a missing image beats a failed import.
 */
export async function unpackAssets(
  assets: OdraftAsset[] | undefined,
  docId: string | null,
): Promise<number> {
  if (!assets || assets.length === 0) return 0
  let restored = 0
  for (const asset of assets) {
    try {
      const bytes = fromBase64(asset.data_base64)
      const mime = asset.mime_type || mimeFor(asset.filename)
      await saveAsset(asset.id, new Blob([bytes as BlobPart], { type: mime }), {
        docId,
        filename: asset.filename,
        original_name: asset.filename,
        mime_type: mime,
      })
      restored++
    } catch (err) {
      console.warn('[assets] could not restore asset', asset.id, err)
    }
  }
  return restored
}
