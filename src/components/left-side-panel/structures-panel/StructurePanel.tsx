import React, { useMemo, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorStore } from '@/stores/editorStore'
import { Accordion } from '@/components/ui/accordion'
import {
  computeScriptStructure,
  type ScriptStructure,
} from '@/utils/open-draft/scriptStructure'
import { useGoToScene } from '../utils/useGoToScene'
import { useDocVersion } from '../utils/useDocVersion'
import ActGroupItem from './ActGroupItem'
import { ScrollArea } from '@/components/ui/scroll-area'

interface StructurePanelProps {
  editor: Editor | null
  scrollContainer?: HTMLDivElement | null
}

const StructurePanel: React.FC<StructurePanelProps> = ({
  editor,
  scrollContainer,
}) => {
  const { scenes } = useEditorStore()
  const { goToScene } = useGoToScene(editor, scrollContainer)
  const docVersion = useDocVersion(editor)

  // Base UI's Accordion value is always an array of open item values —
  // both of these hold zero or more entries since acts and sequences can
  // each have multiple open at once, matching the old Set<number>/Set<string>
  // behaviour.
  const [openActs, setOpenActs] = useState<string[]>([])
  const [openSequences, setOpenSequences] = useState<string[]>([])

  // computeScriptStructure walks the full document (act breaks, sequence
  // markers), not just headings, so it needs the same docVersion
  // invalidation Scenes/Pages needed — `scenes` alone wouldn't catch a
  // newly inserted Act Break.
  const structure: ScriptStructure = useMemo(() => {
    void docVersion
    if (!editor) return { acts: [], sceneActMap: new Map(), totalScenes: 0 }
    try {
      return computeScriptStructure(editor.getJSON())
    } catch {
      return { acts: [], sceneActMap: new Map(), totalScenes: 0 }
    }
  }, [editor, scenes, docVersion])

  const actCount = useMemo(
    () => structure.acts.filter((a) => a.actNumber > 0).length,
    [structure],
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-3.5 py-2 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)">
          Structure
        </span>
        <span className="text-xs text-(--fd-text) opacity-70">
          {actCount || '—'} acts
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="w-full h-[calc(var(--app-h)-3dvh)]">
          {structure.acts.length === 0 ? (
            <div className="p-6 px-4 text-(--fd-text) opacity-70 text-[13px] italic text-center">
              No structure yet. Insert an Act Break from the element selector,
              or start writing scenes.
            </div>
          ) : (
            <Accordion value={openActs} onValueChange={setOpenActs}>
              {structure.acts.map((act) => (
                <ActGroupItem
                  key={`act-${act.actNumber}-${act.docPos}`}
                  act={act}
                  openSequences={openSequences}
                  onOpenSequencesChange={setOpenSequences}
                  onSelectScene={goToScene}
                />
              ))}
            </Accordion>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

export default StructurePanel
