import type { MapCoord, MapType } from './types'
import { gridCellId } from './gridMath'
import { hexCellId } from './hexMath'

/** Stable string key for a coordinate, independent of map type — used to find/dedupe cells. */
export function coordKey(type: MapType, coord: MapCoord): string {
  return type === 'grid'
    ? gridCellId(coord.x ?? 0, coord.y ?? 0)
    : hexCellId(coord.q ?? 0, coord.r ?? 0)
}
