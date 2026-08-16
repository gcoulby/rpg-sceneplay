import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorStore } from '@/stores/editorStore'
import { Accordion } from '@/components/ui/accordion'
import { groupByLocation, parseHeading } from '../utils/scene-utils'
import { blockContentRange, singleLine } from '@/utils/open-draft/nodeText'
import { useGoToScene } from '../utils/useGoToScene'
import LocationGroupItem from './LocationGroupItem'
import { showToast } from '@/actions/show-toast'
import * as ActivityPanel from '@/components/ui/activity-panel'

interface LocationsPanelProps {
  editor: Editor | null
  scrollContainer?: HTMLDivElement | null
}

const LocationsPanel: React.FC<LocationsPanelProps> = ({
  editor,
  scrollContainer,
}) => {
  const { scenes } = useEditorStore()
  const { goToScene } = useGoToScene(editor, scrollContainer)
  const [expandedLocation, setExpandedLocation] = useState<string[]>([])
  const [renamingLocation, setRenamingLocation] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)
  const locations = useMemo(() => groupByLocation(scenes), [scenes])

  useEffect(() => {
    if (renamingLocation && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingLocation])

  const handleRenameSubmit = useCallback(() => {
    if (!editor || !renamingLocation || !renameValue.trim()) {
      setRenamingLocation(null)
      return
    }
    const oldName = renamingLocation
    const newName = renameValue.trim()
    if (oldName === newName) {
      setRenamingLocation(null)
      return
    }

    const { doc, schema, tr } = editor.state
    const sceneHeadingType = schema.nodes.sceneHeading
    if (!sceneHeadingType) {
      setRenamingLocation(null)
      return
    }

    let skippedBroken = 0
    doc.descendants((node, pos) => {
      if (node.type.name !== 'sceneHeading') return true
      const heading = node.textContent
      if (heading.includes('\n')) {
        if (
          parseHeading(singleLine(heading)).location.toUpperCase() ===
          oldName.toUpperCase()
        ) {
          skippedBroken++
        }
        return true
      }
      const parsed = parseHeading(heading)
      if (parsed.location.toUpperCase() !== oldName.toUpperCase()) return true
      let newHeading = parsed.preamble
      if (parsed.prefix) newHeading += parsed.prefix + ' '
      newHeading += newName
      if (parsed.timeOfDay) {
        const usesDot =
          /\.\s*\w+\.?\s*$/.test(heading) && !/\s-\s/.test(heading)
        newHeading += usesDot
          ? '. ' + parsed.timeOfDay + '.'
          : ' - ' + parsed.timeOfDay
      }
      const { from, to } = blockContentRange(node, pos)
      tr.insertText(newHeading, from, to)
      return true
    })

    if (skippedBroken > 0) {
      showToast({
        description: `Skipped ${skippedBroken} scene heading${skippedBroken === 1 ? '' : 's'} containing a line break`,
        type: 'info',
      })
    }

    if (tr.steps.length > 0) editor.view.dispatch(tr)
    setRenamingLocation(null)
    setExpandedLocation([newName.toUpperCase()])
  }, [editor, renamingLocation, renameValue])

  return (
    <ActivityPanel.Shell>
      <ActivityPanel.Header>
        <ActivityPanel.Title>Locations</ActivityPanel.Title>
        <ActivityPanel.Meta>{locations.length}</ActivityPanel.Meta>
      </ActivityPanel.Header>
      <ActivityPanel.Content>
        {locations.length === 0 ? (
          <div className="p-6 px-4 text-(--fd-text) opacity-70 text-[13px] italic text-center">
            No locations yet. Scene headings like &ldquo;INT. COFFEE SHOP -
            DAY&rdquo; will appear here.
          </div>
        ) : (
          <Accordion
            multiple
            value={expandedLocation}
            onValueChange={setExpandedLocation}
          >
            {locations.map((group) => {
              const key = group.name.toUpperCase()
              return (
                <LocationGroupItem
                  key={key}
                  group={group}
                  isRenaming={renamingLocation === key}
                  renameValue={renameValue}
                  onStartRename={() => {
                    setRenamingLocation(key)
                    setRenameValue(group.name)
                  }}
                  onRenameValueChange={setRenameValue}
                  onRenameSubmit={handleRenameSubmit}
                  onRenameCancel={() => setRenamingLocation(null)}
                  renameInputRef={renameInputRef}
                  onSelectScene={goToScene}
                />
              )
            })}
          </Accordion>
        )}
      </ActivityPanel.Content>
    </ActivityPanel.Shell>
  )
}

export default LocationsPanel
