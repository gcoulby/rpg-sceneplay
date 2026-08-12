import { useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjectStore } from '@/stores/projectStore'
import { addAssetFile, useAssetUrl } from '@/storage/assetStore'
import type { MapBackground } from './types'

interface MapBackgroundSettingsProps {
  title: string
  uploadLabel: string
  assetTag: string
  value: MapBackground | undefined
  onChange: (background: MapBackground | null) => void
}

const DEFAULT_BACKGROUND: Omit<MapBackground, 'assetId'> = {
  fit: 'cover',
  posX: 50,
  posY: 50,
  scale: 100,
}

/** A background image + its cover/contain fit and position/scale. Reused for
 *  both the grid-bound background and the ambient (whole-view) backdrop —
 *  same shape, different key on ProjectMap — so the controls aren't duplicated. */
export default function MapBackgroundSettings({
  title,
  uploadLabel,
  assetTag,
  value,
  onChange,
}: MapBackgroundSettingsProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUrl = useAssetUrl(value?.assetId ?? null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const docId = useProjectStore.getState().currentDocId
      const stored = await addAssetFile(file, {
        docId,
        tags: [assetTag],
      })
      onChange({ ...DEFAULT_BACKGROUND, ...value, assetId: stored.id })
    } finally {
      setUploading(false)
    }
  }

  const updateBackground = (updates: Partial<MapBackground>) => {
    if (!value) return
    onChange({ ...value, ...updates })
  }

  return (
    <div className="space-y-2">
      <div className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
        {title}
      </div>

      {value && previewUrl ? (
        <div className="space-y-2">
          <img
            src={previewUrl}
            alt=""
            className="rounded border border-border w-full h-24 object-cover"
          />

          <div className="flex items-center gap-2">
            <Label className="min-w-15 text-xs shrink-0">Fit</Label>
            <Select
              value={value.fit}
              onValueChange={(v) =>
                v && updateBackground({ fit: v as MapBackground['fit'] })
              }
            >
              <SelectTrigger className="flex-1 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cover">Cover</SelectItem>
                <SelectItem value="contain">Contain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <div className="flex flex-1 items-center gap-2">
              <Label className="min-w-15 text-xs shrink-0">
                Position X
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                className="h-8 text-xs"
                value={value.posX}
                onChange={(e) =>
                  updateBackground({
                    posX: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                  })
                }
              />
            </div>
            <div className="flex flex-1 items-center gap-2">
              <Label className="min-w-15 text-xs shrink-0">
                Position Y
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                className="h-8 text-xs"
                value={value.posY}
                onChange={(e) =>
                  updateBackground({
                    posY: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                  })
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label className="min-w-15 text-xs shrink-0">Scale</Label>
            <Input
              type="number"
              min={50}
              max={300}
              className="h-8 text-xs w-24"
              value={value.scale}
              onChange={(e) =>
                updateBackground({
                  scale: Math.min(300, Math.max(50, parseInt(e.target.value, 10) || 100)),
                })
              }
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onChange(null)}
          >
            Remove
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : uploadLabel}
        </Button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
