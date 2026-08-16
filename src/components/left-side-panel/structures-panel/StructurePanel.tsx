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
import * as ActivityPanel from '@/components/ui/activity-panel'

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
    void scenes
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
    <ActivityPanel.Shell>
      <ActivityPanel.Header>
        <ActivityPanel.Title>Structure</ActivityPanel.Title>
        <ActivityPanel.Meta>{actCount || '—'} acts</ActivityPanel.Meta>
      </ActivityPanel.Header>
      <ActivityPanel.Content>
        {structure.acts.length === 0 ? (
          <div className="p-6 px-4 text-(--fd-text) opacity-70 text-[13px] italic text-center">
            No structure yet. Insert an Act Break from the element selector, or
            start writing scenes.
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
      </ActivityPanel.Content>
    </ActivityPanel.Shell>
  )
}

export default StructurePanel
