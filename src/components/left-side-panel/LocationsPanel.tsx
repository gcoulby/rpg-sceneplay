import React from 'react'
import type { Editor } from '@tiptap/react'

interface LocationsPanelProps {
  editor: Editor | null
  scrollContainer?: HTMLDivElement | null
}

const LocationsPanel: React.FC<LocationsPanelProps> = ({
  editor,
  scrollContainer,
}) => {
  void editor
  void scrollContainer

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-3.5 py-2 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)">
          Locations
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-(--fd-text-muted) text-sm italic">
        Locations panel — content not yet ported.
      </div>
    </div>
  )
}

export default LocationsPanel
