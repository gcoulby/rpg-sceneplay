/**
 * The single definition of a saveable script payload.
 *
 * A saved script is the TipTap document JSON with per-screenplay app state
 * spread alongside it as `_`-prefixed top-level keys. ProseMirror ignores the
 * extra keys, and the loader in ScreenplayEditor destructures them back out.
 *
 * This lived in two places (MenuBar and ScreenplayEditor) and the copies
 * DIVERGED: MenuBar's omitted the eight spelling/grammar keys, so a manual
 * Cmd+S overwrote the stored blob with a payload missing them and the settings
 * were silently reset on the next load. Everything that persists a script must
 * now go through this one function.
 *
 * Keep `SAVE_METADATA_KEYS` in step with the object built below — the backup
 * and .odraft round-trip tests assert the two agree.
 */
import type { Editor } from '@tiptap/react'
import { useEditorStore } from '@/stores/editorStore'
import { useFormattingTemplateStore } from '@/stores/formattingTemplateStore'
import { spellChecker } from '@/editor/spellchecker'
import { grammarIgnore } from '@/editor/grammar/grammarIgnore'
import { useMapStore } from '@/components/screens/map/useMapStore'
import { useSheetStore } from '@/components/screens/character-sheets/store/useSheetStore'
import { useOracleStore } from '@/stores/oracleStore'
import { useRollNoteStore } from '@/stores/rollNoteStore'
import { usePdfViewerStore } from '@/components/screens/pdf-viewer/store/usePdfViewerStore'

/**
 * Every `_`-prefixed key `buildSaveContent` writes. Used to separate app
 * metadata from the ProseMirror document without hand-maintaining a second
 * list at each read site.
 */
export const SAVE_METADATA_KEYS = [
  '_notes',
  '_generalNotes',
  '_tags',
  '_tagCategories',
  '_characterProfiles',
  '_characterRelationships',
  '_otherEntities',
  '_graphRelationships',
  '_beats',
  '_beatColumns',
  '_beatArrangeMode',
  '_templateId',
  '_ignoredWords',
  '_ignoredOnce',
  '_customDictWords',
  '_enabledGlobalDicts',
  '_projectDictEnabled',
  '_enabledLanguages',
  '_ignoredGrammarRules',
  '_ignoredGrammarOnce',
  '_spellCheckEnabled',
  '_grammarCheckEnabled',
  '_sceneNumbersVisible',
  '_sceneNumbersLocked',
  '_pageLayout',
  '_map',
  '_locationMapRefs',
  '_sheets',
  '_oracleSources',
  '_oracleCollections',
  '_oracleCombos',
  '_rollNotes',
  '_pdfEmbeds',
  '_pdfAnnotations',
  '_pdfFormValues',
] as const

export type SaveMetadataKey = (typeof SAVE_METADATA_KEYS)[number]

/**
 * Build a saveable content object: editor JSON + store metadata at top level.
 * Returns undefined when there is no usable editor, which every caller treats
 * as "nothing to save" rather than "save an empty document".
 */
