import { ScrollArea } from '@/components/ui/scroll-area'
import React from 'react'

export const CharacterSheet = () => {
  return (
    <ScrollArea className="h-(--app-h)">
      <div className="flex items-start py-2.5 px-4 border-b border-(--fd-border) bg-(--fd-navigator-bg) shrink-0 gap-10">
        <span className="font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
          Script Statistics
        </span>
      </div>
      <div className="p-4">
        <p>Not Implemented Yet</p>
      </div>
    </ScrollArea>
  )
}
