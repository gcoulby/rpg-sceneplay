import { useEffect } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { newScreenplay } from '@/actions/new-screenplay'
import { buildSaveContent } from '@/utils/open-draft/saveContent'
import { scriptApi } from '@/services/scriptApi'
import { reportSaveError } from '@/stores/saveErrorStore'

async function saveCurrentScript() {
  const { editor, setSaveAsOpen, setSaveStatus } = useEditorStore.getState()
  const { currentProject, currentScriptId } = useProjectStore.getState()
  if (!editor) return
  if (!currentProject || !currentScriptId) {
    setSaveAsOpen(true)
    return
  }
  setSaveStatus('saving')
  try {
    const content = buildSaveContent(editor)
    if (!content) return
    await scriptApi.saveScript(currentProject.id, currentScriptId, { content })
    setSaveStatus('saved')
  } catch (err) {
    console.error('Save failed:', err)
    setSaveStatus('error', err instanceof Error ? err.message : String(err))
    reportSaveError(err, 'manual-save')
  }
}

/**
 * App-wide keyboard shortcuts that aren't owned by a single dialog.
 * Find (Cmd/Ctrl+F) and Find Next (Cmd/Ctrl+G) already bind themselves inside
 * search-replace-comp.tsx, and Cmd/Ctrl+G is claimed there for "find next" —
 * so Go to Page intentionally has no shortcut here to avoid colliding with it.
 */
export function useGlobalShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F7' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        const store = useEditorStore.getState()
        if (e.shiftKey) store.setWritingSuggestionsOpen(true)
        else store.setSpellCheckOpen(true)
        return
      }

      if (!e.metaKey && !e.ctrlKey) return
      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault()
          newScreenplay(useEditorStore.getState().editor)
          break
        case 's':
        case 'S':
          e.preventDefault()
          if (e.shiftKey) useEditorStore.getState().setSaveAsOpen(true)
          else saveCurrentScript()
          break
        case 'p':
        case 'P':
          e.preventDefault()
          window.print()
          break
        case '=':
        case '+':
          e.preventDefault()
          useEditorStore
            .getState()
            .setZoomLevel(
              Math.min(300, useEditorStore.getState().zoomLevel + 10),
            )
          break
        case '-':
          e.preventDefault()
          useEditorStore
            .getState()
            .setZoomLevel(
              Math.max(50, useEditorStore.getState().zoomLevel - 10),
            )
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
