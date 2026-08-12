import type { Editor } from '@tiptap/react'
import { useEditorStore, DEFAULT_PAGE_LAYOUT } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { clearEditorHistory } from '@/editor/clearHistory'
import { clearSessionDoc } from '@/utils/open-draft/sessionDoc'
import { applyScriptFormat } from '@/utils/open-draft/applyScriptFormat'
import { clearTrackChanges } from './shared'

function resetForNewScreenplay(editor: Editor) {
  clearTrackChanges(editor)
  clearEditorHistory(editor)
  clearSessionDoc()

  // A new screenplay is a new document — drop the id so the first autosave
  // creates a fresh row instead of overwriting the one just closed.
  useProjectStore.getState().setCurrentDocId(null)

  const store = useEditorStore.getState()
  store.setDocumentTitle('Untitled Screenplay')
  store.setBeats([])
  store.setBeatColumns([])
  store.setBeatArrangeMode('auto')
  store.setNotes([])
  store.setTags([])
  store.setTagCategories([])
  store.setCharacterProfiles([])
  store.setScenes([])
  store.setPageLayout({ ...DEFAULT_PAGE_LAYOUT })

  if (window.location.pathname !== '/') {
    window.history.replaceState(null, '', '/')
  }
}

/** The menu-bound action. */
export function newScreenplay(editor: Editor | null) {
  const settings = useSettingsStore.getState()
  const enabled = settings.enabledScriptFormats
  if (editor) resetForNewScreenplay(editor)
  applyScriptFormat(editor, enabled[0])
}
