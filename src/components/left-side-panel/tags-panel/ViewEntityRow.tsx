import React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import OccurrenceRow from './OccurrenceRow'
import type { TagOccurrence } from './tagOccurrences'
import type { TagItem } from './tagTypes'

interface ViewEntityRowProps {
  entity: TagItem
  occurrences: TagOccurrence[]
  isExpanded: boolean
  onToggleExpand: () => void
  onNavigateToEntity: () => void
  onNavigateToOccurrence: (from: number) => void
}

const ViewEntityRow: React.FC<ViewEntityRowProps> = ({
  entity,
  occurrences,
  isExpanded,
  onToggleExpand,
  onNavigateToEntity,
  onNavigateToOccurrence,
}) => (
  <div>
    <div className="flex items-center gap-1.5 py-0.75 pr-3 pl-8 text-[11px]">
      <span
        className="flex-1 text-(--fd-text) cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis font-semibold hover:text-(--fd-accent)"
        onClick={onNavigateToEntity}
        title="Navigate to first occurrence"
      >
        {entity.name}
      </span>
      <Badge
        variant="secondary"
        className="px-1.25 py-px text-[10px] shrink-0"
        title={`${occurrences.length} occurrence${occurrences.length !== 1 ? 's' : ''}`}
      >
        {occurrences.length}
      </Badge>
      {entity.notes && (
        <span
          className="text-(--fd-accent) text-[10px] shrink-0"
          title="Has notes"
        >
          *
        </span>
      )}
      {occurrences.length > 1 && (
        <button
          className="bg-transparent border-none text-(--fd-text-muted) cursor-pointer px-0.5 py-0 shrink-0 hover:text-(--fd-text)"
          onClick={onToggleExpand}
          title={isExpanded ? 'Hide occurrences' : 'Show occurrences'}
          aria-label={
            isExpanded
              ? `Hide occurrences for ${entity.name}`
              : `Show occurrences for ${entity.name}`
          }
        >
          {isExpanded ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </button>
      )}
    </div>
    {isExpanded && occurrences.length > 1 && (
      <div className="pt-1 pr-3 pb-2 pl-8">
        {occurrences.map((occ, i) => (
          <OccurrenceRow
            key={`${occ.from}-${i}`}
            occurrence={occ}
            onNavigate={onNavigateToOccurrence}
          />
        ))}
      </div>
    )}
  </div>
)

export default ViewEntityRow
