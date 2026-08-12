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
 *  Map type is chosen once per project — once cells exist it's shown read-only. */
export default function MapSettingsDialog({
  open,
  onOpenChange,
}: MapSettingsDialogProps) {
  const map = useMapStore((s) => s.map)
  const createMap = useMapStore((s) => s.createMap)
  const [pendingType, setPendingType] = useState<MapType>('grid')

  const handleCreate = () => {
    createMap(pendingType)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Map Settings</DialogTitle>
          {!map && (
            <DialogDescription>
              Choose the map layout for this project. This can&apos;t be
              changed once you start adding features.
            </DialogDescription>
          )}
        </DialogHeader>

        {map ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Label className="min-w-16 text-xs shrink-0">Type</Label>
              <span className="text-muted-foreground">
                {MAP_TYPE_LABELS[map.type]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Map type is set once per project and can&apos;t be changed
              here.
            </p>
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
