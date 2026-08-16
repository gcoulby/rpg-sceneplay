import type { Editor } from '@tiptap/react'

export interface ExistingTagInfo {
  tagId: string
  categoryId: string
}

interface ExistingAnnotations {
  existingNoteId: string | null
  existingTagInfo: ExistingTagInfo | null
  existingRollAnchorId: string | null
}

export function getExistingAnnotations(editor: Editor): ExistingAnnotations {
  const pos = editor.state.selection.$from
  const storedMarks = pos.marks()
  const nodeAtCursor = pos.nodeAfter || pos.nodeBefore

  const noteMarkType = editor.schema.marks.scriptNote
  const noteMark = noteMarkType
    ? storedMarks.find((mark) => mark.type === noteMarkType) ??
      nodeAtCursor?.marks.find((mark) => mark.type === noteMarkType)
    : undefined
  const existingNoteId = noteMark ? (noteMark.attrs.noteId as string) : null

  const tagMarkType = editor.schema.marks.productionTag
  const tagMark = tagMarkType
    ? storedMarks.find((mark) => mark.type === tagMarkType) ??
      nodeAtCursor?.marks.find((mark) => mark.type === tagMarkType)
    : undefined
  const existingTagInfo = tagMark
    ? { tagId: tagMark.attrs.tagId as string, categoryId: tagMark.attrs.categoryId as string }
    : null

  const rollAnchorType = editor.schema.nodes.rollAnchor
  const rollAnchorNode =
    rollAnchorType &&
    (pos.nodeAfter?.type === rollAnchorType
      ? pos.nodeAfter
      : pos.nodeBefore?.type === rollAnchorType
        ? pos.nodeBefore
        : undefined)
  const existingRollAnchorId = rollAnchorNode
    ? (rollAnchorNode.attrs.anchorId as string)
    : null

  return { existingNoteId, existingTagInfo, existingRollAnchorId }
}
