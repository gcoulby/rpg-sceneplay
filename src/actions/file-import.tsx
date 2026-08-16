import { DEFAULT_TAG_CATEGORIES, useEditorStore } from '@/stores/editorStore'
import { clearTrackChanges } from './shared'
import type { Editor } from '@tiptap/react'
import { openBinaryFile } from '@/storage/fileOps'
import { parseFDXFull } from '@/utils/open-draft/fdxParser'
import {
  parseSceneplayAny,
  isSceneplayFile,
} from '@/storage/formats/sceneplayFormat'
import { hydrateEditorStoresFromContent } from '@/storage/hydrateStores'
import { unpackAssets } from '@/storage/assetStore'
import { showToast } from '@/actions/show-toast'
import { parseFountain } from '@/utils/open-draft/fountainParser'
import { clearEditorHistory } from '@/editor/clearHistory'
import { useProjectStore } from '@/stores/projectStore'
import { parseDocx } from '@/utils/open-draft/docxImporter'
import { useFormattingTemplateStore } from '@/stores/formattingTemplateStore'
import { remapImportedDoc } from '@/utils/open-draft/importRemap'

function getStore(editor: Editor | null) {
  // Clear previous document state before importing
  clearTrackChanges(editor)
  const store = useEditorStore.getState()
  store.setBeats([])
  store.setBeatColumns([])
  store.setBeatArrangeMode('auto')
  store.setNotes([])
  store.setTags([])
  store.setTagCategories([...DEFAULT_TAG_CATEGORIES])
  store.setCharacterProfiles([])
  store.setScenes([])
  return store
}

