import { useEffect, useRef, useState } from 'react'
import {
  EventBus,
  PDFLinkService,
  PDFViewer as PdfjsViewer,
} from 'pdfjs-dist/web/pdf_viewer.mjs'
import { AnnotationEditorType, AnnotationMode } from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import { usePdfDocument } from './use-pdf-document'
import { useAnnotationSync } from './use-annotation-sync'
import PdfToolbar, { type PdfMode } from './pdf-toolbar'
import type { PdfEmbed } from '../types'

interface PdfViewerProps {
  embed: PdfEmbed
}

/** Owns a pdfjs `PDFViewer` instance for one `PdfEmbed`. Built directly on
 *  `pdfjs-dist/web/pdf_viewer.mjs` (not `react-pdf`, which doesn't expose
 *  the annotation editor layer) — the reference-viewer pattern Mozilla's own
 *  viewer uses. `PDFViewer` owns its DOM subtree and imperative API
 *  (`.setDocument()`, `.currentPageNumber`, `.currentScale`), so this
 *  component's job is bridging that to React state, not re-implementing it. */
export default function PdfViewer({ embed }: PdfViewerProps) {
  const { pdfDoc, error } = usePdfDocument(embed.assetRef)
  useAnnotationSync(pdfDoc, embed.id)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<PdfjsViewer | null>(null)
  const [mode, setMode] = useState<PdfMode>('fill')
  const [markupTool, setMarkupTool] = useState<number>(AnnotationEditorType.INK)
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 })
  const [scale, setScale] = useState(1)
  // True until the user manually zooms. While true, the container's own
  // ResizeObserver keeps re-fitting to 'page-width' — necessary because this
  // tab can mount while hidden (the outer MainTab uses `keepMounted`), so
  // `pagesinit`'s own page-width computation can run against a zero-size
  // container and lock in a nonsense scale that never gets a chance to
  // recompute once the tab actually becomes visible.
  const autoFitRef = useRef(true)
  // pdfjs only initializes its AnnotationEditorUIManager once page rendering
  // starts (`pagesinit`) — setting `annotationEditorMode` before that throws
  // "The AnnotationEditor is not enabled.", so the mode-toggle effect below
  // must wait for it rather than firing as soon as the viewer exists.
  const [viewerReady, setViewerReady] = useState(false)

  // Recreate the viewer whenever the resolved document changes — switching
  // tabs means switching documents, and the library isn't designed for
  // swapping documents on a live instance, only for updating pages within
  // the same one.
  useEffect(() => {
    const container = containerRef.current
    if (!pdfDoc || !container) return

    setViewerReady(false)
    container.innerHTML = ''
    const viewerDiv = document.createElement('div')
    viewerDiv.className = 'pdfViewer'
    container.appendChild(viewerDiv)

    const eventBus = new EventBus()
    const linkService = new PDFLinkService({ eventBus })
    const viewer = new PdfjsViewer({
      container,
      viewer: viewerDiv,
      eventBus,
      linkService,
      annotationMode: AnnotationMode.ENABLE_FORMS,
      annotationEditorMode: AnnotationEditorType.NONE,
    })
    linkService.setViewer(viewer)
    viewerRef.current = viewer

    const onPagesInit = () => {
      viewer.currentScaleValue = 'page-width'
      setViewerReady(true)
    }
    const onPageChanging = (evt: { pageNumber: number }) => {
      setPageInfo((s) => ({ ...s, current: evt.pageNumber }))
    }
    const onScaleChanging = (evt: { scale: number }) => {
      setScale(evt.scale)
    }
    eventBus.on('pagesinit', onPagesInit)
    eventBus.on('pagechanging', onPageChanging)
    eventBus.on('scalechanging', onScaleChanging)

    setPageInfo({ current: 1, total: pdfDoc.numPages })
    autoFitRef.current = true
    viewer.setDocument(pdfDoc)

    // Re-fit whenever the container's size actually changes — including the
    // 0 → real-size transition when this tab becomes visible after mounting
    // hidden, which `pagesinit` alone can't account for.
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {}
      if (!width || !height || !autoFitRef.current) return
      viewer.currentScaleValue = 'page-width'
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      eventBus.off('pagesinit', onPagesInit)
      eventBus.off('pagechanging', onPageChanging)
      eventBus.off('scalechanging', onScaleChanging)
      viewer.cleanup()
      viewerRef.current = null
    }
  }, [pdfDoc])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !viewerReady) return
    viewer.annotationEditorMode = {
      mode: mode === 'markup' ? markupTool : AnnotationEditorType.NONE,
    }
  }, [mode, markupTool, viewerReady])

  if (error) {
    return (
      <div className="flex justify-center items-center h-full text-destructive text-xs text-center">
        Couldn&apos;t load {embed.fileName}: {error}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PdfToolbar
        mode={mode}
        onModeChange={setMode}
        markupTool={markupTool}
        onMarkupToolChange={setMarkupTool}
        page={pageInfo.current}
        pageCount={pageInfo.total}
        onPageChange={(n) => {
          const viewer = viewerRef.current
          if (viewer) viewer.currentPageNumber = n
        }}
        scale={scale}
        onZoomIn={() => {
          autoFitRef.current = false
          const viewer = viewerRef.current
          if (viewer) viewer.currentScaleValue = String(viewer.currentScale * 1.1)
        }}
        onZoomOut={() => {
          autoFitRef.current = false
          const viewer = viewerRef.current
          if (viewer) viewer.currentScaleValue = String(viewer.currentScale / 1.1)
        }}
      />
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          className="absolute inset-0 bg-neutral-700 overflow-auto"
        />
      </div>
    </div>
  )
}
