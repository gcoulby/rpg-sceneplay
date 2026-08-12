import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
 *  Map type is chosen once per project; changing it later is destructive
 *  (drops the map and every location's link to it), gated behind a confirm step. */
export default function MapSettingsDialog({
  open,
  onOpenChange,
}: MapSettingsDialogProps) {
  const map = useMapStore((s) => s.map)
  const createMap = useMapStore((s) => s.createMap)
  const resetMap = useMapStore((s) => s.resetMap)
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

  if (confirmingReset) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Map Type?</DialogTitle>
            <DialogDescription>
              Changing map will delete current map and all associations. Are
              you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingReset(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReset}>
              Delete Map
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map Settings</DialogTitle>
          {!map && (
            <DialogDescription>
              Choose the map layout for this project.
            </DialogDescription>
          )}
        </DialogHeader>

        {map ? (
          <div className="space-y-4">
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
            <MapBackgroundSettings map={map} />
          </div>
        ) : (
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
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!map && <Button onClick={handleCreate}>Create Map</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
