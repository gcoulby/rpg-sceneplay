import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorStore } from '@/stores/editorStore'
import { computePageBlocks, type PageContentInfo } from '@/editor/pagination'
import { useGoToScene } from '../utils/useGoToScene'
import PageThumbnail from './PageThumbnail'
import { LINE_HEIGHT_PX, FD_INDENTS, SPACE_BEFORE } from './pageThumbnailLayout'
import { ScrollArea } from '@/components/ui/scroll-area'

interface PagesPanelProps {
  editor: Editor | null
  scrollContainer?: HTMLDivElement | null
}

const PagesPanel: React.FC<PagesPanelProps> = ({ editor, scrollContainer }) => {
  const pageLayout = useEditorStore((s) => s.pageLayout)
  const fontFamily = useEditorStore((s) => s.fontFamily)
  const fontSize = useEditorStore((s) => s.fontSize)
  const { goToPosition } = useGoToScene(editor, scrollContainer)

  const pageGridRef = useRef<HTMLDivElement>(null)
  const [thumbScale, setThumbScale] = useState(0.35)
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1)

  const [docVersion, setDocVersion] = useState(0)
  useEffect(() => {
    if (!editor) return
    const handleUpdate = () => setDocVersion((v) => v + 1)
    editor.on('update', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor])

  const pageContent = useMemo((): PageContentInfo[] => {
    if (!editor) return []
    void docVersion
    return computePageBlocks(editor.state.doc, pageLayout)
  }, [editor, pageLayout, docVersion])

  const refWidthPx = useMemo(
    () => pageLayout.pageWidth * 96,
    [pageLayout.pageWidth],
  )

  const pageContentStyle = useMemo(
    (): React.CSSProperties => ({
      width: `${refWidthPx}px`,
      paddingTop: `${pageLayout.topMargin}pt`,
      paddingBottom: `${pageLayout.bottomMargin}pt`,
      paddingLeft: `${pageLayout.leftMargin}in`,
      paddingRight: `${pageLayout.rightMargin}in`,
      fontFamily: `'${fontFamily}', 'Courier New', Courier, monospace`,
      fontSize: `${fontSize}pt`,
      lineHeight: `${LINE_HEIGHT_PX}px`,
    }),
    [refWidthPx, pageLayout, fontFamily, fontSize],
  )

  const getBlockStyle = useCallback(
    (typeName: string, isFirst: boolean): React.CSSProperties => {
      const [left, right] = FD_INDENTS[typeName] || [1.5, 7.5]
      const padL = Math.max(0, (left - pageLayout.leftMargin) * 96)
      const padR = Math.max(
        0,
        (pageLayout.pageWidth - right - pageLayout.rightMargin) * 96,
      )
      const sb = isFirst ? 0 : (SPACE_BEFORE[typeName] ?? 0)
      return {
        paddingLeft: padL > 0 ? `${padL}px` : undefined,
        paddingRight: padR > 0 ? `${padR}px` : undefined,
        marginTop: sb > 0 ? `${sb * LINE_HEIGHT_PX}px` : undefined,
      }
    },
    [pageLayout],
  )
  useEffect(() => {
    if (!pageGridRef.current) return
    const grid = pageGridRef.current
    const observer = new ResizeObserver(() => {
      const firstThumb = grid.querySelector('.page-thumbnail') as HTMLElement
      if (firstThumb) {
        setThumbScale(Math.max(0.05, firstThumb.clientWidth / refWidthPx))
      }
    })
    observer.observe(grid)
    return () => observer.disconnect()
  }, [pageContent.length, refWidthPx])

  useEffect(() => {
    if (!scrollContainer || !editor || pageContent.length === 0) return

    let rafId = 0
    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const rect = scrollContainer.getBoundingClientRect()
        const viewY = rect.top + rect.height / 3
        try {
          const pos = editor.view.posAtCoords({
            left: rect.left + rect.width / 2,
            top: viewY,
          })
          if (!pos) return
          let page = 1
          for (let i = pageContent.length - 1; i >= 0; i--) {
            if (
              pageContent[i].blocks.length > 0 &&
              pageContent[i].blocks[0].docPos <= pos.pos
            ) {
              page = pageContent[i].pageNumber
              break
            }
          }
          if (page !== currentVisiblePage) {
            setCurrentVisiblePage(page)
            const thumbEl = pageGridRef.current?.querySelector(
              `[data-page="${page}"]`,
            ) as HTMLElement
            if (thumbEl)
              thumbEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          }
        } catch {
          /* editor coords may not be available */
        }
      })
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // initial sync
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [scrollContainer, editor, pageContent, currentVisiblePage])

  const handlePageClick = useCallback(
    (page: PageContentInfo, e: React.MouseEvent<HTMLDivElement>) => {
      if (!editor || page.blocks.length === 0) return
      const contentEl = e.currentTarget.querySelector(
        '.page-thumb-content',
      ) as HTMLElement
      if (!contentEl) return
      const children = Array.from(contentEl.children) as HTMLElement[]
      const clickY = e.clientY
      let bestIdx = 0
      let bestDist = Infinity
      children.forEach((child, idx) => {
        const rect = child.getBoundingClientRect()
        const mid = rect.top + rect.height / 2
        const dist = Math.abs(clickY - mid)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = idx
        }
      })
      const block = page.blocks[bestIdx]
      if (block) goToPosition(block.docPos)
    },
    [editor, goToPosition],
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-3.5 py-2 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)">
          Pages
        </span>
        <span className="text-xs text-(--fd-text) opacity-70">
          {pageContent.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto" ref={pageGridRef}>
        {pageContent.length === 0 ? (
          <div className="p-6 px-4 text-(--fd-text) opacity-70 text-[13px] italic text-center">
            No pages yet. Start writing to see page previews.
          </div>
        ) : (
          <ScrollArea className="w-full h-[calc(var(--app-h)-3dvh)]">
            <div className="flex flex-col justify-center items-center px-2 py-1.5">
              {pageContent.map((page, pageIdx) => (
                <PageThumbnail
                  key={page.pageNumber}
                  page={page}
                  isActive={page.pageNumber === currentVisiblePage}
                  isLast={pageIdx === pageContent.length - 1}
                  contentStyle={pageContentStyle}
                  thumbScale={thumbScale}
                  getBlockStyle={getBlockStyle}
                  onClick={handlePageClick}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

export default PagesPanel
