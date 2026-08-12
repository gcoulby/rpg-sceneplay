import type { Editor } from '@tiptap/react'
import type { ResolvedPos } from '@tiptap/pm/model'
import {
  NOTE_COLORS,
  useEditorStore,
  type ElementType,
} from '@/stores/editorStore'
import { deriveContextLabel } from '../components/context-menu/helpers/deriveContextLabel'
import type { SavedSelection } from '../components/context-menu/types'

export function useScriptNoteActions(
  editor: Editor,
  onClose: () => void,
  currentNodeType: ElementType,
  resolvedFrom: ResolvedPos,
  hasSelection: boolean,
  savedSelection: SavedSelection,
  existingNoteId: string | null,
) {
  const addNote = useEditorStore((state) => state.addNote)
  const deleteNote = useEditorStore((state) => state.deleteNote)
  const setNoteFilter = useEditorStore((state) => state.setNoteFilter)
  const toggleScriptNotes = useEditorStore((state) => state.toggleScriptNotes)
  const scriptNotesOpen = useEditorStore((state) => state.scriptNotesOpen)

  const findEnclosingSceneId = (upToPos: number) => {
    let sceneId: string | null = null
    let sceneIndex = 0
    editor.state.doc.nodesBetween(0, upToPos, (node) => {
      if (node.type.name === 'sceneHeading') {
        sceneId = `scene-${sceneIndex}`
        sceneIndex++
      }
      return true
    })
    return sceneId
  }

  const addScriptNote = () => {
    const { from, to } = savedSelection
    const anchorText = hasSelection
      ? editor.state.doc.textBetween(from, to, ' ')
      : editor.state.doc.textBetween(
          resolvedFrom.start(),
          resolvedFrom.end(),
          ' ',
        )

    const contextLabel = deriveContextLabel(
      editor,
      resolvedFrom,
      currentNodeType,
    )
    const defaultColor = NOTE_COLORS[0]
    const noteId = addNote({
      content: '',
      anchorText: anchorText.slice(0, 120),
      elementType: currentNodeType,
      contextLabel,
      color: defaultColor.name,
      sceneId: findEnclosingSceneId(from),
    })

    const markFrom = hasSelection ? from : resolvedFrom.start()
    const markTo = hasSelection ? to : resolvedFrom.end()
    editor
      .chain()
      .focus()
      .setTextSelection({ from: markFrom, to: markTo })
      .setMark('scriptNote', { noteId, color: defaultColor.hex })
      .run()

    setNoteFilter({
      elementType: null,
      contextLabel: null,
      color: null,
      noteId,
    })
    if (!scriptNotesOpen) toggleScriptNotes()
    onClose()
  }

  const editScriptNote = () => {
    if (existingNoteId) {
      setNoteFilter({
        elementType: null,
        contextLabel: null,
        color: null,
        noteId: existingNoteId,
      })
    }
    if (!scriptNotesOpen) toggleScriptNotes()
    onClose()
  }

  const deleteScriptNote = () => {
    if (!existingNoteId) return
    const { doc, schema } = editor.state
    const markType = schema.marks.scriptNote

    if (markType) {
      editor
        .chain()
        .focus()
        .command(({ tr }) => {
          doc.descendants((node, pos) => {
            if (!node.isText) return
            const mark = node.marks.find(
              (m) => m.type === markType && m.attrs.noteId === existingNoteId,
            )
            if (mark) {
              tr.removeMark(pos, pos + node.nodeSize, mark)
            }
          })
          return true
        })
        .run()
    }

    deleteNote(existingNoteId)
    onClose()
  }

  return { addScriptNote, editScriptNote, deleteScriptNote }
}
