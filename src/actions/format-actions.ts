import type { Editor } from '@tiptap/react'

export const setFormatType = (editor: Editor | null, type: string) => {
  if (!editor) return
  editor.chain().focus().setNode(type).run()
}

const getFocussedEditor = (editor: Editor | null) => {
  return editor?.chain().focus(undefined, { scrollIntoView: false })
}

export const toggleBold = (editor: Editor | null) => {
  getFocussedEditor(editor)?.toggleBold().run()
}

export const toggleItalic = (editor: Editor | null) => {
  getFocussedEditor(editor)?.toggleItalic().run()
}

export const toggleUnderline = (editor: Editor | null) => {
  getFocussedEditor(editor)?.toggleUnderline().run()
}

export const toggleStrikethrough = (editor: Editor | null) => {
  getFocussedEditor(editor)?.toggleStrike().run()
}

export const toggleSubscript = (editor: Editor | null) => {
  getFocussedEditor(editor)?.toggleSubscript().run()
}

export const toggleSuperscript = (editor: Editor | null) => {
  getFocussedEditor(editor)?.toggleSuperscript().run()
}

export const setAlignment = (
  editor: Editor | null,
  align: 'left' | 'center' | 'right' | 'justify',
) => {
  getFocussedEditor(editor)?.setTextAlign(align).run()
}

export const toggleDualDialogue = (editor: Editor | null) => {
  editor?.commands?.toggleDualDialogue()
}
