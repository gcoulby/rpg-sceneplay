import React from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  ELEMENT_LABELS,
  NOTE_COLORS,
  type NoteColor,
  type ElementType,
  type NoteFilter,
} from '@/stores/editorStore'
import { getNoteColorHex } from './noteTypes'

interface ScriptNotesFilterBarProps {
  filter: NoteFilter
  types: string[]
  contexts: string[]
  colorCounts: Map<NoteColor, number>
  isFiltered: boolean
  onElementTypeChange: (type: string) => void
  onContextLabelChange: (label: string) => void
  onToggleColor: (color: NoteColor) => void
  onClearFilter: () => void
}

const ScriptNotesFilterBar: React.FC<ScriptNotesFilterBarProps> = ({
  filter,
  types,
  contexts,
  colorCounts,
  isFiltered,
  onElementTypeChange,
  onContextLabelChange,
  onToggleColor,
  onClearFilter,
}) => (
  <div className="border-b border-(--fd-border) shrink-0 pt-1.5 px-2.5 pb-1">
    {isFiltered && (
      <div className="flex flex-wrap items-center gap-1 mb-1.5">
        {filter.noteId && (
          <Badge
            variant="secondary"
            className="cursor-pointer gap-1 text-(--fd-accent) bg-[rgba(74,158,255,.12)] border border-(--fd-accent)"
            onClick={onClearFilter}
          >
            Selected note
            <X className="opacity-60 size-3" />
          </Badge>
        )}
        {filter.elementType && (
          <Badge
            variant="secondary"
            className="cursor-pointer gap-1 text-(--fd-accent) bg-[rgba(74,158,255,.12)] border border-(--fd-accent)"
            onClick={() => onElementTypeChange('')}
          >
            {ELEMENT_LABELS[filter.elementType as ElementType] ||
              filter.elementType}
            <X className="opacity-60 size-3" />
          </Badge>
        )}
        {filter.contextLabel && (
          <Badge
            variant="secondary"
            className="gap-1 bg-[rgba(232,155,79,.12)] border border-[#e89b4f] text-[#e89b4f] cursor-pointer"
            onClick={() => onContextLabelChange('')}
          >
            {filter.contextLabel}
            <X className="opacity-60 size-3" />
          </Badge>
        )}
        {filter.color && (
          <Badge
            variant="secondary"
            className="cursor-pointer gap-1 text-(--fd-accent) bg-[rgba(74,158,255,.12)]"
            style={{ borderColor: getNoteColorHex(filter.color) }}
            onClick={() => onToggleColor(filter.color!)}
          >
            {filter.color}
            <X className="opacity-60 size-3" />
          </Badge>
        )}
        <Button
          variant="link"
          size="sm"
          className="ml-auto h-auto p-0 text-[10px] text-(--fd-text-muted)"
          onClick={onClearFilter}
        >
          Show All
        </Button>
      </div>
    )}

    {types.length > 1 && (
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[9px] text-(--fd-text-muted) uppercase tracking-[0.4px] w-10.5 shrink-0">
          Type
        </span>
        <ToggleGroup
          value={filter.elementType ? [filter.elementType] : []}
          onValueChange={(v: string[]) => onElementTypeChange(v[0] ?? '')}
          className="flex flex-wrap flex-1 justify-start gap-0.75 min-w-0"
        >
          {types.map((t) => (
            <ToggleGroupItem
              key={t}
              value={t}
              className="h-auto py-0.5 px-1.75 rounded-[3px] text-[10px] data-[state=on]:bg-(--fd-accent) data-[state=on]:text-white"
            >
              {ELEMENT_LABELS[t as ElementType] || t}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    )}

    {contexts.length > 0 && (
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[9px] text-(--fd-text-muted) uppercase tracking-[0.4px] w-10.5 shrink-0">
          Context
        </span>
        <ToggleGroup
          value={filter.contextLabel ? [filter.contextLabel] : []}
          onValueChange={(v: string[]) => onContextLabelChange(v[0] ?? '')}
          className="flex flex-wrap flex-1 justify-start gap-0.75 min-w-0"
        >
          {contexts.map((c) => (
            <ToggleGroupItem
              key={c}
              value={c}
              className="data-[state=on]:bg-[#e89b4f] px-1.75 py-0.5 rounded-[3px] max-w-30 h-auto overflow-hidden text-[10px] data-[state=on]:text-white text-ellipsis"
            >
              {c.length > 25 ? c.slice(0, 25) + '...' : c}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    )}

    <div className="flex items-center gap-1 mb-0.5 pl-12">
      {NOTE_COLORS.map((c) => {
        const count = colorCounts.get(c.name) || 0
        if (count === 0) return null
        return (
          <button
            key={c.name}
            type="button"
            className={`w-4 h-4 p-0 border-2 rounded-full cursor-pointer bg-transparent flex items-center justify-center hover:border-white/30 ${filter.color === c.name ? 'border-white' : 'border-transparent'}`}
            onClick={() => onToggleColor(c.name)}
            title={`${c.name} (${count})`}
          >
            <span
              className="block rounded-full w-2.5 h-2.5"
              style={{ background: c.hex }}
            />
          </button>
        )
      })}
    </div>
  </div>
)

export default ScriptNotesFilterBar
