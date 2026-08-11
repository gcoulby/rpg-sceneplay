import React from 'react'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { ScriptSequence } from './structureTypes'
import StructureSceneRow from './StructureSceneRow'

interface SequenceGroupItemProps {
  seq: ScriptSequence
  onSelectScene: (sceneIndex: number) => void
}

const SequenceGroupItem: React.FC<SequenceGroupItemProps> = ({
  seq,
  onSelectScene,
}) => {
  return (
    <AccordionItem value={seq.id} className="pl-3">
      <AccordionTrigger className="px-3 py-1.5 gap-1.5 hover:no-underline hover:bg-(--fd-overlay-subtle)">
        <span
          className="rounded-full w-2 h-2 shrink-0"
          style={{ background: seq.color }}
        />
        <span className="flex-1 text-xs text-(--fd-text) whitespace-nowrap overflow-hidden text-ellipsis text-left">
          {seq.name}
        </span>
        <span className="text-[10px] text-(--fd-text-muted) shrink-0">
          {seq.scenes.length}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pl-3 pb-0">
        {seq.scenes.map((s) => (
          <StructureSceneRow
            key={`seq-scene-${s.sceneIndex}`}
            scene={s}
            onSelectScene={onSelectScene}
          />
        ))}
      </AccordionContent>
    </AccordionItem>
  )
}

export default SequenceGroupItem
