import { useEffect, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { getAsset } from '@/storage/assetStore'
import { pdfjsLib } from '../pdfjsSetup'

interface CacheEntry {
  loadingTask: ReturnType<typeof pdfjsLib.getDocument>
  docPromise: Promise<PDFDocumentProxy>
  refCount: number
}

/** Loaded `PDFDocumentProxy`s, keyed by asset id, so switching inner tabs and
 *  back doesn't re-parse the PDF — parsing isn't free, and the tab bar
 *  allows arbitrary switching. Ref-counted so the underlying pdfjs resources
 *  (`loadingTask.destroy()`) are released once nothing references them. */
const cache = new Map<string, CacheEntry>()

async function acquire(assetRef: string): Promise<PDFDocumentProxy> {
  let entry = cache.get(assetRef)
  if (!entry) {
    const row = await getAsset(assetRef)
    if (!row?.blob) throw new Error('PDF asset not found in storage')
    const data = await row.blob.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data })
    entry = { loadingTask, docPromise: loadingTask.promise, refCount: 0 }
    cache.set(assetRef, entry)
  }
  entry.refCount++
  return entry.docPromise
}

function release(assetRef: string): void {
  const entry = cache.get(assetRef)
  if (!entry) return
  entry.refCount--
  if (entry.refCount <= 0) {
    cache.delete(assetRef)
    void entry.loadingTask.destroy()
  }
}

interface UsePdfDocumentResult {
  pdfDoc: PDFDocumentProxy | null
  error: string | null
}

/** Resolves a `PdfEmbed.assetRef` to a loaded `PDFDocumentProxy`. */
export function usePdfDocument(assetRef: string): UsePdfDocumentResult {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [error, setError] = useState<string | null>(null)

  // `assetRef` is stable for the lifetime of `pdf-viewer.tsx`'s own usage
  // (keyed by embed id, so switching embeds remounts rather than passing a
  // new assetRef into the same instance) — but the PDF Tools sidebar keeps
  // one long-lived instance and re-resolves `assetRef` as the user switches
  // PDFs in the main tab, including down to `''` when nothing's active. So
  // this genuinely needs a reset-on-change, adjusted during render (React's
  // sanctioned pattern for that) rather than a synchronous setState at the
  // top of the effect below, which would commit a stale doc for one render
  // first.
  const [trackedAssetRef, setTrackedAssetRef] = useState(assetRef)
  if (assetRef !== trackedAssetRef) {
    setTrackedAssetRef(assetRef)
    setPdfDoc(null)
    setError(null)
  }

  useEffect(() => {
    if (!assetRef) return
    let cancelled = false
    acquire(assetRef)
      .then((doc) => {
        if (!cancelled) {
          setPdfDoc(doc)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
        }
      })
    return () => {
      cancelled = true
      release(assetRef)
    }
  }, [assetRef])

  return { pdfDoc, error }
}
