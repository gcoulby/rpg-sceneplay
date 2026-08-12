import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, X } from 'lucide-react'
import { useMapStore } from './useMapStore'
import MapCanvas from './MapCanvas'
import MapCellDialog from './MapCellDialog'
import MapSettingsDialog from './MapSettingsDialog'
import { coordKey } from './coordKey'
import type { MapCoord } from './types'

export const MapScreen = () => {
  const map = useMapStore((s) => s.map)
  const pendingLocationLink = useMapStore((s) => s.pendingLocationLink)
  const setPendingLocationLink = useMapStore((s) => s.setPendingLocationLink)
  const setLocationMapRef = useMapStore((s) => s.setLocationMapRef)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedCoord, setSelectedCoord] = useState<MapCoord | null>(null)

  const handleCellClick = (coord: MapCoord) => {
    if (!map) return
    if (pendingLocationLink) {
      setLocationMapRef(pendingLocationLink, { mapId: map.id, coord })
      setPendingLocationLink(null)
      return
    }
    setSelectedCoord(coord)
  }

  if (!map) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
        <p className="text-sm text-muted-foreground max-w-sm">
          No map set up yet. Choose a hex or grid layout to get started.
        </p>
        <Button onClick={() => setSettingsOpen(true)}>Set Up Map</Button>
        <MapSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-(--fd-border) shrink-0">
        <span className="font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)">
          Map
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="size-3.5" />
          Map Settings
        </Button>
      </div>

      {pendingLocationLink && (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-accent/50 text-xs shrink-0">
          <span>
            Click a cell to place <strong>{pendingLocationLink}</strong> on
            the map.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5"
            onClick={() => setPendingLocationLink(null)}
          >
            <X className="size-3.5" />
            Cancel
          </Button>
        </div>
      )}

      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        <MapCanvas map={map} onCellClick={handleCellClick} />
      </div>

      <MapCellDialog
        key={selectedCoord ? coordKey(map.type, selectedCoord) : 'closed'}
        coord={selectedCoord}
        mapType={map.type}
        onOpenChange={(open) => {
          if (!open) setSelectedCoord(null)
        }}
      />
      <MapSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
