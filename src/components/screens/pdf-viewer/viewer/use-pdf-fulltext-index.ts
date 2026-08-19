import { useEffect, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'

export interface PdfPageText {
  page: number
  text: string
}

interface UsePdfFulltextIndexResult {
  pages: PdfPageText[]
  loading: boolean
}

const cache = new WeakMap<PDFDocumentProxy, PdfPageText[]>()

/** Extracts every page's plain text once per `pdfDoc`, for the PDF Tools
 *  sidebar's full-text search tab. Cached by `PDFDocumentProxy` identity
 *  (stable per `usePdfDocument`'s own ref-counted cache) so switching to the
 *  Search tab and back — or reopening the sidebar — doesn't re-extract. */
export function usePdfFulltextIndex(
  pdfDoc: PDFDocumentProxy | null,
): UsePdfFulltextIndexResult {
  const [pages, setPages] = useState<PdfPageText[]>(
    () => (pdfDoc && cache.get(pdfDoc)) ?? [],
  )
  const [loading, setLoading] = useState(false)

  // Reset synchronously when `pdfDoc` changes — adjusted during render
  // (React's sanctioned pattern for this) rather than at the top of the
  // effect below, which would commit the previous document's pages for one
  // render before correcting itself.
  const [trackedPdfDoc, setTrackedPdfDoc] = useState(pdfDoc)
  if (pdfDoc !== trackedPdfDoc) {
    setTrackedPdfDoc(pdfDoc)
    const cached = pdfDoc ? cache.get(pdfDoc) : undefined
    setPages(cached ?? [])
    setLoading(!!pdfDoc && !cached)
  }

  useEffect(() => {
    if (!pdfDoc || cache.has(pdfDoc)) return
    let cancelled = false

    void (async () => {
      const extracted: PdfPageText[] = []
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (cancelled) return
        const page = await pdfDoc.getPage(i)
        if (cancelled) return
        const content = await page.getTextContent()
        const text = content.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
        extracted.push({ page: i, text })
      }
      if (cancelled) return
      cache.set(pdfDoc, extracted)
      setPages(extracted)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [pdfDoc])

  return { pages, loading }
}
