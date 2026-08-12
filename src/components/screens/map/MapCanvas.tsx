import { useMemo } from 'react'
import { useMapStore } from './useMapStore'
import { coordKey } from './coordKey'
import {
  GRID_CELL_SIZE,
  generateGridCoords,
  gridToPixel,
} from './gridMath'
import { HEX_SIZE, generateHexCoords, axialToPixel, hexPolygonPoints } from './hexMath'
import type { MapCoord, ProjectMap } from './types'

interface MapCanvasProps {
  map: ProjectMap
  onCellClick: (coord: MapCoord) => void
}

/** Renders a hex or grid map and reports cell clicks — coordinate math lives
 *  in gridMath.ts / hexMath.ts, this component just lays the shapes out. */
export default function MapCanvas({ map, onCellClick }: MapCanvasProps) {
  const locationMapRefs = useMapStore((s) => s.locationMapRefs)
  const pendingLocationLink = useMapStore((s) => s.pendingLocationLink)

  const cellsByKey = useMemo(() => {
    const m = new Map<string, (typeof map.cells)[number]>()
    for (const cell of map.cells) m.set(coordKey(map.type, cell.coord), cell)
    return m
  }, [map])

  const locationsByKey = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const [name, ref] of Object.entries(locationMapRefs)) {
      if (ref.mapId !== map.id) continue
      const key = coordKey(map.type, ref.coord)
      const list = m.get(key) ?? []
      list.push(name)
      m.set(key, list)
    }
    return m
  }, [locationMapRefs, map.id, map.type])

  if (map.type === 'grid') {
    const coords = generateGridCoords()
    const width = coords.reduce((max, c) => Math.max(max, (c.x ?? 0) + 1), 0) * GRID_CELL_SIZE
    const height = coords.reduce((max, c) => Math.max(max, (c.y ?? 0) + 1), 0) * GRID_CELL_SIZE

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full max-h-full"
        style={{ width, height }}
      >
        {coords.map((coord) => {
          const key = coordKey('grid', coord)
          const { x, y } = gridToPixel(coord.x ?? 0, coord.y ?? 0)
          const cell = cellsByKey.get(key)
          const linkedLocations = locationsByKey.get(key)
          return (
            <g
              key={key}
              onClick={() => onCellClick(coord)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={y}
                width={GRID_CELL_SIZE}
                height={GRID_CELL_SIZE}
                className={
                  cell
                    ? 'fill-primary/20 stroke-primary hover:fill-primary/30'
                    : pendingLocationLink
                      ? 'fill-transparent stroke-border hover:fill-accent'
                      : 'fill-transparent stroke-border hover:fill-muted'
                }
                strokeWidth={1}
              />
              {cell?.label && (
                <text
                  x={x + GRID_CELL_SIZE / 2}
                  y={y + GRID_CELL_SIZE / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground pointer-events-none select-none"
                  fontSize={9}
                >
                  {cell.label.slice(0, 10)}
                </text>
              )}
              {linkedLocations && linkedLocations.length > 0 && (
                <circle
                  cx={x + GRID_CELL_SIZE - 8}
                  cy={y + 8}
                  r={4}
                  className="fill-accent-foreground pointer-events-none"
                >
                  <title>{linkedLocations.join(', ')}</title>
                </circle>
              )}
            </g>
          )
        })}
      </svg>
    )
  }

  // Hex
  const hexCoords = generateHexCoords()
  const pixels = hexCoords.map((c) => axialToPixel(c.q ?? 0, c.r ?? 0))
  const minX = Math.min(...pixels.map((p) => p.x)) - HEX_SIZE
  const maxX = Math.max(...pixels.map((p) => p.x)) + HEX_SIZE
  const minY = Math.min(...pixels.map((p) => p.y)) - HEX_SIZE
  const maxY = Math.max(...pixels.map((p) => p.y)) + HEX_SIZE
  const width = maxX - minX
  const height = maxY - minY

  return (
    <svg
      viewBox={`${minX} ${minY} ${width} ${height}`}
      className="max-w-full max-h-full"
      style={{ width, height }}
    >
      {hexCoords.map((coord, i) => {
        const key = coordKey('hex', coord)
        const { x, y } = pixels[i]
        const cell = cellsByKey.get(key)
        const linkedLocations = locationsByKey.get(key)
        return (
          <g key={key} onClick={() => onCellClick(coord)} className="cursor-pointer">
            <polygon
              points={hexPolygonPoints(x, y)}
              className={
                cell
                  ? 'fill-primary/20 stroke-primary hover:fill-primary/30'
                  : pendingLocationLink
                    ? 'fill-transparent stroke-border hover:fill-accent'
                    : 'fill-transparent stroke-border hover:fill-muted'
              }
              strokeWidth={1}
            />
            {cell?.label && (
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground pointer-events-none select-none"
                fontSize={8}
              >
                {cell.label.slice(0, 8)}
              </text>
            )}
            {linkedLocations && linkedLocations.length > 0 && (
              <circle
                cx={x + HEX_SIZE - 10}
                cy={y - HEX_SIZE + 10}
                r={4}
                className="fill-accent-foreground pointer-events-none"
              >
                <title>{linkedLocations.join(', ')}</title>
              </circle>
            )}
          </g>
        )
      })}
    </svg>
  )
}