export const handleImport = async (editor: Editor | null) => {
  if (!editor) return

  try {
    const result = await openBinaryFile([
      {
        name: 'Screenplay',
        extensions: ['sceneplay', 'fountain', 'fdx', 'odraft', 'txt'],
      },
    ])
    if (!result) return

    const { name, content: buf } = result
    const ext = name.split('.').pop()?.toLowerCase()
    // `.sceneplay` and `.odraft` are the same schema under two extensions.
    const isNative = isSceneplayFile(name)
    // fdx/fountain/txt are always text; native files may be a zip (v3) or
    // flat JSON (v1/v2) — parseSceneplayAny sniffs which, so it reads `buf`
    // directly rather than needing this decode.
    const text = isNative ? '' : new TextDecoder().decode(buf)

    const store = getStore(editor)
    const activeTemplate = useFormattingTemplateStore.getState().getActiveTemplate()

    let doc
    if (ext === 'fdx') {
      const parsed = parseFDXFull(text)
      doc = remapImportedDoc(
        parsed.doc as Parameters<typeof remapImportedDoc>[0],
        activeTemplate,
        'fdx',
      )
      if (parsed.pageLayout) {
        store.setPageLayout({
          ...store.pageLayout,
          ...parsed.pageLayout,
        })
      }
      // Import beats from Outline elements
      if (parsed.beats.length > 0) {
        store.setBeats(parsed.beats)
        if (parsed.beatColumns.length > 0) {
          store.setBeatColumns(parsed.beatColumns)
        }
      }
      // Import character profiles from CastList + CharacterHighlighting
      if (
        parsed.castList.length > 0 ||
        parsed.characterHighlighting.length > 0
      ) {
        const highlightMap = new Map(
          parsed.characterHighlighting.map((h) => [h.name.toUpperCase(), h]),
        )
        for (const member of parsed.castList) {
          const hl = highlightMap.get(member.name.toUpperCase())
          store.upsertCharacterProfile(member.name, {
            description: member.description,
            color: hl?.color || '',
            highlighted: hl?.highlighted || false,
          })
          highlightMap.delete(member.name.toUpperCase())
        }
        // Remaining highlights without cast entries
        for (const [, hl] of highlightMap) {
          store.upsertCharacterProfile(hl.name, {
            color: hl.color,
            highlighted: hl.highlighted,
          })
        }
      }
    } else if (isNative) {
      try {
        const parsed = await parseSceneplayAny(buf)
        doc = remapImportedDoc(
          parsed.content as Parameters<typeof remapImportedDoc>[0],
          activeTemplate,
          'odraft',
        )
        // Restore the script's notes, tags, beats and character profiles —
        // otherwise an imported file loses everything but the text.
        hydrateEditorStoresFromContent(parsed.content)
        if (parsed.meta.title) {
          store.setDocumentTitle(parsed.meta.title)
        }
        // Decode any embedded images back into local storage, keeping their ids
        // so the document's `assetId` references still resolve. The document has
        // no id until the first autosave, so the assets are stored unscoped and
        // still resolve by id.
        await unpackAssets(parsed.assets, null)
      } catch (parseErr) {
        showToast({
          description: `Invalid .${ext} file: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
          type: 'error',
        })
        return
      }
    } else {
      doc = remapImportedDoc(
        parseFountain(text) as Parameters<typeof remapImportedDoc>[0],
        activeTemplate,
        'fountain',
      )
    }
    editor.commands.setContent(doc, true)
    clearEditorHistory(editor)

    // Open as unsaved document — user can save later via Cmd+S
    const scriptTitle = isNative
      ? store.documentTitle || name.replace(/\.\w+$/, '') || 'Untitled'
      : name.replace(/\.\w+$/, '') || 'Untitled'
    store.setDocumentTitle(scriptTitle)
    // An imported file is a new document — drop the id so the first autosave
    // creates a fresh row rather than overwriting whatever was open.
    useProjectStore.getState().setCurrentDocId(null)
    // Track that this is an imported document so the UI can note that
    // automatic saving does not write back to the source file.
    const FORMAT_LABELS: Record<string, string> = {
      fdx: 'Final Draft (.fdx)',
      fountain: 'Fountain (.fountain)',
      sceneplay: 'Sceneplay (.sceneplay)',
      odraft: 'OpenDraft (.odraft)',
    }
    const fmtLabel =
      (ext && FORMAT_LABELS[ext]) || (ext ? `.${ext}` : 'imported file')
    store.setImportedSource({ name, format: fmtLabel })
  } catch (err) {
    console.error('Import failed:', err)
    showToast({
      description: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      type: 'error',
    })
  }
}

export const handleImportDocx = async (editor: Editor | null) => {
  if (!editor) return
  try {
    const result = await openBinaryFile([
      { name: 'Word Document', extensions: ['docx'] },
    ])
    if (!result) return

    const { name, content } = result
    const parsed = await parseDocx(content)

    const store = getStore(editor)

    editor.commands.setContent(parsed.doc, true)
    clearEditorHistory(editor)

    const scriptTitle =
      parsed.scriptTitle || name.replace(/\.\w+$/, '') || 'Untitled'
    store.setDocumentTitle(scriptTitle)
    // An imported file is a new document — drop the id so the first autosave
    // creates a fresh row rather than overwriting whatever was open.
    useProjectStore.getState().setCurrentDocId(null)
    store.setImportedSource({ name, format: 'Microsoft Word (.docx)' })

    if (parsed.warnings.length > 0) {
      const summary =
        parsed.ambiguousCount > 0
          ? `Imported with ${parsed.ambiguousCount} paragraph(s) auto-classified as Action — review the script.`
          : `Imported with ${parsed.warnings.length} note(s). See console for details.`
      showToast({ description: summary, type: 'info' })
      for (const w of parsed.warnings) console.warn('[Word Import]', w)
    } else {
      showToast({ description: 'Word document imported.', type: 'info' })
    }
  } catch (err) {
    console.error('Word import failed:', err)
    showToast({
      description: `Word import failed: ${err instanceof Error ? err.message : String(err)}`,
      type: 'error',
    })
  }
}
