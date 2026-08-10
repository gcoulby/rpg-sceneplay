import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import OccurrenceRow from './OccurrenceRow'
import type { TagOccurrence } from './tagOccurrences'
import type { TagItem } from './tagTypes'

interface ManageEntityRowProps {
  entity: TagItem
  occurrences: TagOccurrence[]
  isExpanded: boolean
  itemRef: (el: HTMLDivElement | null) => void
  onToggleExpand: () => void
  onUpdateName: (name: string) => void
  onUpdateNotes: (notes: string) => void
  onDeleteEntity: () => void
  onNavigateToOccurrence: (from: number) => void
  onRemoveOccurrence: (occurrence: TagOccurrence) => void
}

const ManageEntityRow: React.FC<ManageEntityRowProps> = ({
  entity,
  occurrences,
  isExpanded,
  itemRef,
  onToggleExpand,
  onUpdateName,
  onUpdateNotes,
  onDeleteEntity,
  onNavigateToOccurrence,
  onRemoveOccurrence,
}) => (
  <div
    className={isExpanded ? 'bg-[rgba(74,158,255,0.06)] rounded' : ''}
    ref={itemRef}
  >
    <div className="flex items-center gap-1.5 py-0.75 pr-3 pl-8 text-[11px]">
      <span
        className="flex-1 text-(--fd-text) cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis font-semibold hover:text-(--fd-accent)"
        onClick={onToggleExpand}
        title="Click to edit"
      >
        {entity.name}
      </span>
      <Badge
        variant="secondary"
        className="ml-1 px-1.25 py-px text-[10px] shrink-0"
        title={`${occurrences.length} occurrence${occurrences.length !== 1 ? 's' : ''}`}
      >
        {occurrences.length}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className="size-4 text-(--fd-text-muted) hover:text-[#ff6b6b]"
        onClick={onDeleteEntity}
        title="Delete entity and all occurrences"
        aria-label={`Delete entity ${entity.name} and all occurrences`}
      >
        <X className="size-3" />
      </Button>
    </div>

    {isExpanded && (
      <div className="pt-1 pr-3 pb-2 pl-8">
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] shrink-0">
            Name
          </label>
          <Input
            className="flex-1 px-1.5 py-1 border-transparent h-auto font-semibold text-xs"
            type="text"
            value={entity.name}
            onChange={(e) => onUpdateName(e.target.value)}
            aria-label={`Edit name for ${entity.name}`}
          />
        </div>
        <Textarea
          className="border-transparent text-[11px] leading-[1.4] tags-item-notes"
          value={entity.notes}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder="Add details: description, requirements, budget notes..."
          rows={3}
          aria-label={`Notes for ${entity.name}`}
        />
        {occurrences.length > 0 && (
          <div className="mt-2 border-t border-(--fd-overlay-subtle) pt-1.5">
            <div className="text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] shrink-0">
              Occurrences ({occurrences.length})
            </div>
            {occurrences.map((occ, i) => (
              <OccurrenceRow
                key={`${occ.from}-${i}`}
                occurrence={occ}
                onNavigate={onNavigateToOccurrence}
                onRemove={onRemoveOccurrence}
              />
            ))}
          </div>
        )}
      </div>
    )}
  </div>
)

export default ManageEntityRow
