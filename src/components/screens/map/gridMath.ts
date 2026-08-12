import type { MapCoord } from './types'

/** Square grid: fixed bounds, no pan/zoom — the whole grid always fits on screen. */
export const GRID_COLUMNS = 12
export const GRID_ROWS = 12
export const GRID_CELL_SIZE = 48

export function gridCellId(x: number, y: number): string {
  return `${x},${y}`
}

export function gridToPixel(x: number, y: number): { x: number; y: number } {
  return { x: x * GRID_CELL_SIZE, y: y * GRID_CELL_SIZE }
}

export function generateGridCoords(): MapCoord[] {
  const coords: MapCoord[] = []
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLUMNS; x++) {
      coords.push({ x, y })
    }
  }
  return coords
}
