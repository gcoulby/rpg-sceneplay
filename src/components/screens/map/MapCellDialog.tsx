import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useMapStore } from './useMapStore'
import { coordKey } from './coordKey'
import type { MapCoord, MapType } from './types'

interface MapCellDialogProps {
  coord: MapCoord | null
  mapType: MapType
  onOpenChange: (open: boolean) => void
}

/** Add/edit the feature (label + notes) on a single cell. Open state is driven
 *  by `coord` being non-null, matching the click-a-cell interaction. */
export default function MapCellDialog({
  coord,
  mapType,
  onOpenChange,
}: MapCellDialogProps) {
  const map = useMapStore((s) => s.map)
  const upsertCellFeature = useMapStore((s) => s.upsertCellFeature)
  const deleteCellFeature = useMapStore((s) => s.deleteCellFeature)

  const cell =
    coord && map
      ? map.cells.find((c) => coordKey(mapType, c.coord) === coordKey(mapType, coord))
      : undefined

  // The dialog is remounted (via `key` in MapScreen) whenever the target cell
  // changes, so lazy initial state is enough — no effect needed to resync.
  const [label, setLabel] = useState(() => cell?.label ?? '')
  const [notes, setNotes] = useState(() => cell?.notes ?? '')

  const handleSave = () => {
    if (!coord) return
    upsertCellFeature(coord, { label: label.trim(), notes: notes.trim() })
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (!coord) return
    deleteCellFeature(coord)
    onOpenChange(false)
  }

  return (
    <Dialog open={coord !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{cell ? 'Edit Feature' : 'Add Feature'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Label</Label>
            <Input
              autoFocus
              className="h-8 text-sm"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. The Rusty Anchor Tavern"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              className="text-sm"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering about this location."
            />
          </div>
        </div>

        <DialogFooter>
          {cell && (
            <Button variant="ghost" className="mr-auto text-destructive" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!label.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
