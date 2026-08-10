import React from 'react'
import type { Editor } from '@tiptap/react'

interface PagesPanelProps {
  editor: Editor | null
  scrollContainer?: HTMLDivElement | null
}

// TODO: port the page thumbnail grid, the ResizeObserver-driven thumbScale,
// and the scroll-sync effect that highlights the currently visible page.
// Those three are genuinely coupled (thumbScale needs the grid; scroll-sync
// needs both), so they can reasonably stay in one file — the old file's
// problem was every *other* view's logic living alongside them too.
const PagesPanel: React.FC<PagesPanelProps> = ({ editor, scrollContainer }) => {
  void editor
  void scrollContainer

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-3.5 py-2 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)">
          Pages
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-(--fd-text-muted) text-sm italic">
        Pages panel — content not yet ported.
      </div>
    </div>
  )
}

export default PagesPanel
