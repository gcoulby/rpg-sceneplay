import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import * as ActivityPanel from '@/components/ui/activity-panel'
import { cn } from '@/lib/utils'
import { useRollNoteStore } from '@/stores/rollNoteStore'
import { formatRollResult, formatRawRoll } from '@/oracles/rollFormat'
import {
  ROLL_CATEGORY_COLORS,
  ROLL_CATEGORY_LABELS,
} from '@/oracles/rollCategoryColors'
import { useDocVersion } from '../utils/useDocVersion'

interface RollsPanelProps {
  editor: Editor | null
}

export default function RollsPanel({ editor }: RollsPanelProps) {
  const rollNotes = useRollNoteStore((s) => s.rollNotes)
  const deleteRollNote = useRollNoteStore((s) => s.deleteRollNote)
  const focusedRollId = useRollNoteStore((s) => s.focusedRollId)
  const setFocusedRollId = useRollNoteStore((s) => s.setFocusedRollId)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const docVersion = useDocVersion(editor)

  // A roll is orphaned once its anchor glyph has been deleted from the
  // script — the RollNote record survives (so the roll isn't lost/copy
  // buttons still work) but there's nowhere left to jump to.
  const presentAnchorIds = useMemo(() => {
    const ids = new Set<string>()
    if (!editor) return ids
    const nodeType = editor.state.schema.nodes.rollAnchor
    if (!nodeType) return ids
    editor.state.doc.descendants((node) => {
      if (node.type === nodeType) ids.add(node.attrs.anchorId as string)
    })
    return ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, docVersion])

  // Clicking a roll anchor glyph in the editor sets focusedRollId — scroll
  // to and briefly highlight the matching card, then clear it so a repeat
  // click on the same anchor re-triggers the effect.
  useEffect(() => {
    if (!focusedRollId) return
    cardRefs.current[focusedRollId]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    const timeout = setTimeout(() => setFocusedRollId(null), 1600)
    return () => clearTimeout(timeout)
  }, [focusedRollId, setFocusedRollId])

  const formatDate = useCallback((iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  const handleNavigate = useCallback(
    (anchorId: string) => {
      if (!editor) return
      const { doc, schema } = editor.state
      const nodeType = schema.nodes.rollAnchor
      if (!nodeType) return

      let targetPos: number | null = null
      doc.descendants((node, pos) => {
        if (targetPos !== null) return false
        if (node.type === nodeType && node.attrs.anchorId === anchorId) {
          targetPos = pos
          return false
        }
      })

      if (targetPos !== null) {
        editor.chain().focus().setTextSelection(targetPos).run()
        const coords = editor.view.coordsAtPos(targetPos)
        const editorMain = document.querySelector('.editor-main')
        if (editorMain && coords) {
          const rect = editorMain.getBoundingClientRect()
          const scrollTo =
            editorMain.scrollTop + (coords.top - rect.top) - rect.height / 3
          editorMain.scrollTo({ top: scrollTo, behavior: 'auto' })
        }
      }
    },
    [editor],
  )

  const handleDelete = useCallback(
    (anchorId: string) => {
      if (editor) {
        const { doc, schema } = editor.state
        const nodeType = schema.nodes.rollAnchor
        if (nodeType) {
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              doc.descendants((node, pos) => {
                if (
                  node.type === nodeType &&
                  node.attrs.anchorId === anchorId
                ) {
                  tr.delete(pos, pos + node.nodeSize)
                  return false
                }
                return true
              })
              return true
            })
            .run()
        }
      }
      deleteRollNote(anchorId)
    },
    [editor, deleteRollNote],
  )

  return (
    <ActivityPanel.Shell>
      <ActivityPanel.Header>
        <ActivityPanel.Title>
          Rolls{rollNotes.length > 0 ? ` (${rollNotes.length})` : ''}
        </ActivityPanel.Title>
      </ActivityPanel.Header>
      <ActivityPanel.Content>
        {rollNotes.length === 0 && (
          <p className="p-3 text-muted-foreground text-sm">
            Right-click in the editor and choose "Roll..." to record a roll.
          </p>
        )}
        <div className="flex flex-col gap-2 p-2">
          {rollNotes.map((note) => {
            const isOrphaned = !presentAnchorIds.has(note.anchorId)
            return (
              <div
                key={note.id}
                ref={(el) => {
                  cardRefs.current[note.id] = el
                }}
                className={cn(
                  'flex flex-col gap-1.5 border rounded-md transition-colors overflow-hidden',
                  focusedRollId === note.id &&
                    'ring-2 ring-primary bg-primary/5',
                  isOrphaned && 'opacity-70 border-destructive/40',
                )}
              >
                {isOrphaned && (
                  <div className="flex justify-between items-center bg-destructive/10 px-2.5 py-1 border-destructive/20 border-b text-destructive text-[10px]">
                    <span>Not in script</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 py-0.5 border-destructive h-auto text-destructive text-[10px]"
                      onClick={() => handleDelete(note.anchorId)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <div className="flex flex-col gap-1.5 p-2.5">
                  <div className="flex justify-between items-center gap-2">
                    <button
                      type="button"
                      disabled={isOrphaned}
                      onClick={() => handleNavigate(note.anchorId)}
                      className="flex items-center gap-1.5 min-w-0 text-left disabled:cursor-default"
                    >
                      <span
                        className="rounded-full w-2.5 h-2.5 shrink-0"
                        style={{
                          backgroundColor: ROLL_CATEGORY_COLORS[note.category],
                        }}
                      />
                      <span className="font-medium text-xs uppercase tracking-wide">
                        {ROLL_CATEGORY_LABELS[note.category]}
                      </span>
                    </button>
                    <span className="text-muted-foreground text-xs shrink-0">
                      {formatDate(note.timestamp)}
                    </span>
                  </div>

                  <span className="font-medium text-xs uppercase tracking-wide">
                    {formatRawRoll(note.value)}
                  </span>
                  <p className="text-sm truncate">
                    {formatRollResult(note.value)}
                  </p>

                  <div className="flex justify-between items-center gap-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            formatRollResult(note.value),
                          )
                        }
                      >
                        Copy result
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            formatRawRoll(note.value),
                          )
                        }
                      >
                        Copy raw roll
                      </Button>
                    </div>
                    {!isOrphaned && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-destructive text-xs"
                        onClick={() => handleDelete(note.anchorId)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ActivityPanel.Content>
    </ActivityPanel.Shell>
  )
}
