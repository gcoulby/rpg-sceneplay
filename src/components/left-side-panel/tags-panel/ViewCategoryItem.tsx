import React from 'react'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import ViewEntityRow from './ViewEntityRow'
import type { TagOccurrence } from './tagOccurrences'
import type { TagCategoryItem, TagItem } from './tagTypes'

interface ViewCategoryItemProps {
  category: TagCategoryItem
  entities: TagItem[]
  occurrencesByTag: Map<string, TagOccurrence[]>
  expandedEntityId: string | null
  onToggleEntity: (id: string) => void
  onNavigateToEntity: (id: string) => void
  onNavigateToOccurrence: (from: number) => void
}

const ViewCategoryItem: React.FC<ViewCategoryItemProps> = ({
  category,
  entities,
  occurrencesByTag,
  expandedEntityId,
  onToggleEntity,
  onNavigateToEntity,
  onNavigateToOccurrence,
}) => {
  const totalOccs = entities.reduce(
    (sum, e) => sum + (occurrencesByTag.get(e.id)?.length || 0),
    0,
  )

  return (
    <AccordionItem
      value={category.id}
      className="border-b border-(--fd-border)"
    >
      <AccordionTrigger className="gap-2.5 hover:bg-white/3 px-3 py-2.5 hover:no-underline">
        <span
          className="inline-block rounded-[3px] w-3.5 h-3.5 shrink-0"
          style={{ background: category.color }}
        />
        <span className="flex-1 text-sm text-(--fd-text) font-medium text-left">
          {category.name}
        </span>
        <Badge
          variant="secondary"
          className="px-1.5 py-px text-[10px]"
          title={`${entities.length} entities, ${totalOccs} occurrences`}
        >
          {entities.length}
        </Badge>
      </AccordionTrigger>
      <AccordionContent className="px-0 pt-0.5 pb-1.5">
        {entities.map((entity) => (
          <ViewEntityRow
            key={entity.id}
            entity={entity}
            occurrences={occurrencesByTag.get(entity.id) || []}
            isExpanded={expandedEntityId === entity.id}
            onToggleExpand={() => onToggleEntity(entity.id)}
            onNavigateToEntity={() => onNavigateToEntity(entity.id)}
            onNavigateToOccurrence={onNavigateToOccurrence}
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  )
}

export default ViewCategoryItem
