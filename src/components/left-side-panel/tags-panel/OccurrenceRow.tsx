import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TagOccurrence } from './tagOccurrences'

interface OccurrenceRowProps {
  occurrence: TagOccurrence
  onNavigate: (from: number) => void
  onRemove?: (occurrence: TagOccurrence) => void
}

const OccurrenceRow: React.FC<OccurrenceRowProps> = ({
  occurrence,
  onNavigate,
  onRemove,
}) => (
  <div className="flex items-center gap-1.5 py-0.75 text-[11px]">
    <span
      className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer text-(--fd-accent) hover:underline"
      onClick={() => onNavigate(occurrence.from)}
      title="Navigate to this occurrence"
    >
      &ldquo;{occurrence.text.slice(0, 40)}
      {occurrence.text.length > 40 ? '...' : ''}&rdquo;
    </span>
    {occurrence.sceneName && (
      <span className="text-[10px] text-(--fd-text-muted) whitespace-nowrap overflow-hidden text-ellipsis max-w-30 shrink-0">
        {occurrence.sceneName.slice(0, 30)}
      </span>
    )}
    {onRemove && (
      <Button
        variant="ghost"
        size="icon"
        className="size-4 text-(--fd-text-muted) hover:text-[#ff6b6b]"
        onClick={() => onRemove(occurrence)}
        title="Remove this occurrence"
      >
        <X className="size-3" />
      </Button>
    )}
  </div>
)

export default OccurrenceRow
