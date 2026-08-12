/**
 * Turning a screenplayImage node into pixels.
 *
 * Images live outside the document: the node carries `{ assetId, filename }` and
 * the bytes sit in IndexedDB (see `storage/assetStore`). A node may instead
 * carry an inline `src` data-URL, which is used for documents that had no id
 * yet when the image was inserted.
 *
 * Resolving an `assetId` mints an object URL that has to be revoked. Every
 * function here owns that lifecycle end-to-end, so callers never hold a URL they
 * have to remember to release.
 */
import { getAssetObjectUrl } from '@/storage/assetStore'

export interface ImageNodeAttrs {
  assetId?: string | null
  /** Legacy: the server-side project an asset belonged to. Ignored now. */
  projectId?: string | null
  filename?: string | null
  src?: string | null
}

/**
 * Resolve a node's attrs to a loadable URL plus the matching cleanup.
 *
 * `revoke()` is a no-op for a data-URL and releases the object URL for a stored
 * asset, so callers can always call it unconditionally.
 */
export async function resolveImageUrl(
  attrs: ImageNodeAttrs,
): Promise<{ url: string; revoke: () => void } | null> {
  if (attrs.assetId) {
    const url = await getAssetObjectUrl(attrs.assetId)
    if (url) return { url, revoke: () => URL.revokeObjectURL(url) }
  }
  if (attrs.src) return { url: attrs.src, revoke: () => {} }
  return null
}

/**
 * Load an image into a PNG data URL plus natural dimensions, via a canvas.
 * The blob is same-origin so the canvas isn't tainted.
 */
export async function loadImageData(
  attrs: ImageNodeAttrs,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  const loadable = await resolveImageUrl(attrs)
  if (!loadable) return null
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('image load failed'))
      img.src = loadable.url
    })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)
    return {
      dataUrl: canvas.toDataURL('image/png'),
      width: img.naturalWidth,
      height: img.naturalHeight,
    }
  } catch {
    return null
  } finally {
    loadable.revoke()
  }
}

/** Raw PNG bytes (for DOCX ImageRun) plus natural dimensions. */
export async function loadImageBytes(
  attrs: ImageNodeAttrs,
): Promise<{ data: Uint8Array; width: number; height: number } | null> {
  const d = await loadImageData(attrs)
  if (!d) return null
  const b64 = d.dataUrl.split(',')[1] || ''
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return { data: bytes, width: d.width, height: d.height }
}
