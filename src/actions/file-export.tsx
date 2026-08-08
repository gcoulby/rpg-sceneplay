import { showToast } from '@/components/open-draft/Toast'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { downloadDocx } from '@/utils/open-draft/docxExporter'
import { downloadFDX } from '@/utils/open-draft/fdxExporter'
import { downloadFountain } from '@/utils/open-draft/fountainExporter'
import { downloadOdraft } from '@/utils/open-draft/odraftFormat'
import { exportPDF } from '@/utils/open-draft/pdfExporter'
import { buildSaveContent } from '@/utils/open-draft/saveContent'
import type { Editor } from '@tiptap/react'

export const handleExportFDX = async (editor: Editor | null) => {
  if (!editor) return
  try {
    const store = useEditorStore.getState()
    await downloadFDX(
      editor.getJSON(),
      store.documentTitle,
      store.characterProfiles,
      store.tagCategories,
      store.tags,
      store.beats,
      store.beatColumns,
      store.pageLayout,
    )
  } catch (err) {
    console.error('FDX export failed:', err)
    showToast(
      `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      'error',
    )
  }
}

export const handleExportFountain = async (editor: Editor | null) => {
  if (!editor) return

  const store = useEditorStore.getState()

  try {
    await downloadFountain(editor.getJSON(), store.documentTitle)
  } catch (err) {
    console.error('Fountain export failed:', err)
    showToast(
      `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      'error',
    )
  }
}

export const handleExportPDF = async (editor: Editor | null) => {
  if (!editor) return
  try {
    const store = useEditorStore.getState()
    await exportPDF(editor.getJSON(), store.documentTitle, store.pageLayout, {
      sceneNumbersVisible: store.sceneNumbersVisible,
      documentTitle: store.documentTitle,
      revisionColor: store.revisionMode ? store.revisionColor : '',
    })
  } catch (err) {
    console.error('PDF export failed:', err)
    showToast(
      `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      'error',
    )
  }
}

export const handleExportDocx = async (editor: Editor | null) => {
  if (!editor) return
  try {
    const store = useEditorStore.getState()
    await downloadDocx(
      editor.getJSON(),
      store.documentTitle,
      store.pageLayout,
      {
        documentTitle: store.documentTitle,
        revisionColor: store.revisionMode ? store.revisionColor : '',
      },
    )
  } catch (err) {
    console.error('Word export failed:', err)
    showToast(
      `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      'error',
    )
  }
}

export const handleExportOdraft = async (editor: Editor | null) => {
  if (!editor) return
  try {
    const store = useEditorStore.getState()
    const meta = {
      id: '',
      title: store.documentTitle,
      author: '',
      format: 'json',
      created_at: '',
      updated_at: '',
      page_count: store.pageCount,
      size_bytes: 0,
      color: '',
      pinned: false,
      sort_order: 0,
      preview: '',
    }
    // Must be the full save payload, not the bare editor JSON: the latter
    // drops notes, tags, beats, character profiles and every other
    // `_`-prefixed store key, so the exported file could never restore the
    // script it came from.
    const content = buildSaveContent(editor)
    if (!content) return

    const { currentProject, currentScriptId } = useProjectStore.getState()

    await downloadOdraft(meta, content, {
      projectId: currentProject?.id ?? null,
      scriptId: currentScriptId ?? null,
      projectTitle: currentProject?.name,
    })
  } catch (err) {
    console.error('OpenDraft export failed:', err)
    showToast(
      `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      'error',
    )
  }
}
