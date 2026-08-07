import { useCallback, type RefObject } from 'react'
import { calculatePageScrollTop } from '../../../utils/scrollCalculations'

interface PageOverlay {
  pageNumber: number
  top: number
}

interface PageLayout {
  bottomMargin: number
}

interface UseGoToPageArgs {
  editorMainRef: RefObject<HTMLElement | null>
  pageRef: RefObject<HTMLElement | null>
  overlays: PageOverlay[]
  zoomLevelRef: RefObject<number>
  pageLayoutRef: RefObject<PageLayout>
}

export function useGoToPage({
  editorMainRef,
  pageRef,
  overlays,
  zoomLevelRef,
  pageLayoutRef,
}: UseGoToPageArgs) {
  return useCallback(
    (page: number) => {
      if (!editorMainRef?.current || !pageRef?.current) return

      if (page <= 1) {
        editorMainRef.current.scrollTo({ top: 0, behavior: 'auto' })
        return
      }

      const overlay = overlays.find((o) => o.pageNumber === page)
      if (!overlay) return

      const pageRect = pageRef.current.getBoundingClientRect()
      const containerRect = editorMainRef.current.getBoundingClientRect()

      const scrollTo = calculatePageScrollTop(
        overlay,
        pageLayoutRef.current,
        zoomLevelRef.current,
        pageRect.top,
        containerRect.top,
        editorMainRef.current.scrollTop,
      )

      editorMainRef.current.scrollTo({ top: scrollTo, behavior: 'auto' })
    },
    [overlays, editorMainRef, pageRef, zoomLevelRef, pageLayoutRef],
  )
}
