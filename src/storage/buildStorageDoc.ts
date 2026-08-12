/**
 * Turn the live editor into a `StorageDoc`.
 *
 * One definition, shared by the autosave loop and the manual Cmd+S path, so the
 * two can't drift into writing different payloads for the same document — the
 * bug `saveContent.ts` exists to prevent, one level up.
 */
import type { Editor } from '@tiptap/react'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { buildSaveContent } from './saveContent'
import { indexedDbProvider } from './providers/indexedDbProvider'
import type { StorageDoc } from './types'

/**
 * Returns null when there is nothing worth saving (no usable editor). The
 * caller decides what that means; every call site treats it as "skip", never
 * as "save an empty document".
 *
 * Mints and records a document id on first use, so the first save creates a row
 * and every later save updates it rather than piling up duplicates.
 */
export function buildStorageDoc(editor: Editor | null): StorageDoc | null {
  const content = buildSaveContent(editor)
  if (!content) return null

  const store = useEditorStore.getState()
  const projects = useProjectStore.getState()
  let id = projects.currentDocId
  if (!id) {
    id = indexedDbProvider.newId()
    projects.setCurrentDocId(id)
  }

  return {
    id,
    meta: {
      title: store.documentTitle,
      author: '',
      color: '',
      page_count: store.pageCount,
    },
    content,
    updatedAt: new Date().toISOString(),
  }
}
