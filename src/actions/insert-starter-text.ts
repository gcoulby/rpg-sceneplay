import type { Editor } from '@tiptap/react'
import { getActiveTemplate } from '@/utils/activeTemplate'

/** Appends the active template's example/starter content to the end of the
 *  document. Used by the "Add Starter Text" menu item — unlike New
 *  Screenplay, this doesn't touch any existing content. */
export function insertStarterText(editor: Editor | null): void {
  if (!editor || editor.isDestroyed) return

  const starterDocument = getActiveTemplate().starterDocument
  if (!starterDocument || starterDocument.length === 0) return

  editor
    .chain()
    .focus('end')
    .insertContentAt(
      editor.state.doc.content.size,
      starterDocument as unknown as Parameters<
        Editor['commands']['insertContentAt']
      >[1],
    )
    .run()
}
