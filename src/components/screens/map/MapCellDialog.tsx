import { useRef, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useProjectStore } from '@/stores/projectStore'
import { addAssetFile, useAssetUrl } from '@/storage/assetStore'
import { useMapStore } from './useMapStore'
import { coordKey } from './coordKey'
import MapIconPicker from './MapIconPicker'
import type { MapCoord, MapType } from './types'

interface MapCellDialogProps {
  coord: MapCoord | null
  /** Screen position of the click that opened this — anchors the popover to
   *  the cell instead of a fixed corner, same reasoning as Map Settings:
   *  seeing the map while editing is more useful than a centered dialog. */
  anchorPoint: { x: number; y: number } | null
  mapType: MapType
  onOpenChange: (open: boolean) => void
}

/** Add/edit the feature (label + notes + image + icon) on a single cell. */
export default function MapCellDialog({
  coord,
  anchorPoint,
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

  // The component is remounted (via `key` in MapScreen) whenever the target
  // cell changes, so lazy initial state is enough — no effect needed to resync.
  const [label, setLabel] = useState(() => cell?.label ?? '')
  const [notes, setNotes] = useState(() => cell?.notes ?? '')
  const [imageAssetId, setImageAssetId] = useState(() => cell?.imageAssetId ?? '')
  const [icon, setIcon] = useState(() => cell?.icon ?? '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageUrl = useAssetUrl(imageAssetId || null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const docId = useProjectStore.getState().currentDocId
      const stored = await addAssetFile(file, {
        docId,
        tags: ['map-cell'],
      })
      setImageAssetId(stored.id)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = () => {
    if (!coord) return
    upsertCellFeature(coord, {
      label: label.trim(),
      notes: notes.trim(),
      imageAssetId: imageAssetId || undefined,
      icon: icon || undefined,
    })
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (!coord) return
    deleteCellFeature(coord)
    onOpenChange(false)
  }

  const anchor = anchorPoint
    ? () => ({ getBoundingClientRect: () => new DOMRect(anchorPoint.x, anchorPoint.y, 0, 0) })
    : undefined

  return (
    <Popover open={coord !== null} onOpenChange={onOpenChange}>
      <PopoverTrigger
        tabIndex={-1}
        aria-hidden
        className="top-0 left-0 fixed w-0 h-0 pointer-events-none"
      />
      <PopoverContent
        anchor={anchor}
        align="start"
        sideOffset={8}
        className="p-0 w-72 text-[13px]"
      >
        <div className="flex items-center justify-between py-2 px-3 border-b border-(--fd-border) font-semibold text-xs text-(--fd-text-muted) uppercase tracking-[0.5px]">
          <span>{cell ? 'Edit Feature' : 'Add Feature'}</span>
        </div>

        <div className="p-3 space-y-3">
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
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth remembering about this location."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Icon</Label>
            <MapIconPicker value={icon} onChange={setIcon} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Image</Label>
            {imageUrl && (
              <img
                src={imageUrl}
                alt=""
                className="rounded border border-border w-full h-24 object-cover"
              />
            )}
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? 'Uploading…' : imageUrl ? 'Change Image' : 'Upload Image'}
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setImageAssetId('')}
                >
                  Remove Image
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 py-2 px-3 border-t border-(--fd-border)">
          {cell ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!label.trim() && !imageAssetId && !icon}
            >
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
