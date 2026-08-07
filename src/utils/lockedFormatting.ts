import { useFormattingTemplateStore } from '@/stores/formattingTemplateStore'
import {
  getCurrentElementRule,
  getLockedFormatting,
} from './open-draft/effectiveFormatting'
import type { Editor } from '@tiptap/core'

export const getLockedFormattingOption = (editor: Editor | null) => {
  const activeTemplate = useFormattingTemplateStore
    .getState()
    .getActiveTemplate()
  const isEnforceMode = activeTemplate.mode === 'enforce'
  const editorRule = editor
    ? getCurrentElementRule(editor, activeTemplate)
    : null
  return getLockedFormatting(editorRule, isEnforceMode)
}
