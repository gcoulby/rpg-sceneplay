import React from 'react'
import { Accordion } from '@/components/ui/accordion'
import PendingCategoryStep from './PendingCategoryStep'
import PendingEntityStep from './PendingEntityStep'
import ManageCategoryItem from './ManageCategoryItem'
import AddCategoryForm from './AddCategoryForm'
import type { TagOccurrence } from './tagOccurrences'
import type { TagCategoryItem, TagItem, PendingTagSelection } from './tagTypes'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TagsManageTabProps {
  tagCategories: TagCategoryItem[]
  tagsByCategory: Map<string, TagItem[]>
  occurrencesByTag: Map<string, TagOccurrence[]>
  pendingTagSelection: PendingTagSelection | null
  pendingCategoryId: string | null
  newEntityName: string
  onNewEntityNameChange: (v: string) => void
  onPickCategory: (catId: string) => void
  onCreateNewEntity: () => void
  onAddToExistingEntity: (entity: TagItem) => void
  onBackToCategories: () => void
  onCancelPending: () => void
  expandedCats: string[]
  onExpandedCatsChange: (v: string[]) => void
  expandedTagId: string | null
  onToggleEntity: (id: string) => void
  onUpdateEntityName: (id: string, name: string) => void
  onUpdateEntityNotes: (id: string, notes: string) => void
  onDeleteEntity: (id: string) => void
  onDeleteCategory: (id: string) => void
  onNavigateToOccurrence: (from: number) => void
  onRemoveOccurrence: (occ: TagOccurrence) => void
  registerItemRef: (entityId: string, el: HTMLDivElement | null) => void
  showAddForm: boolean
  newCatName: string
  newCatColor: string
  onNewCatNameChange: (v: string) => void
  onNewCatColorChange: (v: string) => void
  onOpenAddForm: () => void
  onSubmitAddForm: () => void
  onCancelAddForm: () => void
}

const TagsManageTab: React.FC<TagsManageTabProps> = (props) => {
  const {
    tagCategories,
    tagsByCategory,
    occurrencesByTag,
    pendingTagSelection,
    pendingCategoryId,
    newEntityName,
    onNewEntityNameChange,
    onPickCategory,
    onCreateNewEntity,
    onAddToExistingEntity,
    onBackToCategories,
    onCancelPending,
    expandedCats,
    onExpandedCatsChange,
    expandedTagId,
    onToggleEntity,
    onUpdateEntityName,
    onUpdateEntityNotes,
    onDeleteEntity,
    onDeleteCategory,
    onNavigateToOccurrence,
    onRemoveOccurrence,
    registerItemRef,
    showAddForm,
    newCatName,
    newCatColor,
    onNewCatNameChange,
    onNewCatColorChange,
    onOpenAddForm,
    onSubmitAddForm,
    onCancelAddForm,
  } = props

  if (pendingTagSelection && !pendingCategoryId) {
    return (
      <PendingCategoryStep
        pendingText={pendingTagSelection.text}
        categories={tagCategories}
        onPickCategory={onPickCategory}
        onCancel={onCancelPending}
      />
    )
  }

  if (pendingTagSelection && pendingCategoryId) {
    const category = tagCategories.find((c) => c.id === pendingCategoryId)
    const entities = tagsByCategory.get(pendingCategoryId) || []
    return (
      <PendingEntityStep
        category={category}
        pendingText={pendingTagSelection.text}
        entities={entities}
        occurrenceCount={(id) => occurrencesByTag.get(id)?.length || 0}
        newEntityName={newEntityName}
        onNewEntityNameChange={onNewEntityNameChange}
        onCreate={onCreateNewEntity}
        onAddToExisting={onAddToExistingEntity}
        onBack={onBackToCategories}
        onCancel={onCancelPending}
      />
    )
  }

  return (
    <>
      <div className="flex-1 [&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-track]:bg-transparent py-1 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar]:w-1.5 overflow-y-auto">
        {tagCategories.length === 0 ? (
          <div className="px-3 py-5 text-(--fd-text-muted) text-xs italic text-center leading-normal">
            No categories yet. Add one below.
          </div>
        ) : (
          <ScrollArea className="w-full h-[calc(var(--app-h)-8dvh)]">
            <Accordion
              multiple
              value={expandedCats}
              onValueChange={onExpandedCatsChange}
            >
              {tagCategories.map((cat) => (
                <ManageCategoryItem
                  key={cat.id}
                  category={cat}
                  entities={tagsByCategory.get(cat.id) || []}
                  occurrencesByTag={occurrencesByTag}
                  expandedEntityId={expandedTagId}
                  onToggleEntity={onToggleEntity}
                  onUpdateEntityName={onUpdateEntityName}
                  onUpdateEntityNotes={onUpdateEntityNotes}
                  onDeleteEntity={onDeleteEntity}
                  onDeleteCategory={onDeleteCategory}
                  onNavigateToOccurrence={onNavigateToOccurrence}
                  onRemoveOccurrence={onRemoveOccurrence}
                  registerItemRef={registerItemRef}
                />
              ))}
            </Accordion>
          </ScrollArea>
        )}
      </div>

      <AddCategoryForm
        isOpen={showAddForm}
        name={newCatName}
        color={newCatColor}
        onNameChange={onNewCatNameChange}
        onColorChange={onNewCatColorChange}
        onOpen={onOpenAddForm}
        onSubmit={onSubmitAddForm}
        onCancel={onCancelAddForm}
      />
    </>
  )
}

export default TagsManageTab
