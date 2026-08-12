import { useMemo } from 'react'
import { useMapStore } from './useMapStore'
import { coordKey } from './coordKey'
import {
  DEFAULT_GRID_COLUMNS,
  DEFAULT_GRID_ROWS,
  GRID_CELL_SIZE,
  generateGridCoords,
  gridToPixel,
} from './gridMath'
import {
  DEFAULT_HEX_RADIUS,
  HEX_SIZE,
  generateHexCoords,
  axialToPixel,
  hexPolygonPoints,
  hexRing,
} from './hexMath'
import MapBackgroundImage from './MapBackgroundImage'
import MapCellImage from './MapCellImage'
import { MAP_ICONS_BY_KEY } from './mapIcons'
import type { MapCell, MapCoord, ProjectMap } from './types'

interface MapCanvasProps {
  map: ProjectMap
  onCellClick: (coord: MapCoord, event: React.MouseEvent) => void
}

/** Renders a hex or grid map and reports cell clicks — coordinate math lives
 *  in gridMath.ts / hexMath.ts, this component just lays the shapes out. */
export default function MapCanvas({ map, onCellClick }: MapCanvasProps) {
  const locationMapRefs = useMapStore((s) => s.locationMapRefs)
  const pendingLocationLink = useMapStore((s) => s.pendingLocationLink)

  const cellsByKey = useMemo(() => {
    const m = new Map<string, MapCell>()
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

  const cellClass = (hasImage: boolean, isFilled: boolean) =>
    hasImage
      ? 'fill-transparent stroke-primary hover:opacity-80'
      : isFilled
        ? 'fill-primary/20 stroke-primary hover:fill-primary/30'
        : pendingLocationLink
          ? 'fill-transparent stroke-border hover:fill-accent'
          : 'fill-transparent stroke-border hover:fill-muted'

  let content: React.ReactNode
  let width: number
  let height: number

  if (map.type === 'grid') {
    const columns = map.gridColumns ?? DEFAULT_GRID_COLUMNS
    const rows = map.gridRows ?? DEFAULT_GRID_ROWS
    const coords = generateGridCoords(columns, rows)
    width = columns * GRID_CELL_SIZE
    height = rows * GRID_CELL_SIZE

    content = (
      <svg viewBox={`0 0 ${width} ${height}`} className="relative block">
        {coords.map((coord) => {
          const key = coordKey('grid', coord)
          const { x, y } = gridToPixel(coord.x ?? 0, coord.y ?? 0)
          const cell = cellsByKey.get(key)
          const linkedLocations = locationsByKey.get(key)
          const icon = cell?.icon ? MAP_ICONS_BY_KEY[cell.icon] : undefined
          const cx = x + GRID_CELL_SIZE / 2
          const iconY = cell?.label ? y + 15 : y + GRID_CELL_SIZE / 2
          const labelY = icon ? y + 39 : y + GRID_CELL_SIZE / 2
          return (
            <g
              key={key}
              onClick={(e) => onCellClick(coord, e)}
              className="cursor-pointer"
            >
              {cell?.imageAssetId && (
                <MapCellImage
                  assetId={cell.imageAssetId}
                  x={x}
                  y={y}
                  width={GRID_CELL_SIZE}
                  height={GRID_CELL_SIZE}
                />
              )}
              <rect
                x={x}
                y={y}
                width={GRID_CELL_SIZE}
                height={GRID_CELL_SIZE}
                className={cellClass(!!cell?.imageAssetId, !!cell)}
                strokeWidth={1}
              />
              {icon && (
                <icon.Icon
                  x={cx - 9}
                  y={iconY - 9}
                  size={18}
                  className="fill-foreground pointer-events-none"
                />
              )}
              {cell?.label && (
                <text
                  x={cx}
                  y={labelY}
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
  } else {
    const radius = map.hexRadius ?? DEFAULT_HEX_RADIUS
    const hexCoords = generateHexCoords(radius)
    const pixels = hexCoords.map((c) => axialToPixel(c.q ?? 0, c.r ?? 0))
    const minX = Math.min(...pixels.map((p) => p.x)) - HEX_SIZE
    const maxX = Math.max(...pixels.map((p) => p.x)) + HEX_SIZE
    const minY = Math.min(...pixels.map((p) => p.y)) - HEX_SIZE
    const maxY = Math.max(...pixels.map((p) => p.y)) + HEX_SIZE
    width = maxX - minX
    height = maxY - minY

    content = (
      <svg
        viewBox={`${minX} ${minY} ${width} ${height}`}
        className="relative block"
      >
        {hexCoords.map((coord, i) => {
          const key = coordKey('hex', coord)
          const { x, y } = pixels[i]
          const cell = cellsByKey.get(key)
          const linkedLocations = locationsByKey.get(key)
          const clipId = `hexclip-${key}`
          const icon = cell?.icon ? MAP_ICONS_BY_KEY[cell.icon] : undefined
          const iconY = cell?.label ? y - 8 : y
          const labelY = icon ? y + 16 : y
          const ringColor = map.ringColors?.[hexRing(coord.q ?? 0, coord.r ?? 0)]
          return (
            <g
              key={key}
              onClick={(e) => onCellClick(coord, e)}
              className="cursor-pointer"
            >
              {cell?.imageAssetId && (
                <>
                  <clipPath id={clipId}>
                    <polygon points={hexPolygonPoints(x, y)} />
                  </clipPath>
                  <MapCellImage
                    assetId={cell.imageAssetId}
                    x={x - HEX_SIZE}
                    y={y - HEX_SIZE}
                    width={HEX_SIZE * 2}
                    height={HEX_SIZE * 2}
                    clipPathId={clipId}
                  />
                </>
              )}
              <polygon
                points={hexPolygonPoints(x, y)}
                className={cellClass(!!cell?.imageAssetId, !!cell)}
                style={!cell && ringColor ? { stroke: ringColor } : undefined}
                strokeWidth={1}
              />
              {icon && (
                <icon.Icon
                  x={x - 9}
                  y={iconY - 9}
                  size={18}
                  className="fill-foreground pointer-events-none"
                />
              )}
              {cell?.label && (
                <text
                  x={x}
                  y={labelY}
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

  return (
    <div className="relative" style={{ width, height }}>
      {map.background && <MapBackgroundImage background={map.background} />}
      {content}
    </div>
  )
}
