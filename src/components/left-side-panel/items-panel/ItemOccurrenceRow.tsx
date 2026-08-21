import React from 'react'
import type { ItemOccurrence } from './itemOccurrences'

interface ItemOccurrenceRowProps {
  occurrence: ItemOccurrence
  onNavigate: (from: number) => void
}

/** Mirrors tags-panel/OccurrenceRow.tsx, minus the remove button — items
 *  aren't manually assigned, so there's nothing to detach; deleting the
 *  bracketed text from the script is what removes an occurrence. */
const ItemOccurrenceRow: React.FC<ItemOccurrenceRowProps> = ({
  occurrence,
  onNavigate,
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
  </div>
)

export default ItemOccurrenceRow
