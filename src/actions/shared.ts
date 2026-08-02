import type { Editor } from '@tiptap/react'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { trackChangesPluginKey } from '@/editor/trackChanges'

/** True if closing/replacing the current doc right now would lose work. */
export function editorHasUnsavedChanges(editor: Editor | null): boolean {
  if (!editor) return false
  const { currentProject, currentScriptId } = useProjectStore.getState()
  if (currentProject && currentScriptId) {
    const status = useEditorStore.getState().saveStatus
    return status === 'unsaved' || status === 'saving' || status === 'error'
  }
  return editor.state.doc.textContent.trim().length > 0
}

/** Runs `action` immediately, or defers it behind the discard-confirm dialog
 *  if there's unsaved work. The dialog component reads `pendingAction` off
 *  the store and calls it on Discard / after Save. */
export function confirmOrRun(editor: Editor | null, action: () => void) {
  if (editorHasUnsavedChanges(editor)) {
    useEditorStore.getState().setPendingAction(action)
    useEditorStore.getState().setDiscardConfirmOpen(true)
  } else {
    action()
  }
}

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
