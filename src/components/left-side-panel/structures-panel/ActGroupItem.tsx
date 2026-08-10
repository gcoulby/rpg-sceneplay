import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { ScriptAct } from './structureTypes'
import SequenceGroupItem from './SequenceGroupItem'
import StructureSceneRow from './StructureSceneRow'

interface ActGroupItemProps {
  act: ScriptAct
  openSequences: string[]
  onOpenSequencesChange: (v: string[]) => void
  onSelectScene: (sceneIndex: number) => void
}

const ActGroupItem: React.FC<ActGroupItemProps> = ({
  act,
  openSequences,
  onOpenSequencesChange,
  onSelectScene,
}) => {
  const displayName = act.customName
    ? `${act.actName}: ${act.customName}`
    : act.actName

  return (
    <AccordionItem
      value={`${act.actNumber}-${act.docPos}`}
      className="border-b border-(--fd-overlay-subtle)"
    >
      <AccordionTrigger className="px-3 py-2.5 gap-1.5 bg-(--fd-overlay-subtle) hover:no-underline hover:bg-(--fd-overlay-light)">
        <span className="flex-1 text-[13px] font-bold tracking-[0.02em] text-(--fd-text) uppercase text-left">
          {displayName}
        </span>
        <span className="text-[11px] text-(--fd-text-muted) bg-(--fd-overlay-light) px-2 py-0.5 rounded-lg shrink-0">
          {act.scenes.length}
        </span>
      </AccordionTrigger>

      <AccordionContent className="px-0 pb-1">
        {act.sequences.length > 0 && (
          <Accordion
            multiple
            value={openSequences}
            onValueChange={onOpenSequencesChange}
          >
            {act.sequences.map((seq) => (
              <SequenceGroupItem
                key={seq.id}
                seq={seq}
                onSelectScene={onSelectScene}
              />
            ))}
          </Accordion>
        )}
        {act.orphanScenes.length > 0 && (
          <div className="pl-3">
            {act.orphanScenes.map((s) => (
              <StructureSceneRow
                key={`orph-scene-${s.sceneIndex}`}
                scene={s}
                onSelectScene={onSelectScene}
              />
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

export default ActGroupItem
