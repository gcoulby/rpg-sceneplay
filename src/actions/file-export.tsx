import { showToast } from '@/components/open-draft/Toast'
import { useEditorStore } from '@/stores/editorStore'
import { downloadDocx } from '@/utils/open-draft/docxExporter'
import { downloadFDX } from '@/utils/open-draft/fdxExporter'
import { downloadFountain } from '@/utils/open-draft/fountainExporter'
import { downloadOdraft, downloadSceneplay } from '@/storage/formats/sceneplayFormat'
import { exportPDF } from '@/utils/open-draft/pdfExporter'
import { buildSaveContent } from '@/storage/saveContent'
import { packAssets } from '@/storage/assetStore'
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

/**
 * Shared body for the two native-format exports. `.sceneplay` and `.odraft`
 * carry an identical payload — only the extension differs — so the only thing
 * that varies is which download function runs.
 */
const exportNative = async (
  editor: Editor | null,
  download: typeof downloadOdraft,
  label: string,
) => {
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

    // Embed the images the document references. Without this, an exported file
    // opened anywhere else comes back with every image broken — the assets live
    // outside the document, as ids pointing into this browser's storage.
    const { assets, truncated } = await packAssets(content)

    await download(meta, content, {
      assets,
      assetsOmitted: truncated,
    })
    if (truncated) {
      showToast(
        'Exported, but some images were too large to embed — the file will show them as missing elsewhere.',
        'info',
      )
    }
  } catch (err) {
    console.error(`${label} export failed:`, err)
    showToast(
      `Export failed: ${err instanceof Error ? err.message : String(err)}`,
      'error',
    )
  }
}

/** File → Export → Sceneplay (.sceneplay) — the native format going forward. */
export const handleExportSceneplay = (editor: Editor | null) =>
  exportNative(editor, downloadSceneplay, 'Sceneplay')

/** File → Export → OpenDraft (.odraft) — same payload, historical extension. */
export const handleExportOdraft = (editor: Editor | null) =>
  exportNative(editor, downloadOdraft, 'OpenDraft')
