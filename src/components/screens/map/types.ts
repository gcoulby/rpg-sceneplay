export type MapType = 'hex' | 'grid'

export interface MapCoord {
  // grid: x, y
  // hex: q, r (axial)
  x?: number
  y?: number
  q?: number
  r?: number
}

export interface MapCell {
  id: string
  coord: MapCoord
  label?: string
  notes?: string
  featureId?: string
  /** Asset id of an image that fills this cell — lets people build custom maps
   *  out of hand-drawn/generated tiles instead of just labels. */
  imageAssetId?: string
}

export interface MapBackground {
  assetId: string
  fit: 'cover' | 'contain'
  /** Percent, like CSS background-position (0-100). */
  posX: number
  posY: number
  /** Percent zoom applied to the image, 100 = actual size. */
  scale: number
}

export interface ProjectMap {
  id: string
  type: MapType
  cells: MapCell[]
  /** Grid layout size — undefined falls back to the gridMath defaults. */
  gridColumns?: number
  gridRows?: number
  /** Hex layout size (rings around center) — undefined falls back to the hexMath default. */
  hexRadius?: number
  background?: MapBackground
}

export interface MapRef {
  mapId: string
  coord: MapCoord
}
