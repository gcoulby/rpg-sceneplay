import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMapStore } from './useMapStore'
import MapSizeSettings from './MapSizeSettings'
import MapBackgroundSettings from './MapBackgroundSettings'
import MapHexRingSettings from './MapHexRingSettings'
import type { MapType } from './types'

interface MapSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAP_TYPE_LABELS: Record<MapType, string> = {
  grid: 'Grid',
  hex: 'Hex',
}

/** Shared by the Map screen's own settings button and File → Map Settings…
 *
 * A popover pinned top-right rather than a modal dialog — settings here
 * (size, background image) are meant to be tuned while watching the map
 * update behind the panel, which a centered/blurred dialog would hide.
 *
 * Map type is chosen once per project; changing it later is destructive
 * (drops the map and every location's link to it), gated behind a confirm step. */
export default function MapSettingsDialog({
  open,
  onOpenChange,
}: MapSettingsDialogProps) {
  const map = useMapStore((s) => s.map)
  const createMap = useMapStore((s) => s.createMap)
  const resetMap = useMapStore((s) => s.resetMap)
  const setMapBackground = useMapStore((s) => s.setMapBackground)
  const setAmbientBackground = useMapStore((s) => s.setAmbientBackground)
  const [pendingType, setPendingType] = useState<MapType>('grid')
  const [confirmingReset, setConfirmingReset] = useState(false)

  const handleCreate = () => {
    createMap(pendingType)
    onOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmingReset(false)
    onOpenChange(next)
  }

  const handleConfirmReset = () => {
    resetMap()
    setConfirmingReset(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        tabIndex={-1}
        aria-hidden
        className="top-24 right-5 fixed w-0 h-0 pointer-events-none"
      />
      <PopoverContent
        align="end"
        sideOffset={8}
        className="p-0 w-84 max-h-[80vh] overflow-y-auto text-[13px]"
      >
        <div className="flex items-center justify-between py-2 px-3 border-b border-(--fd-border) font-semibold text-xs text-(--fd-text-muted) uppercase tracking-[0.5px]">
          <span>Map Settings</span>
        </div>

        <div className="p-3 space-y-4">
          {confirmingReset ? (
            <div className="space-y-3">
              <p className="text-sm">
                Changing map will delete current map and all associations.
                Are you sure?
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingReset(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmReset}
                >
                  Delete Map
                </Button>
              </div>
            </div>
          ) : map ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="min-w-16 text-xs shrink-0">Type</Label>
                  <span className="text-sm text-muted-foreground">
                    {MAP_TYPE_LABELS[map.type]}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 text-destructive"
                  onClick={() => setConfirmingReset(true)}
                >
                  Change Map Type (Destructive)
                </Button>
              </div>

              <MapSizeSettings map={map} />
              {map.type === 'hex' && <MapHexRingSettings map={map} />}
              <MapBackgroundSettings
                title="Background Image"
                uploadLabel="Upload Background Image"
                assetTag="map-background"
                value={map.background}
                onChange={setMapBackground}
              />
              <MapBackgroundSettings
                title="Ambient Background"
                uploadLabel="Upload Ambient Background"
                assetTag="map-ambient-background"
                value={map.ambientBackground}
                onChange={setAmbientBackground}
              />
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Choose the map layout for this project.
              </p>
              <div className="flex items-center gap-2">
                <Label className="min-w-16 text-xs shrink-0">Type</Label>
                <Select
                  value={pendingType}
                  onValueChange={(v) => v && setPendingType(v as MapType)}
                >
                  <SelectTrigger className="flex-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="hex">Hex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleCreate}>
                Create Map
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
