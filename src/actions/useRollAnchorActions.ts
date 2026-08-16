import type { Editor } from '@tiptap/react'
import { useRollNoteStore } from '@/stores/rollNoteStore'

export function useRollAnchorActions(
  editor: Editor,
  onClose: () => void,
  existingRollAnchorId: string | null,
) {
  const deleteRollNote = useRollNoteStore((s) => s.deleteRollNote)

  const deleteRollAnchor = () => {
    if (!existingRollAnchorId) return
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
              node.attrs.anchorId === existingRollAnchorId
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

    deleteRollNote(existingRollAnchorId)
    onClose()
  }

  return { deleteRollAnchor }
}
