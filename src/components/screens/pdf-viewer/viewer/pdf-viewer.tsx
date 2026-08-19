import { useEffect, useRef, useState } from 'react'
import {
  EventBus,
  PDFFindController,
  PDFLinkService,
  PDFViewer as PdfjsViewer,
} from 'pdfjs-dist/web/pdf_viewer.mjs'
import { AnnotationEditorType, AnnotationMode } from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import './pdf-viewer-overrides.css'
import { usePdfDocument } from './use-pdf-document'
import { useAnnotationSync } from './use-annotation-sync'
import { usePdfSearch } from './use-pdf-search'
import PdfToolbar, { type PdfMode } from './pdf-toolbar'
import PdfSearchBar from './pdf-search-bar'
import { extractGoogleRollFormula } from './google-roll-link'
import { useRollNoteStore } from '@/stores/rollNoteStore'
import { usePdfViewerStore } from '../store/usePdfViewerStore'
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
  useAnnotationSync(pdfDoc, embed.id, embed.assetRef)

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
  // Bridged to React state (rather than kept only in a ref) so `usePdfSearch`
  // can re-subscribe its eventBus listeners whenever the viewer is recreated.
  const [eventBus, setEventBus] = useState<EventBus | null>(null)
  const [findController, setFindController] = useState<PDFFindController | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const search = usePdfSearch(eventBus, findController)
  const pageJumpRequest = usePdfViewerStore((s) => s.pageJumpRequest)

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

    const newEventBus = new EventBus()
    const linkService = new PDFLinkService({ eventBus: newEventBus })
    const newFindController = new PDFFindController({
      eventBus: newEventBus,
      linkService,
    })
    const viewer = new PdfjsViewer({
      container,
      viewer: viewerDiv,
      eventBus: newEventBus,
      linkService,
      findController: newFindController,
      annotationMode: AnnotationMode.ENABLE_FORMS,
      annotationEditorMode: AnnotationEditorType.NONE,
    })
    linkService.setViewer(viewer)
    // `PDFViewer.setDocument()` below does NOT propagate to the link
    // service — that's a separate call the app owns (unlike the find
    // controller, which `PDFViewer.setDocument()` does forward to since it
    // was passed in as `findController` above). Without it,
    // `linkService.goToDestination()` silently no-ops (`if
    // (!this.pdfDocument) return`) on every in-document link click: the
    // click reaches pdfjs's own handler fine, it just has no document to
    // resolve the destination against.
    linkService.setDocument(pdfDoc)
    viewerRef.current = viewer
    const eventBus = newEventBus
    setEventBus(newEventBus)
    setFindController(newFindController)

    const onPagesInit = () => {
      viewer.currentScaleValue = 'page-width'
      setViewerReady(true)
    }
    const onPageChanging = (evt: { pageNumber: number }) => {
      setPageInfo((s) => ({ ...s, current: evt.pageNumber }))
      // Only mirror while this embed is the one the sidebar cares about —
      // switching away leaves the last-shown page's number stale otherwise,
      // which would misreport what the (now hidden) tab is showing.
      if (usePdfViewerStore.getState().activeEmbedId === embed.id) {
        usePdfViewerStore.getState().setActivePage(evt.pageNumber)
      }
    }
    const onScaleChanging = (evt: { scale: number }) => {
      setScale(evt.scale)
    }
    eventBus.on('pagesinit', onPagesInit)
    eventBus.on('pagechanging', onPageChanging)
    eventBus.on('scalechanging', onScaleChanging)

    // Hijack "roll this on Google" links (a common pattern in TTRPG PDFs)
    // to open the app's own dice roller instead of navigating away. Runs in
    // the capture phase so it intercepts before the annotation layer's own
    // `<a>` follows its href.
    const handleLinkClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest?.('a[href]')
      const href = anchor?.getAttribute('href')
      if (!href) return
      const formula = extractGoogleRollFormula(href)
      if (!formula) return
      event.preventDefault()
      event.stopPropagation()
      useRollNoteStore.getState().requestDiceRoll(formula)
    }
    container.addEventListener('click', handleLinkClick, true)

    setPageInfo({ current: 1, total: pdfDoc.numPages })
    if (usePdfViewerStore.getState().activeEmbedId === embed.id) {
      usePdfViewerStore.getState().setActivePage(1)
    }
    autoFitRef.current = true
    viewer.setDocument(pdfDoc)

    // Fit once, the first time the container has a real (non-zero) size —
    // covers the tab-mounts-hidden case, where `pagesinit`'s own page-width
    // computation ran against a zero-size container and locked in a nonsense
    // scale. Deliberately fires only once: `currentScaleValue = 'page-width'`
    // is recomputed relative to whichever page is currently scrolled into
    // view, and this document's pages aren't all the same aspect ratio (a
    // portrait cover vs. landscape two-page spreads) — re-fitting on every
    // subsequent resize (scrollbar toggling, page virtualization) would keep
    // snapping the scale to whatever page happens to be in view at that
    // moment, making the zoom jump around and look "distorted" as the user
    // scrolls.
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? {}
      if (!width || !height || !autoFitRef.current) return
      viewer.currentScaleValue = 'page-width'
      autoFitRef.current = false
      resizeObserver.disconnect()
    })
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      container.removeEventListener('click', handleLinkClick, true)
      eventBus.off('pagesinit', onPagesInit)
      eventBus.off('pagechanging', onPageChanging)
      eventBus.off('scalechanging', onScaleChanging)
      viewer.cleanup()
      viewerRef.current = null
      setEventBus(null)
      setFindController(null)
    }
  }, [pdfDoc, embed.id])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || !viewerReady) return
    viewer.annotationEditorMode = {
      mode: mode === 'markup' ? markupTool : AnnotationEditorType.NONE,
    }
  }, [mode, markupTool, viewerReady])

  // Lets the PDF Tools sidebar (outside this component's tree) jump this
  // embed's viewer to a page, via `usePdfViewerStore.requestPageJump`. When
  // the request also carries `highlightText` (the Search tab's exact
  // matched substring), briefly flash just that one occurrence — dispatching
  // `find` with `highlightAll: false` highlights only the current match
  // (not every occurrence on the page), then `findbarclose` 5s later clears
  // it back out, since this is a "look, right here" pointer rather than an
  // open-ended search session.
  useEffect(() => {
    if (!pageJumpRequest || pageJumpRequest.embedId !== embed.id) return
    const viewer = viewerRef.current
    if (viewer) viewer.currentPageNumber = pageJumpRequest.page
    if (!pageJumpRequest.highlightText || !eventBus) return

    eventBus.dispatch('find', {
      source: findController,
      type: '',
      query: pageJumpRequest.highlightText,
      caseSensitive: false,
      entireWord: false,
      highlightAll: false,
      findPrevious: false,
      matchDiacritics: true,
    })
    const clearTimer = setTimeout(() => {
      eventBus.dispatch('findbarclose', { source: findController })
    }, 5000)
    return () => clearTimeout(clearTimer)
  }, [pageJumpRequest, embed.id, eventBus, findController])

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
        onZoomChange={(percent) => {
          autoFitRef.current = false
          const viewer = viewerRef.current
          if (viewer) viewer.currentScaleValue = String(percent / 100)
        }}
        searchOpen={searchOpen}
        onToggleSearch={() => {
          if (searchOpen) search.close()
          setSearchOpen((s) => !s)
        }}
      />
      {searchOpen && (
        <PdfSearchBar
          search={search}
          onClose={() => {
            search.close()
            setSearchOpen(false)
          }}
        />
      )}
      <div className="relative flex-1 min-h-0">
        <div
          ref={containerRef}
          className="absolute inset-0 bg-neutral-700 overflow-auto"
        />
      </div>
    </div>
  )
}