export function buildSaveContent(
  editor: Editor | null,
): Record<string, unknown> | undefined {
  if (!editor || editor.isDestroyed) return undefined
  const store = useEditorStore.getState()
  const tplStore = useFormattingTemplateStore.getState()
  const mapStore = useMapStore.getState()
  const sheetStore = useSheetStore.getState()
  const oracleStore = useOracleStore.getState()
  const rollNoteStore = useRollNoteStore.getState()
  const pdfStore = usePdfViewerStore.getState()
  const doc = editor.getJSON()
  return {
    ...doc,
    _notes: store.notes,
    _generalNotes: store.generalNotes,
    _tags: store.tags,
    _tagCategories: store.tagCategories,
    _characterProfiles: store.characterProfiles,
    _characterRelationships: store.characterRelationships,
    _otherEntities: store.otherEntities,
    _graphRelationships: store.graphRelationships,
    _beats: store.beats,
    _beatColumns: store.beatColumns,
    _beatArrangeMode: store.beatArrangeMode,
    _templateId: tplStore.activeTemplateId,
    _ignoredWords: spellChecker.getIgnoredWords(),
    _ignoredOnce: spellChecker.getIgnoredOnce(),
    // Project dictionary lives on the Project entity now; keep the script
    // field empty so older clients don't show stale words after migration.
    _customDictWords: [],
    _enabledGlobalDicts: spellChecker.getEnabledGlobalDicts(),
    _projectDictEnabled: spellChecker.isProjectDictionaryEnabled(),
    _enabledLanguages: spellChecker.getEnabledLanguages(),
    _ignoredGrammarRules: grammarIgnore.getIgnoredRules(),
    _ignoredGrammarOnce: grammarIgnore.getIgnoredOnce(),
    _spellCheckEnabled: store.spellCheckEnabled,
    _grammarCheckEnabled: store.grammarCheckEnabled,
    _sceneNumbersVisible: store.sceneNumbersVisible,
    _sceneNumbersLocked: store.sceneNumbersLocked,
    _pageLayout: store.pageLayout,
    _map: mapStore.map,
    _locationMapRefs: mapStore.locationMapRefs,
    _sheets: sheetStore.sheets,
    _oracleSources: oracleStore.userSources,
    _oracleCollections: oracleStore.userCollections,
    _oracleCombos: oracleStore.userCombos,
    _rollNotes: rollNoteStore.rollNotes,
    _pdfEmbeds: pdfStore.embeds,
    _pdfAnnotations: pdfStore.annotations,
    _pdfFormValues: pdfStore.formValues,
  }
}

/**
 * Split a stored payload into the ProseMirror document and the app metadata.
 * Neither half is mutated; unknown keys stay with the document, matching how
 * the existing destructuring load paths behave.
 */
export function stripSaveMetadata(
  content: Record<string, unknown> | null | undefined,
): {
  pmDoc: Record<string, unknown>
  metadata: Partial<Record<SaveMetadataKey, unknown>>
} {
  const pmDoc: Record<string, unknown> = {}
  const metadata: Partial<Record<SaveMetadataKey, unknown>> = {}
  if (!content || typeof content !== 'object') return { pmDoc, metadata }
  const known = new Set<string>(SAVE_METADATA_KEYS)
  for (const [key, value] of Object.entries(content)) {
    if (known.has(key)) metadata[key as SaveMetadataKey] = value
    else pmDoc[key] = value
  }
  return { pmDoc, metadata }
}

/**
 * True when a payload carries any of the `_`-prefixed app metadata. Import
 * paths use this to decide whether rehydrating the stores from a file would
 * restore real state or just wipe the current state with empties.
 */
export function hasSaveMetadata(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false
  return SAVE_METADATA_KEYS.some(
    (key) => key in (content as Record<string, unknown>),
  )
}

/**
 * Keys whose non-emptiness signals the user has added real content, distinct
 * from settings/config keys that carry a non-empty default regardless of
 * whether the user has touched anything (e.g. `_tagCategories`, `_pageLayout`
 * are always populated). Used by `hasSaveableCollections` below.
 */
const SAVEABLE_COLLECTION_KEYS = [
  '_notes',
  '_generalNotes',
  '_tags',
  '_characterProfiles',
  '_characterRelationships',
  '_otherEntities',
  '_graphRelationships',
  '_beats',
  '_map',
  '_sheets',
  '_oracleSources',
  '_oracleCollections',
  '_oracleCombos',
  '_rollNotes',
  '_pdfEmbeds',
  '_pdfAnnotations',
  '_pdfFormValues',
] as const satisfies readonly SaveMetadataKey[]

/**
 * True when the payload has real user-added content in any collection-shaped
 * metadata key (PDFs, character sheets, notes, tags, beats, the map, oracle
 * data, roll notes) — even when there's no prose text yet.
 *
 * `docHasAnyText` deliberately ignores all `_`-prefixed metadata (its own doc
 * comment says so) — it exists purely to guard against blanking an existing
 * document, not to answer "does this document have anything worth persisting
 * at all". Using it alone for that second question meant a document whose
 * only content was e.g. an imported PDF, with no prose ever typed, silently
 * never autosaved — the whole write was skipped, metadata included.
 */
export function hasSaveableCollections(
  content: Record<string, unknown> | null | undefined,
): boolean {
  if (!content) return false
  return SAVEABLE_COLLECTION_KEYS.some((key) => {
    const value = content[key]
    if (Array.isArray(value)) return value.length > 0
    if (value && typeof value === 'object') return Object.keys(value).length > 0
    return false
  })
}
