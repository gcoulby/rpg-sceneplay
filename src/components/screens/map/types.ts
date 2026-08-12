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
}

export interface ProjectMap {
  id: string
  type: MapType
  cells: MapCell[]
}

export interface MapRef {
  mapId: string
  coord: MapCoord
}
