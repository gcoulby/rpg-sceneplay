import type { CSSProperties } from 'react'

/** Figure out which insertion slot the pointer is over, in a multi-column
    grid — cards are grouped into rows by comparing bounding-box tops, then
    the closest gap within that row is picked by horizontal position. Only
    makes sense when there's more than one column; see calcListInsertIndex
    for the single-column case, where horizontal position is meaningless. */
export function calcGridInsertIndex(
  gridEl: HTMLElement,
  clientX: number,
  clientY: number,
): number | null {
  const cards = gridEl.querySelectorAll('.index-card')
  if (cards.length === 0) return null

  const rects: DOMRect[] = []
  cards.forEach((card) => rects.push(card.getBoundingClientRect()))

  const rows: Array<{ indices: number[]; top: number; bottom: number }> = []
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i]
    const lastRow = rows[rows.length - 1]
    if (
      lastRow &&
      Math.abs(r.top - rects[lastRow.indices[0]].top) < r.height / 2
    ) {
      lastRow.indices.push(i)
      lastRow.bottom = Math.max(lastRow.bottom, r.bottom)
    } else {
      rows.push({ indices: [i], top: r.top, bottom: r.bottom })
    }
  }

  let rowIdx = rows.length - 1
  if (clientY < rows[0].top) {
    rowIdx = 0
  } else {
    for (let r = 0; r < rows.length; r++) {
      const midBottom =
        r + 1 < rows.length ? (rows[r].bottom + rows[r + 1].top) / 2 : Infinity
      if (clientY < midBottom) {
        rowIdx = r
        break
      }
    }
  }

  const row = rows[rowIdx]
  const rowCardIndices = row.indices

  const lastInRow = rects[rowCardIndices[rowCardIndices.length - 1]]
  if (clientX > lastInRow.right) {
    return rowCardIndices[rowCardIndices.length - 1] + 1
  }

  const firstInRow = rects[rowCardIndices[0]]
  if (clientX < firstInRow.left) {
    return rowCardIndices[0]
  }

  for (let i = 0; i < rowCardIndices.length; i++) {
    const cardIdx = rowCardIndices[i]
    const r = rects[cardIdx]
    const cardCenter = r.left + r.width / 2
    if (clientX < cardCenter) {
      return cardIdx
    }
  }

  return rowCardIndices[rowCardIndices.length - 1] + 1
}

/** Figure out which insertion slot the pointer is over, in a single-column
    list — purely a matter of which card's vertical midpoint the cursor is
    above or below, like reordering slides in a slide-sorter list view.
    Horizontal position is irrelevant here on purpose. */
export function calcListInsertIndex(
  gridEl: HTMLElement,
  clientY: number,
): number | null {
  const cards = gridEl.querySelectorAll('.index-card')
  if (cards.length === 0) return null

  for (let i = 0; i < cards.length; i++) {
    const r = cards[i].getBoundingClientRect()
    const mid = r.top + r.height / 2
    if (clientY < mid) return i
  }
  return cards.length
}

/** Thin vertical drop-line between cards in the same grid row, or at the
    start/end of an adjacent row. Grid layout only. */
export function getGridInsertIndicatorStyle(
  gridEl: HTMLElement,
  dragIdx: number,
  insertIdx: number,
  totalScenes: number,
): CSSProperties | null {
  const effectiveTo =
    dragIdx < insertIdx && insertIdx <= totalScenes - 1
      ? insertIdx - 1
      : insertIdx
  if (effectiveTo === dragIdx) return null

  const cards = gridEl.querySelectorAll('.index-card')
  if (cards.length === 0) return null

  const gridRect = gridEl.getBoundingClientRect()
  const rects: DOMRect[] = []
  cards.forEach((card) => rects.push(card.getBoundingClientRect()))

  let x: number, y: number, height: number

  if (insertIdx === 0) {
    x = rects[0].left - gridRect.left - 3
    y = rects[0].top - gridRect.top
    height = rects[0].height
  } else if (insertIdx >= rects.length) {
    x = rects[rects.length - 1].right - gridRect.left
    y = rects[rects.length - 1].top - gridRect.top
    height = rects[rects.length - 1].height
  } else {
    const prev = rects[insertIdx - 1]
    const curr = rects[insertIdx]
    if (Math.abs(prev.top - curr.top) < prev.height / 2) {
      x = (prev.right + curr.left) / 2 - gridRect.left - 1
      y = curr.top - gridRect.top
      height = curr.height
    } else {
      x = curr.left - gridRect.left - 3
      y = curr.top - gridRect.top
      height = curr.height
    }
  }

  return {
    position: 'absolute',
    left: x,
    top: y,
    width: 3,
    height,
    pointerEvents: 'none',
    zIndex: 50,
  }
}

/** Thin horizontal drop-line between cards, positioned at the midpoint
    gap above/below the relevant card(s). Single-column layout only. */
export function getListInsertIndicatorStyle(
  gridEl: HTMLElement,
  dragIdx: number,
  insertIdx: number,
  totalScenes: number,
): CSSProperties | null {
  const effectiveTo =
    dragIdx < insertIdx && insertIdx <= totalScenes - 1
      ? insertIdx - 1
      : insertIdx
  if (effectiveTo === dragIdx) return null

  const cards = gridEl.querySelectorAll('.index-card')
  if (cards.length === 0) return null

  const gridRect = gridEl.getBoundingClientRect()
  const rects: DOMRect[] = []
  cards.forEach((card) => rects.push(card.getBoundingClientRect()))

  let y: number
  if (insertIdx <= 0) {
    y = rects[0].top - gridRect.top
  } else if (insertIdx >= rects.length) {
    y = rects[rects.length - 1].bottom - gridRect.top
  } else {
    const prev = rects[insertIdx - 1]
    const curr = rects[insertIdx]
    y = (prev.bottom + curr.top) / 2 - gridRect.top
  }

  return {
    position: 'absolute',
    left: 0,
    right: 0,
    top: y - 1.5,
    height: 3,
    pointerEvents: 'none',
    zIndex: 50,
  }
}
