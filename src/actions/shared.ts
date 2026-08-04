import { Editor } from '@tiptap/react'
import { useEditorStore } from '@/stores/editorStore'
import { trackChangesPluginKey } from '@/editor/trackChanges'

export function clearTrackChanges(editor: Editor | null) {
  const { trackChangesEnabled, setTrackChangesEnabled, setTrackChangesLabel } =
    useEditorStore.getState()
  if (!trackChangesEnabled) return
  setTrackChangesEnabled(false)
  setTrackChangesLabel('')
  if (editor) {
    const { tr } = editor.state
    tr.setMeta(trackChangesPluginKey, { enabled: false, baseline: null })
    editor.view.dispatch(tr)
  }
}
