import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PDFDocumentProxy } from 'pdfjs-dist'

interface PdfPageBrowserProps {
  pdfDoc: PDFDocumentProxy
  currentPage: number
  onSelect: (page: number) => void
}

/** Thumbnail grid for jumping to a page, reusing the same low-scale
 *  `page.render()` approach as the import flow's page picker — but against
 *  the already-loaded `pdfDoc` instead of re-parsing a `File`, since the
 *  viewer has one loaded anyway. */
export default function PdfPageBrowser({
  pdfDoc,
  currentPage,
  onSelect,
}: PdfPageBrowserProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const container = containerRef.current
      if (!container) return
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (cancelled) break
        const canvas = container.querySelector<HTMLCanvasElement>(
          `canvas[data-page="${i}"]`,
        )
        if (!canvas) continue
        const page = await pdfDoc.getPage(i)
        if (cancelled) return
        const viewport = page.getViewport({ scale: 0.25 })
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        if (!ctx) continue
        await page.render({ canvas, canvasContext: ctx, viewport }).promise
      }
      if (!cancelled) setRendered(true)
    })()

    return () => {
      cancelled = true
    }
  }, [pdfDoc])

  useEffect(() => {
    if (!rendered) return
    containerRef.current
      ?.querySelector(`[data-page-button="${currentPage}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [rendered, currentPage])

  return (
    <div
      ref={containerRef}
      className="gap-2 grid grid-cols-3 p-1 max-h-96 overflow-y-auto"
    >
      {Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          data-page-button={n}
          onClick={() => onSelect(n)}
          className={cn(
            'flex flex-col items-center gap-1 p-1 rounded border transition-colors',
            n === currentPage
              ? 'border-ring bg-accent'
              : 'border-transparent hover:border-(--fd-border)',
          )}
        >
          <canvas data-page={n} className="bg-white shadow-sm w-full h-auto" />
          <span className="text-(--fd-text-muted) text-[10px]">p. {n}</span>
        </button>
      ))}
    </div>
  )
}
