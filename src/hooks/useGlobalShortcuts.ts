import { useEffect } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { newScreenplay } from '@/actions/new-screenplay'
import { buildStorageDoc } from '@/storage/buildStorageDoc'
import {
  chooseMode,
  getActiveMode,
  saveActiveDoc,
} from '@/storage/storageManager'
import { useBrowserStorageStatusStore } from '@/stores/browserStorageStatusStore'

/** Cmd/Ctrl+S — flush the document to whichever provider is active. */
async function saveCurrentScript() {
  const { editor, setSaveStatus } = useEditorStore.getState()
  if (!editor) return
  const doc = buildStorageDoc(editor)
  if (!doc) return
  setSaveStatus('saving')
  try {
    await saveActiveDoc(doc)
    useBrowserStorageStatusStore.getState().noteSuccess()
    setSaveStatus('saved')
  } catch (err) {
    console.error('Save failed:', err)
    const message = err instanceof Error ? err.message : String(err)
    setSaveStatus('error', message)
    useBrowserStorageStatusStore.getState().noteFailure(message)
  }
}

/**
 * Cmd/Ctrl+Shift+S — "Save As" now means "start saving automatically into a
 * file on disk". There is no dialog: the browser's own file picker is the
 * dialog, and once a file is connected autosave is already running, so a second
 * press while in disk mode has nothing to do.
 */
async function saveAsFile() {
  if (getActiveMode() === 'disk') {
    void saveCurrentScript()
    return
  }
  const title = useEditorStore.getState().documentTitle
  const ok = await chooseMode('disk', title)
  if (!ok) return
  useBrowserStorageStatusStore.getState().setMode('disk')
  void saveCurrentScript()
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
          if (e.shiftKey) void saveAsFile()
          else void saveCurrentScript()
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
