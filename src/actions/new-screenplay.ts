import type { Editor } from '@tiptap/react'
import { useEditorStore, DEFAULT_PAGE_LAYOUT } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { clearEditorHistory } from '@/editor/clearHistory'
import { clearSessionDoc } from '@/utils/sessionDoc'
import { applyScriptFormat } from '@/utils/applyScriptFormat'
import { confirmOrRun, clearTrackChanges } from './shared'

type PickerMode = 'reset' | 'apply-only'

/** Clears per-script session state for a fresh screenplay. Does NOT seed
 *  content — caller picks the format after this runs. */
function resetForNewScreenplay(editor: Editor) {
  clearTrackChanges(editor)
  clearEditorHistory(editor)
  clearSessionDoc()

  const { setCurrentProject, setCurrentScriptId, setScripts } =
    useProjectStore.getState()
  setCurrentProject(null)
  setCurrentScriptId(null)
  setScripts([])

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

/** Applies the chosen format. 'reset' clears project context first
 *  (top-level New Screenplay); 'apply-only' leaves it intact (in-project
 *  script creation, where the caller already set project context). */
export function finishNewScreenplayWithFormat(
  editor: Editor,
  templateId: string,
  mode: PickerMode = 'reset',
) {
  if (mode === 'reset') resetForNewScreenplay(editor)
  applyScriptFormat(editor, templateId)
}

/** Decides whether to apply a format directly or prompt for one, based on
 *  how many script formats the user has enabled in Settings. */
export function promptForNewScreenplayFormat(
  editor: Editor | null,
  mode: PickerMode,
) {
  if (!editor) return
  const store = useEditorStore.getState()
  store.setFormatPickerMode(mode)

  const settings = useSettingsStore.getState()
  const enabled = settings.enabledScriptFormats

  if (!settings.formatPreferencesInitialized) {
    store.setFormatPrefsOpen({
      firstRun: true,
      afterSave: 'apply-new-screenplay',
    })
    return
  }

  if (enabled.length === 0) {
    store.setFormatPrefsOpen({
      firstRun: false,
      afterSave: 'apply-new-screenplay',
    })
    return
  }

  if (enabled.length === 1) {
    finishNewScreenplayWithFormat(editor, enabled[0], mode)
    return
  }

  store.setFormatPickerOpen(true)
}

/** The menu-bound action. */
export function newScreenplay(editor: Editor | null) {
  confirmOrRun(editor, () => promptForNewScreenplayFormat(editor, 'reset'))
}
