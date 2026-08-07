import { DEFAULT_TAG_CATEGORIES, useEditorStore } from '@/stores/editorStore'
import { clearTrackChanges } from './shared'
import type { Editor } from '@tiptap/react'
import { openBinaryFile, openTextFile } from '@/utils/open-draft/fileOps'
import { parseFDXFull } from '@/utils/open-draft/fdxParser'
import { parseOdraft } from '@/utils/open-draft/odraftFormat'
import { hydrateEditorStoresFromContent } from '@/utils/open-draft/hydrateStores'
import { showToast } from '@/components/open-draft/Toast'
import { parseFountain } from '@/utils/open-draft/fountainParser'
import { clearEditorHistory } from '@/editor/clearHistory'
import { useBackupStatusStore } from '@/stores/backupStatusStore'
import { useProjectStore } from '@/stores/projectStore'
import { parseDocx } from '@/utils/open-draft/docxImporter'

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

  const { setCurrentProject, setCurrentScriptId, setScripts } =
    useProjectStore.getState()

  try {
    const result = await openTextFile([
      {
        name: 'Screenplay',
        extensions: ['fountain', 'fdx', 'odraft', 'txt'],
      },
    ])
    if (!result) return

    const { name, content: text } = result
    const ext = name.split('.').pop()?.toLowerCase()

    const store = getStore(editor)

    let doc
    if (ext === 'fdx') {
      const parsed = parseFDXFull(text)
      doc = parsed.doc
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
    } else if (ext === 'odraft') {
      try {
        const parsed = parseOdraft(text)
        doc = parsed.content
        // Restore the script's notes, tags, beats and character profiles —
        // otherwise an imported .odraft loses everything but the text.
        hydrateEditorStoresFromContent(parsed.content)
        if (parsed.meta.title) {
          store.setDocumentTitle(parsed.meta.title)
        }
      } catch (parseErr) {
        showToast(
          `Invalid .odraft file: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
          'error',
        )
        return
      }
    } else {
      doc = parseFountain(text)
    }
    editor.commands.setContent(doc, true)
    clearEditorHistory(editor)

    // Open as unsaved document — user can save later via Cmd+S
    const scriptTitle =
      ext === 'odraft'
        ? store.documentTitle || name.replace(/\.\w+$/, '') || 'Untitled'
        : name.replace(/\.\w+$/, '') || 'Untitled'
    store.setDocumentTitle(scriptTitle)
    setCurrentProject(null)
    setCurrentScriptId(null)
    setScripts([])
    // Track that this is an imported document so Save As can warn the user
    // that the save goes to OpenDraft's library, not back to the source file.
    const fmtLabel =
      ext === 'fdx'
        ? 'Final Draft (.fdx)'
        : ext === 'fountain'
          ? 'Fountain (.fountain)'
          : ext === 'odraft'
            ? 'OpenDraft (.odraft)'
            : ext
              ? `.${ext}`
              : 'imported file'
    store.setImportedSource({ name, format: fmtLabel })
    // Imported files have no library copy — snapshot immediately.
    useBackupStatusStore.getState().noteDocumentOpened()
  } catch (err) {
    console.error('Import failed:', err)
    showToast(
      `Import failed: ${err instanceof Error ? err.message : String(err)}`,
      'error',
    )
  }
}

export const handleImportDocx = async (editor: Editor | null) => {
  if (!editor) return
  const { setCurrentProject, setCurrentScriptId, setScripts } =
    useProjectStore.getState()

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
    setCurrentProject(null)
    setCurrentScriptId(null)
    setScripts([])
    store.setImportedSource({ name, format: 'Microsoft Word (.docx)' })

    if (parsed.warnings.length > 0) {
      const summary =
        parsed.ambiguousCount > 0
          ? `Imported with ${parsed.ambiguousCount} paragraph(s) auto-classified as Action — review the script.`
          : `Imported with ${parsed.warnings.length} note(s). See console for details.`
      showToast(summary, 'info')
      for (const w of parsed.warnings) console.warn('[Word Import]', w)
    } else {
      showToast('Word document imported.', 'info')
    }
  } catch (err) {
    console.error('Word import failed:', err)
    showToast(
      `Word import failed: ${err instanceof Error ? err.message : String(err)}`,
      'error',
    )
  }
}
