import type { MapCoord } from './types'

/** Square grid: bounded (no infinite pan) — size is configurable per map in
 *  Map Settings, these are just the fallback for maps saved before that. */
export const DEFAULT_GRID_COLUMNS = 12
export const DEFAULT_GRID_ROWS = 12
export const GRID_CELL_SIZE = 48
export const GRID_SIZE_MIN = 3
export const GRID_SIZE_MAX = 40

export function gridCellId(x: number, y: number): string {
  return `${x},${y}`
}

export function gridToPixel(x: number, y: number): { x: number; y: number } {
  return { x: x * GRID_CELL_SIZE, y: y * GRID_CELL_SIZE }
}

export function generateGridCoords(
  columns: number = DEFAULT_GRID_COLUMNS,
  rows: number = DEFAULT_GRID_ROWS,
): MapCoord[] {
  const coords: MapCoord[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      coords.push({ x, y })
    }
  }
  return coords
}
