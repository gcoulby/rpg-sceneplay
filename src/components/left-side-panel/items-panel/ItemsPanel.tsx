import React, { useCallback, useMemo, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/stores/editorStore'
import { useDocVersion } from '../utils/useDocVersion'
import {
  scanItemOccurrences,
  groupOccurrencesByItem,
} from './itemOccurrences'
import ItemOccurrenceRow from './ItemOccurrenceRow'
import * as ActivityPanel from '@/components/ui/activity-panel'

interface ItemsPanelProps {
  editor: Editor | null
}

/** Typed `[item]` mentions in the script, auto-collected — no manual
 *  tagging step (unlike the Tags panel this otherwise mirrors), since the
 *  `item` mark is applied by ItemMark's own input rule as you type. */
const ItemsPanel: React.FC<ItemsPanelProps> = ({ editor }) => {
  const { itemsVisible, setItemsVisible } = useEditorStore()
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const docVersion = useDocVersion(editor)

  const occurrences = useMemo(() => {
    void docVersion
    return scanItemOccurrences(editor)
  }, [editor, docVersion])

  const occurrencesByItem = useMemo(
    () => groupOccurrencesByItem(occurrences),
    [occurrences],
  )

  const sortedKeys = useMemo(
    () => Array.from(occurrencesByItem.keys()).sort(),
    [occurrencesByItem],
  )

  const handleNavigateToOccurrence = useCallback(
    (pos: number) => {
      if (!editor) return
      editor.chain().focus().setTextSelection(pos).run()
      const coords = editor.view.coordsAtPos(pos)
      const editorMain = document.querySelector('.editor-main')
      if (editorMain && coords) {
        const rect = editorMain.getBoundingClientRect()
        const scrollTo =
          editorMain.scrollTop + (coords.top - rect.top) - rect.height / 3
        editorMain.scrollTo({ top: scrollTo, behavior: 'auto' })
      }
    },
    [editor],
  )

  return (
    <ActivityPanel.Shell>
      <ActivityPanel.Header>
        <ActivityPanel.Title>Items</ActivityPanel.Title>
        <ActivityPanel.Interactions>
          <Badge variant="secondary" className="mr-auto text-[10px]">
            {sortedKeys.length}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className={`size-7 ${itemsVisible ? 'text-(--fd-accent)' : 'text-(--fd-text-muted) hover:text-(--fd-text)'}`}
            onClick={() => setItemsVisible(!itemsVisible)}
            title={itemsVisible ? 'Hide item highlights' : 'Show item highlights'}
            aria-label={
              itemsVisible ? 'Hide item highlights' : 'Show item highlights'
            }
          >
            {itemsVisible ? (
              <Eye className="size-3.5" />
            ) : (
              <EyeOff className="size-3.5" />
            )}
          </Button>
        </ActivityPanel.Interactions>
      </ActivityPanel.Header>
      <ActivityPanel.Content>
        {sortedKeys.length === 0 ? (
          <p className="p-2 text-[11px] text-(--fd-text-muted)">
            Type <code>[something]</code> anywhere in the script to track it
            as an item here.
          </p>
        ) : (
          sortedKeys.map((itemKey) => {
            const occs = occurrencesByItem.get(itemKey) ?? []
            const isExpanded = expandedKey === itemKey
            return (
              <div key={itemKey}>
                <div className="flex items-center gap-1.5 py-0.75 pr-1 pl-1 text-[11px]">
                  <span
                    className="flex-1 font-semibold text-(--fd-text) hover:text-(--fd-accent) whitespace-nowrap text-ellipsis overflow-hidden cursor-pointer"
                    onClick={() => handleNavigateToOccurrence(occs[0].from)}
                    title="Navigate to first occurrence"
                  >
                    {itemKey}
                  </span>
                  <Badge
                    variant="secondary"
                    className="px-1.25 py-px text-[10px] shrink-0"
                    title={`${occs.length} occurrence${occs.length !== 1 ? 's' : ''}`}
                  >
                    {occs.length}
                  </Badge>
                  {occs.length > 1 && (
                    <button
                      className="bg-transparent hover:text-(--fd-text) px-0.5 py-0 border-none text-(--fd-text-muted) cursor-pointer shrink-0"
                      onClick={() =>
                        setExpandedKey(isExpanded ? null : itemKey)
                      }
                      title={isExpanded ? 'Hide occurrences' : 'Show occurrences'}
                      aria-label={
                        isExpanded
                          ? `Hide occurrences for ${itemKey}`
                          : `Show occurrences for ${itemKey}`
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-3" />
                      ) : (
                        <ChevronDown className="size-3" />
                      )}
                    </button>
                  )}
                </div>
                {isExpanded && occs.length > 1 && (
                  <div className="pt-1 pr-1 pb-2 pl-4">
                    {occs.map((occ, i) => (
                      <ItemOccurrenceRow
                        key={`${occ.from}-${i}`}
                        occurrence={occ}
                        onNavigate={handleNavigateToOccurrence}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </ActivityPanel.Content>
    </ActivityPanel.Shell>
  )
}

export default ItemsPanel
