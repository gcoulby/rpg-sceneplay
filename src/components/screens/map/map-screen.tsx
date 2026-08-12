import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useMapStore } from './useMapStore'
import MapCanvas from './MapCanvas'
import MapCellDialog from './MapCellDialog'
import MapSettingsDialog from './MapSettingsDialog'
import MapBackgroundImage from './MapBackgroundImage'
import { coordKey } from './coordKey'
import type { MapCoord } from './types'

export const MapScreen = () => {
  const map = useMapStore((s) => s.map)
  const pendingLocationLink = useMapStore((s) => s.pendingLocationLink)
  const setPendingLocationLink = useMapStore((s) => s.setPendingLocationLink)
  const linkLocationToCell = useMapStore((s) => s.linkLocationToCell)
  const zoom = useMapStore((s) => s.zoom)
  const zoomIn = useMapStore((s) => s.zoomIn)
  const zoomOut = useMapStore((s) => s.zoomOut)
  const resetZoom = useMapStore((s) => s.resetZoom)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedCoord, setSelectedCoord] = useState<MapCoord | null>(null)
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null)

  const handleCellClick = (coord: MapCoord, event: React.MouseEvent) => {
    if (!map) return
    if (pendingLocationLink) {
      linkLocationToCell(pendingLocationLink, coord)
      setPendingLocationLink(null)
      return
    }
    setAnchorPoint({ x: event.clientX, y: event.clientY })
    setSelectedCoord(coord)
  }

  const handleWheel = (event: React.WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    if (event.deltaY < 0) zoomIn()
    else zoomOut()
  }

  if (!map) {
    return (
      <div className="flex flex-col justify-center items-center gap-3 px-4 h-full text-center">
        <p className="max-w-sm text-muted-foreground text-sm">
          No map set up yet. Choose a hex or grid layout to get started.
        </p>
        <Button onClick={() => setSettingsOpen(true)}>Set Up Map</Button>
        <MapSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center py-2 px-4 border-b border-(--fd-border) bg-(--fd-navigator-bg) shrink-0 gap-4">
        <span className="font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
          Map
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="px-1.5 h-7"
            onClick={zoomOut}
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <button
            type="button"
            className="w-11 text-xs text-muted-foreground hover:text-foreground text-center"
            onClick={resetZoom}
          >
            {zoom}%
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="px-1.5 h-7"
            onClick={zoomIn}
          >
            <ZoomIn className="size-3.5" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="px-2 h-7 ml-auto"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="size-3.5" />
          Map Settings
        </Button>
      </div>

      {pendingLocationLink && (
        <div className="flex justify-between items-center gap-2 bg-accent/50 px-3.5 py-2 text-xs shrink-0">
          <span>
            Click a cell to place <strong>{pendingLocationLink}</strong> on the
            map.
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="px-1.5 h-6"
            onClick={() => setPendingLocationLink(null)}
          >
            <X className="size-3.5" />
            Cancel
          </Button>
        </div>
      )}

      <div
        className="relative flex flex-1 justify-center items-start p-4 overflow-auto"
        onWheel={handleWheel}
      >
        {map.ambientBackground && (
          <div className="absolute inset-0 pointer-events-none">
            <MapBackgroundImage background={map.ambientBackground} />
          </div>
        )}
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          <MapCanvas map={map} onCellClick={handleCellClick} />
        </div>
      </div>

      <MapCellDialog
        key={selectedCoord ? coordKey(map.type, selectedCoord) : 'closed'}
        coord={selectedCoord}
        anchorPoint={anchorPoint}
        mapType={map.type}
        onOpenChange={(open) => {
          if (!open) setSelectedCoord(null)
        }}
      />
      <MapSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
