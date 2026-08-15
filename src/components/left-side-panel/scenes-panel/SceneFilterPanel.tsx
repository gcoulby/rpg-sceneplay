import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SceneFilterPanelProps {
  allCharacters: string[]
  allLocations: string[]
  allPrefixes: string[]
  allTimes: string[]
  filterCharacters: string[]
  filterLocation: string
  filterPrefix: string
  filterTime: string
  filterColor: string
  filterSynopsis: string
  hasActiveFilter: boolean
  onAddCharacter: (c: string) => void
  onRemoveCharacter: (c: string) => void
  onLocationChange: (v: string) => void
  onPrefixChange: (v: string) => void
  onTimeChange: (v: string) => void
  onColorChange: (v: string) => void
  onSynopsisChange: (v: string) => void
  onClearAll: () => void
}

const FILTER_COLORS = [
  '',
  '#8b5cf6',
  '#4f46e5',
  '#2563eb',
  '#059669',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#000000',
  '#ffffff',
]

const SceneFilterPanel: React.FC<SceneFilterPanelProps> = ({
  allCharacters,
  allLocations,
  allPrefixes,
  allTimes,
  filterCharacters,
  filterLocation,
  filterPrefix,
  filterTime,
  filterColor,
  filterSynopsis,
  hasActiveFilter,
  onAddCharacter,
  onRemoveCharacter,
  onLocationChange,
  onPrefixChange,
  onTimeChange,
  onColorChange,
  onSynopsisChange,
  onClearAll,
}) => {
  const availableCharacters = allCharacters.filter(
    (c) => !filterCharacters.includes(c),
  )

  return (
    <div className="w-full px-3.5 pt-2 pb-2.5 border-b border-(--fd-border) flex flex-col gap-1.5 shrink-0">
      <div className="flex flex-col gap-1.5">
        <Select
          value=""
          onValueChange={(v) => {
            if (v) onAddCharacter(v)
          }}
        >
          <SelectTrigger className="w-full text-[13px]">
            <SelectValue placeholder="Character..." />
          </SelectTrigger>
          <SelectContent>
            {availableCharacters.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filterCharacters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {filterCharacters.map((c) => (
              <Badge key={c} variant="secondary" className="gap-1 pr-1">
                {c}
                <button
                  type="button"
                  className="flex justify-center items-center opacity-70 hover:opacity-100 min-w-4 min-h-4"
                  onClick={() => onRemoveCharacter(c)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-1.5">
        <Select
          value={filterLocation || ''}
          onValueChange={(v) => onLocationChange(v as string)}
        >
          <SelectTrigger className="flex-1 min-w-0 text-[13px]">
            <SelectValue placeholder="Location..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Location...</SelectItem>
            {allLocations.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterPrefix || ''}
          onValueChange={(v) => onPrefixChange(v as string)}
        >
          <SelectTrigger className="flex-1 min-w-0 text-[13px]">
            <SelectValue placeholder="INT/EXT..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">INT/EXT...</SelectItem>
            {allPrefixes.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-1.5">
        <Select
          value={filterTime}
          onValueChange={(v) => onTimeChange(v as string)}
        >
          <SelectTrigger className="flex-1 min-w-0 text-[13px]">
            <SelectValue placeholder="Time of Day..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Time of Day...</SelectItem>
            {allTimes.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          {FILTER_COLORS.map((c) => (
            <button
              key={c || 'all'}
              type="button"
              className={`w-4 h-4 rounded-full border-2 cursor-pointer shrink-0 shadow-[inset_0_0_0_1px_rgba(128,128,128,0.3)] ${filterColor === c ? 'border-(--fd-text)' : 'border-transparent'}`}
              style={{
                background: c || 'var(--fd-text)',
                opacity: c ? 1 : 0.25,
              }}
              onClick={() => onColorChange(c)}
              title={c || 'All colors'}
            />
          ))}
        </div>
      </div>

      <Input
        type="text"
        placeholder="Synopsis contains..."
        value={filterSynopsis}
        onChange={(e) => onSynopsisChange(e.target.value)}
        className="text-[13px]"
      />

      {hasActiveFilter && (
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}

export default SceneFilterPanel
