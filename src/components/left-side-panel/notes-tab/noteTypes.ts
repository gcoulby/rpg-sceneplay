import { useEditorStore, NOTE_COLORS, type NoteColor } from '@/stores/editorStore'

type EditorStoreState = ReturnType<typeof useEditorStore.getState>

export type ScriptNote = EditorStoreState['notes'][number]
export type GeneralNote = EditorStoreState['generalNotes'][number]

export function getNoteColorHex(colorName: NoteColor): string {
  const c = NOTE_COLORS.find((nc) => nc.name === colorName)
  return c ? c.hex : NOTE_COLORS[0].hex
}
