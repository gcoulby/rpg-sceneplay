interface PageOverlay {
  pageNumber: number
  top: number
}

interface PageLayout {
  bottomMargin: number
}

const PAGE_SEP_GAP = 40

export function calculatePageScrollTop(
  overlay: PageOverlay,
  pageLayout: PageLayout,
  zoomLevel: number,
  pageTop: number,
  containerTop: number,
  containerScrollTop: number,
): number {
  const scale = (zoomLevel || 100) / 100
  const bottomMarginPx = (pageLayout.bottomMargin / 72) * 96
  const pageTopOffset = overlay.top + bottomMarginPx + PAGE_SEP_GAP

  return containerScrollTop + (pageTop + pageTopOffset * scale - containerTop)
}
