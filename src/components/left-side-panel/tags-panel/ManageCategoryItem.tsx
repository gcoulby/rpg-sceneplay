import React from 'react'
import { X } from 'lucide-react'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ManageEntityRow from './ManageEntityRow'
import type { TagOccurrence } from './tagOccurrences'
import type { TagCategoryItem, TagItem } from './tagTypes'

interface ManageCategoryItemProps {
  category: TagCategoryItem
  entities: TagItem[]
  occurrencesByTag: Map<string, TagOccurrence[]>
  expandedEntityId: string | null
  onToggleEntity: (id: string) => void
  onUpdateEntityName: (id: string, name: string) => void
  onUpdateEntityNotes: (id: string, notes: string) => void
  onDeleteEntity: (id: string) => void
  onDeleteCategory: (id: string) => void
  onNavigateToOccurrence: (from: number) => void
  onRemoveOccurrence: (occ: TagOccurrence) => void
  registerItemRef: (entityId: string, el: HTMLDivElement | null) => void
}

const ManageCategoryItem: React.FC<ManageCategoryItemProps> = ({
  category,
  entities,
  occurrencesByTag,
  expandedEntityId,
  onToggleEntity,
  onUpdateEntityName,
  onUpdateEntityNotes,
  onDeleteEntity,
  onDeleteCategory,
  onNavigateToOccurrence,
  onRemoveOccurrence,
  registerItemRef,
}) => {
  const totalOccs = entities.reduce(
    (sum, e) => sum + (occurrencesByTag.get(e.id)?.length || 0),
    0,
  )
  const hasEntities = entities.length > 0

  return (
    <AccordionItem
      value={category.id}
      className="border-b border-(--fd-border)"
      disabled={!hasEntities}
    >
      <div className="flex items-center gap-1 px-3 min-h-10">
        <AccordionTrigger
          className={`flex-1 py-2.5 gap-2.5 hover:no-underline ${hasEntities ? 'hover:bg-white/3' : 'cursor-default'}`}
        >
          <span
            className="inline-block rounded-[3px] w-3.5 h-3.5 shrink-0"
            style={{ background: category.color }}
          />
          <span
            className="flex-1 font-medium text-sm text-left"
            style={{
              color: hasEntities ? 'var(--fd-text)' : 'var(--fd-text-muted)',
            }}
          >
            {category.name}
          </span>
          {hasEntities && (
            <Badge
              variant="secondary"
              className="px-1.5 py-px text-[10px]"
              title={`${entities.length} entities, ${totalOccs} occurrences`}
            >
              {entities.length}
            </Badge>
          )}
        </AccordionTrigger>
        {!category.isBuiltIn && (
          <Button
            variant="ghost"
            size="icon"
            className="size-5 text-(--fd-text-muted) hover:text-[#ff6b6b] shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onDeleteCategory(category.id)
            }}
            title="Delete custom category"
            aria-label={`Delete custom category ${category.name}`}
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>

      {hasEntities && (
        <AccordionContent className="px-0 pt-0.5 pb-1.5">
          {entities.map((entity) => (
            <ManageEntityRow
              key={entity.id}
              entity={entity}
              occurrences={occurrencesByTag.get(entity.id) || []}
              isExpanded={expandedEntityId === entity.id}
              itemRef={(el) => registerItemRef(entity.id, el)}
              onToggleExpand={() => onToggleEntity(entity.id)}
              onUpdateName={(name) => onUpdateEntityName(entity.id, name)}
              onUpdateNotes={(notes) => onUpdateEntityNotes(entity.id, notes)}
              onDeleteEntity={() => onDeleteEntity(entity.id)}
              onNavigateToOccurrence={onNavigateToOccurrence}
              onRemoveOccurrence={onRemoveOccurrence}
            />
          ))}
        </AccordionContent>
      )}
    </AccordionItem>
  )
}

export default ManageCategoryItem
