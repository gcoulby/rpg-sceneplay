import type { Editor } from '@tiptap/core'

export const handleCut = async (editor: Editor | null) => {
  const selection = editor?.state.selection
  if (!selection) return
  const { from, to } = selection
  if (from === to) return // nothing selected

  const text = editor?.state.doc.textBetween(from, to, '\n')
  await navigator.clipboard.writeText(text)

  editor?.chain().focus().deleteRange({ from, to }).run()
}

export const handleCopy = async (editor: Editor | null) => {
  const selection = editor?.state.selection
  if (!selection) return
  const { from, to } = selection
  const text = editor?.state.doc.textBetween(from, to, '\n')
  await navigator.clipboard.writeText(text)
}

export const handlePaste = async (editor: Editor | null) => {
  if (!editor) return
  const text = await navigator.clipboard.readText()
  editor.chain().focus().insertContent(text).run()
}

export const handleSelectAll = (editor: Editor | null) => {
  editor?.chain().focus().selectAll().run()
}

export const handleUndo = (editor: Editor | null) => {
  editor?.chain().focus().undo().run()
}

export const handleRedo = (editor: Editor | null) => {
  editor?.chain().focus().redo().run()
}
