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
import { useMapStore } from './useMapStore'
import type { MapBackground, ProjectMap } from './types'

interface MapBackgroundSettingsProps {
  map: ProjectMap
}

const DEFAULT_BACKGROUND: Omit<MapBackground, 'assetId'> = {
  fit: 'cover',
  posX: 50,
  posY: 50,
  scale: 100,
}

/** Background image + its cover/contain fit and position/scale — split out
 *  of MapSettingsDialog so that file stays a plain orchestrator. */
export default function MapBackgroundSettings({
  map,
}: MapBackgroundSettingsProps) {
  const setMapBackground = useMapStore((s) => s.setMapBackground)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const background = map.background
  const previewUrl = useAssetUrl(background?.assetId ?? null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const docId = useProjectStore.getState().currentDocId
      const stored = await addAssetFile(file, {
        docId,
        tags: ['map-background'],
      })
      setMapBackground({ ...DEFAULT_BACKGROUND, ...background, assetId: stored.id })
    } finally {
      setUploading(false)
    }
  }

  const updateBackground = (updates: Partial<MapBackground>) => {
    if (!background) return
    setMapBackground({ ...background, ...updates })
  }

  return (
    <div className="space-y-2">
      <div className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
        Background Image
      </div>

      {background && previewUrl ? (
        <div className="space-y-2">
          <img
            src={previewUrl}
            alt=""
            className="rounded border border-border w-full h-24 object-cover"
          />

          <div className="flex items-center gap-2">
            <Label className="min-w-15 text-xs shrink-0">Fit</Label>
            <Select
              value={background.fit}
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
                value={background.posX}
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
                value={background.posY}
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
              value={background.scale}
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
            onClick={() => setMapBackground(null)}
          >
            Remove Background
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
          {uploading ? 'Uploading…' : 'Upload Background Image'}
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
