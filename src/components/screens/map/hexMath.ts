import type { MapCoord } from './types'

/** Flat-top axial hex grid — radius is configurable per map in Map Settings,
 *  this is just the fallback for maps saved before that. */
export const DEFAULT_HEX_RADIUS = 5
export const HEX_SIZE = 32
export const HEX_RADIUS_MIN = 1
export const HEX_RADIUS_MAX = 20
/** Hexes are drawn smaller than their pitch (axialToPixel spacing) so a gap
 *  shows between neighbors — otherwise adjacent hexes share an edge and
 *  whichever one paints last "wins" that edge's color. */
export const HEX_DRAW_SIZE = HEX_SIZE * 0.9

export function hexCellId(q: number, r: number): string {
  return `${q},${r}`
}

export function axialToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_SIZE * 1.5 * q
  const y = HEX_SIZE * (Math.sqrt(3) / 2) * q + HEX_SIZE * Math.sqrt(3) * r
  return { x, y }
}

/** SVG polygon `points` string for a flat-top hex centered at (cx, cy). */
export function hexPolygonPoints(cx: number, cy: number, size: number = HEX_DRAW_SIZE): string {
  const points: string[] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i)
    points.push(
      `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`,
    )
  }
  return points.join(' ')
}

/** Ring distance from the center hex (0 = center), for ring-based border colors. */
export function hexRing(q: number, r: number): number {
  return (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2
}

export function generateHexCoords(radius: number = DEFAULT_HEX_RADIUS): MapCoord[] {
  const coords: MapCoord[] = []
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius)
    const r2 = Math.min(radius, -q + radius)
    for (let r = r1; r <= r2; r++) {
      coords.push({ q, r })
    }
  }
  return coords
}
