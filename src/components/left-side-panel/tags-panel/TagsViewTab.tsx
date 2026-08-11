import React, { useState } from 'react'
import { Accordion } from '@/components/ui/accordion'
import ViewCategoryItem from './ViewCategoryItem'
import type { TagOccurrence } from './tagOccurrences'
import type { TagCategoryItem, TagItem } from './tagTypes'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TagsViewTabProps {
  tagCategories: TagCategoryItem[]
  tagsByCategory: Map<string, TagItem[]>
  occurrencesByTag: Map<string, TagOccurrence[]>
  hasTags: boolean
  onNavigateToEntity: (id: string) => void
  onNavigateToOccurrence: (from: number) => void
}

const TagsViewTab: React.FC<TagsViewTabProps> = ({
  tagCategories,
  tagsByCategory,
  occurrencesByTag,
  hasTags,
  onNavigateToEntity,
  onNavigateToOccurrence,
}) => {
  const [expandedCats, setExpandedCats] = useState<string[]>([])
  const [expandedEntityId, setExpandedEntityId] = useState<string | null>(null)

  if (!hasTags) {
    return (
      <div className="px-3 py-5 text-(--fd-text-muted) text-xs italic text-center leading-normal">
        No tags yet. Select text in the editor, right-click, and choose
        &ldquo;Tag&rdquo; to get started.
      </div>
    )
  }

  return (
    <ScrollArea className="w-full h-[calc(var(--app-h)-8dvh)]">
      <Accordion multiple value={expandedCats} onValueChange={setExpandedCats}>
        {tagCategories.map((cat) => {
          const entities = tagsByCategory.get(cat.id) || []
          if (entities.length === 0) return null
          return (
            <ViewCategoryItem
              key={cat.id}
              category={cat}
              entities={entities}
              occurrencesByTag={occurrencesByTag}
              expandedEntityId={expandedEntityId}
              onToggleEntity={(id) =>
                setExpandedEntityId(expandedEntityId === id ? null : id)
              }
              onNavigateToEntity={onNavigateToEntity}
              onNavigateToOccurrence={onNavigateToOccurrence}
            />
          )
        })}
      </Accordion>
    </ScrollArea>
  )
}

export default TagsViewTab
