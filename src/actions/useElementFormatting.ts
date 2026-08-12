import type { Editor } from '@tiptap/react'
import type { ElementType } from '@/stores/editorStore'
import { useFormattingTemplateStore } from '@/stores/formattingTemplateStore'
import {
  getCurrentElementRule,
  getLockedFormatting,
} from '@/utils/open-draft/effectiveFormatting'
import {
  setFormatType,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrikethrough,
  toggleSubscript,
  toggleSuperscript,
} from '@/actions/format-actions'

function toggleAllCaps(editor: Editor | null) {
  if (!editor) return
  const { from, to } = editor.state.selection
  if (from === to) return
  const text = editor.state.doc.textBetween(from, to)
  const isUpper = text === text.toUpperCase()
  const newText = isUpper ? text.toLowerCase() : text.toUpperCase()
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.insertText(newText, from, to)
      return true
    })
    .run()
}

export function useElementFormatting(editor: Editor) {
  const activeTemplate = useFormattingTemplateStore((state) =>
    state.getActiveTemplate(),
  )
  const isEnforceMode = activeTemplate.mode === 'enforce'
  const rule = getCurrentElementRule(editor, activeTemplate)
  const locked = getLockedFormatting(rule, isEnforceMode)

  return {
    activeTemplate,
    locked,
    setElement: (type: ElementType) => setFormatType(editor, type),
    toggleBold: () => !locked.bold && toggleBold(editor),
    toggleItalic: () => !locked.italic && toggleItalic(editor),
    toggleUnderline: () => !locked.underline && toggleUnderline(editor),
    toggleStrike: () => !locked.strikethrough && toggleStrikethrough(editor),
    toggleSubscript: () => !locked.subscript && toggleSubscript(editor),
    toggleSuperscript: () => !locked.superscript && toggleSuperscript(editor),
    toggleAllCaps: () => !locked.textTransform && toggleAllCaps(editor),
  }
}
