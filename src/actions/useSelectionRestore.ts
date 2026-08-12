import { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import type { ElementType } from '@/stores/editorStore'
import type { ResolvedPos } from '@tiptap/pm/model'
import type {
  SavedSelection,
  SelectionRange,
} from '../components/context-menu/types'

interface SelectionRestoreResult {
  savedSelection: SavedSelection
  resolvedFrom: ResolvedPos
  currentNodeType: ElementType
  hasSelection: boolean
}

export function useSelectionRestore(
  editor: Editor,
  overrideSelection?: SelectionRange,
): SelectionRestoreResult {
  const initialFrom = overrideSelection?.from ?? editor.state.selection.from
  const initialTo = overrideSelection?.to ?? editor.state.selection.to

  const savedSelectionRef = useRef<SavedSelection>({
    from: initialFrom,
    to: initialTo,
    empty: initialFrom === initialTo,
  })

  useEffect(() => {
    if (!overrideSelection || overrideSelection.from === overrideSelection.to)
      return

    const docSize = editor.state.doc.content.size
    const from = Math.min(overrideSelection.from, docSize)
    const to = Math.min(overrideSelection.to, docSize)
    if (from >= to) return

    try {
      const tr = editor.state.tr.setSelection(
        TextSelection.create(editor.state.doc, from, to),
      )
      editor.view.dispatch(tr)
    } catch (error) {
      console.warn('ScriptContextMenu: failed to restore selection', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const safeFrom = Math.min(
    savedSelectionRef.current.from,
    editor.state.doc.content.size,
  )
  const resolvedFrom = editor.state.doc.resolve(safeFrom)
  const currentNodeType = resolvedFrom.parent.type.name as ElementType

  return {
    savedSelection: savedSelectionRef.current,
    resolvedFrom,
    currentNodeType,
    hasSelection: !savedSelectionRef.current.empty,
  }
}
