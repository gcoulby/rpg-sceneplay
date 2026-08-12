import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useMapStore } from './useMapStore'
import {
  DEFAULT_GRID_COLUMNS,
  DEFAULT_GRID_ROWS,
  GRID_SIZE_MIN,
  GRID_SIZE_MAX,
} from './gridMath'
import { DEFAULT_HEX_RADIUS, HEX_RADIUS_MIN, HEX_RADIUS_MAX } from './hexMath'
import type { ProjectMap } from './types'

interface MapSizeSettingsProps {
  map: ProjectMap
}

/** Grid/hex size controls — separate from the rest of Map Settings so that
 *  file doesn't grow into a god component. */
export default function MapSizeSettings({ map }: MapSizeSettingsProps) {
  const updateMapSize = useMapStore((s) => s.updateMapSize)

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value))

  if (map.type === 'grid') {
    const columns = map.gridColumns ?? DEFAULT_GRID_COLUMNS
    const rows = map.gridRows ?? DEFAULT_GRID_ROWS
    return (
      <div className="space-y-2">
        <div className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
          Size
        </div>
        <div className="flex gap-3">
          <div className="flex flex-1 items-center gap-2">
            <Label className="min-w-15 text-xs shrink-0">Columns</Label>
            <Input
              type="number"
              min={GRID_SIZE_MIN}
              max={GRID_SIZE_MAX}
              className="h-8 text-xs"
              value={columns}
              onChange={(e) =>
                updateMapSize({
                  gridColumns: clamp(
                    parseInt(e.target.value, 10) || columns,
                    GRID_SIZE_MIN,
                    GRID_SIZE_MAX,
                  ),
                })
              }
            />
          </div>
          <div className="flex flex-1 items-center gap-2">
            <Label className="min-w-15 text-xs shrink-0">Rows</Label>
            <Input
              type="number"
              min={GRID_SIZE_MIN}
              max={GRID_SIZE_MAX}
              className="h-8 text-xs"
              value={rows}
              onChange={(e) =>
                updateMapSize({
                  gridRows: clamp(
                    parseInt(e.target.value, 10) || rows,
                    GRID_SIZE_MIN,
                    GRID_SIZE_MAX,
                  ),
                })
              }
            />
          </div>
        </div>
      </div>
    )
  }

  const radius = map.hexRadius ?? DEFAULT_HEX_RADIUS
  return (
    <div className="space-y-2">
      <div className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
        Size
      </div>
      <div className="flex items-center gap-2">
        <Label className="min-w-15 text-xs shrink-0">Radius</Label>
        <Input
          type="number"
          min={HEX_RADIUS_MIN}
          max={HEX_RADIUS_MAX}
          className="h-8 text-xs w-24"
          value={radius}
          onChange={(e) =>
            updateMapSize({
              hexRadius: clamp(
                parseInt(e.target.value, 10) || radius,
                HEX_RADIUS_MIN,
                HEX_RADIUS_MAX,
              ),
            })
          }
        />
        <span className="text-xs text-muted-foreground">rings from center</span>
      </div>
    </div>
  )
}
