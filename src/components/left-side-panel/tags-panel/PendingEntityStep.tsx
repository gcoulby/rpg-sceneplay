import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { TagCategoryItem, TagItem } from './tagTypes'

interface PendingEntityStepProps {
  category: TagCategoryItem | undefined
  pendingText: string
  entities: TagItem[]
  occurrenceCount: (entityId: string) => number
  newEntityName: string
  onNewEntityNameChange: (v: string) => void
  onCreate: () => void
  onAddToExisting: (entity: TagItem) => void
  onBack: () => void
  onCancel: () => void
}

const PendingEntityStep: React.FC<PendingEntityStepProps> = ({
  category,
  pendingText,
  entities,
  occurrenceCount,
  newEntityName,
  onNewEntityNameChange,
  onCreate,
  onAddToExisting,
  onBack,
  onCancel,
}) => {
  const createBtnRef = useRef<HTMLButtonElement>(null)
  const createActionRef = useRef(onCreate)
  useEffect(() => {
    createActionRef.current = onCreate
  })

  useEffect(() => {
    const btn = createBtnRef.current
    if (!btn) return
    const handler = (e: Event) => {
      e.preventDefault()
      createActionRef.current()
    }
    btn.addEventListener('touchstart', handler, { passive: false })
    return () => btn.removeEventListener('touchstart', handler)
  }, [])

  return (
    <div className="border-b-2 border-(--fd-accent) bg-(--fd-navigator-bg) flex-1 flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1.5 text-[13px] text-(--fd-text) font-semibold">
        <span>
          {category?.name} &rarr; &ldquo;{pendingText.slice(0, 30)}
          {pendingText.length > 30 ? '...' : ''}&rdquo;
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-(--fd-text-muted)"
          onClick={onCancel}
          aria-label="Cancel pending tag selection"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="px-3.5 py-2.5 border-white/6 border-b">
        <div className="text-[11px] text-(--fd-accent) uppercase tracking-[0.4px] pt-1.5 pb-1.5 font-semibold">
          Create new:
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <Input
            className="flex-1 min-h-11 text-base"
            type="text"
            value={newEntityName}
            onChange={(e) => onNewEntityNameChange(e.target.value)}
            placeholder="Entity name..."
            aria-label="New entity name"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newEntityName.trim()) onCreate()
            }}
          />
          <Button
            ref={createBtnRef}
            className="min-h-11 touch-manipulation shrink-0 [-webkit-tap-highlight-color:rgba(0,0,0,0.1)]"
            onClick={onCreate}
          >
            Create
          </Button>
        </div>
      </div>

      {entities.length > 0 && (
        <>
          <div className="text-[11px] text-(--fd-accent) uppercase tracking-[0.4px] px-3.5 pb-1.5 font-semibold mt-1.5 pt-1.5 border-t border-(--fd-overlay-subtle)">
            Or add to existing:
          </div>
          <div className="flex-1 pb-1 overflow-y-auto">
            {entities.map((entity) => (
              <div
                key={entity.id}
                className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer text-sm text-(--fd-text) min-h-10 border-b border-(--fd-border) justify-between hover:bg-(--fd-accent) hover:text-white"
                onClick={() => onAddToExisting(entity)}
              >
                <span className="font-medium">{entity.name}</span>
                <Badge variant="secondary" className="px-1.5 py-px text-[10px]">
                  {occurrenceCount(entity.id)}
                </Badge>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        className="block w-full bg-transparent border-none border-t border-(--fd-overlay-subtle) text-(--fd-text-muted) text-[11px] px-2.5 py-2 text-left cursor-pointer hover:text-(--fd-accent)"
        onClick={onBack}
      >
        &larr; Back to categories
      </button>
    </div>
  )
}

export default PendingEntityStep
