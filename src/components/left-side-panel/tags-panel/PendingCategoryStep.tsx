import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TagCategoryItem } from './tagTypes'

interface PendingCategoryStepProps {
  pendingText: string
  categories: TagCategoryItem[]
  onPickCategory: (catId: string) => void
  onCancel: () => void
}

const PendingCategoryStep: React.FC<PendingCategoryStepProps> = ({
  pendingText,
  categories,
  onPickCategory,
  onCancel,
}) => (
  <div className="border-b-2 border-(--fd-accent) bg-(--fd-navigator-bg) flex-1 flex flex-col overflow-y-auto">
    <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1.5 text-[13px] text-(--fd-text) font-semibold">
      <span>
        Tag: &ldquo;{pendingText.slice(0, 40)}
        {pendingText.length > 40 ? '...' : ''}&rdquo;
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
    <div className="text-[11px] text-(--fd-accent) uppercase tracking-[0.4px] px-3.5 pt-1.5 pb-1.5 font-semibold">
      Select a category:
    </div>
    <div className="flex-1 pb-1 overflow-y-auto">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer text-sm text-(--fd-text) min-h-10 border-b border-(--fd-border) hover:bg-(--fd-accent) hover:text-white"
          onClick={() => onPickCategory(cat.id)}
        >
          <span
            className="inline-block rounded-[3px] w-3.5 h-3.5 shrink-0"
            style={{ background: cat.color }}
          />
          <span>{cat.name}</span>
        </div>
      ))}
    </div>
  </div>
)

export default PendingCategoryStep
