import React from 'react'
import type { Editor } from '@tiptap/react'

interface StructurePanelProps {
  editor: Editor | null
}

// TODO: port computeScriptStructure, the collapsedActs/collapsedSequences
// state, and the act -> sequence -> scene tree. Navigation should use
// useGoToScene rather than a local copy.
const StructurePanel: React.FC<StructurePanelProps> = ({ editor }) => {
  void editor

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-3.5 py-2 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)">
          Structure
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 text-(--fd-text-muted) text-sm italic">
        Structure panel — content not yet ported.
      </div>
    </div>
  )
}

export default StructurePanel
