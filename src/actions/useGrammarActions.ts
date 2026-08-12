import { useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { grammarPluginKey } from '@/editor/extensions/Grammar'
import { GrammarIgnore, grammarIgnore } from '@/editor/grammar/grammarIgnore'
import { useEditorStore } from '@/stores/editorStore'
import type { GrammarInfo } from '../components/context-menu/types'

export function useGrammarActions(
  editor: Editor,
  onClose: () => void,
  grammarInfo: GrammarInfo | null,
) {
  const setGrammarRuleEnabled = useEditorStore(
    (state) => state.setGrammarRuleEnabled,
  )

  const triggerRecheck = useCallback(() => {
    const tr = editor.state.tr.setMeta(grammarPluginKey, { rescanAll: true })
    editor.view.dispatch(tr)
  }, [editor])

  const applySuggestion = (suggestion: string) => {
    if (!grammarInfo) return
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.insertText(suggestion, grammarInfo.from, grammarInfo.to)
        return true
      })
      .run()
    onClose()
  }

  const ignoreOnce = () => {
    if (!grammarInfo) return
    const start = Math.max(0, grammarInfo.from - 30)
    const end = Math.min(editor.state.doc.content.size, grammarInfo.to + 30)
    const text = editor.state.doc.textBetween(start, end, ' ')
    const localIndex = grammarInfo.from - start
    const length = grammarInfo.to - grammarInfo.from
    const contextKey = GrammarIgnore.buildContextKey(text, localIndex, length)
    grammarIgnore.ignoreOnce(grammarInfo.ruleId, contextKey)
    onClose()
    triggerRecheck()
  }

  const ignoreRuleForDocument = () => {
    if (!grammarInfo) return
    grammarIgnore.ignoreRuleForDoc(grammarInfo.ruleId)
    onClose()
    triggerRecheck()
  }

  const disableRule = () => {
    if (!grammarInfo) return
    setGrammarRuleEnabled(grammarInfo.ruleId, false)
    onClose()
  }

  return { applySuggestion, ignoreOnce, ignoreRuleForDocument, disableRule }
}
