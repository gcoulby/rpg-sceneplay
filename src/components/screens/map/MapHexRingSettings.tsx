import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useMapStore } from './useMapStore'
import { DEFAULT_HEX_RADIUS } from './hexMath'
import type { ProjectMap } from './types'

interface MapHexRingSettingsProps {
  map: ProjectMap
}

/** Per-ring border colors for a hex map — ring 0 is the center hex, ring N is
 *  the Nth ring of hexes out from it. Hex-only; grid maps have no rings. */
export default function MapHexRingSettings({ map }: MapHexRingSettingsProps) {
  const setRingColor = useMapStore((s) => s.setRingColor)
  const radius = map.hexRadius ?? DEFAULT_HEX_RADIUS
  const ringColors = map.ringColors ?? []

  return (
    <div className="space-y-2">
      <div className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
        Ring Colors
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: radius + 1 }, (_, ring) => (
          <div key={ring} className="flex items-center gap-2">
            <Label className="min-w-16 text-xs shrink-0">
              {ring === 0 ? 'Center' : `Ring ${ring}`}
            </Label>
            <input
              type="color"
              className="w-8 h-7 rounded border border-input bg-transparent p-0.5"
              value={ringColors[ring] || '#3a3a3a'}
              onChange={(e) => setRingColor(ring, e.target.value)}
            />
            {ringColors[ring] && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => setRingColor(ring, '')}
              >
                Reset
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
