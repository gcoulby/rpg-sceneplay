import { useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { PROJECT_DICT_TARGET, spellChecker } from '@/editor/spellchecker'
import { spellCheckPluginKey } from '@/editor/extensions/SpellCheck'
import { useEditorStore } from '@/stores/editorStore'
import type { SpellInfo } from '../components/context-menu/types'

export function useSpellingActions(
  editor: Editor,
  onClose: () => void,
  spellInfo: SpellInfo | null,
) {
  const appendWordToGlobalDictionary = useEditorStore(
    (state) => state.appendWordToGlobalDictionary,
  )

  const triggerRecheck = useCallback(() => {
    const tr = editor.state.tr.setMeta(spellCheckPluginKey, { toggle: false })
    editor.view.dispatch(tr)
    requestAnimationFrame(() => {
      const tr2 = editor.state.tr.setMeta(spellCheckPluginKey, { toggle: true })
      editor.view.dispatch(tr2)
    })
  }, [editor])

  const applySuggestion = (suggestion: string) => {
    if (!spellInfo) return
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        tr.insertText(suggestion, spellInfo.from, spellInfo.to)
        return true
      })
      .run()
    onClose()
    setTimeout(triggerRecheck, 200)
  }

  const ignoreWord = () => {
    if (!spellInfo) return
    spellChecker.ignoreWord(spellInfo.word)
    onClose()
    triggerRecheck()
  }

  const addToDictionary = (target: string) => {
    if (!spellInfo) return
    if (target === PROJECT_DICT_TARGET) {
      spellChecker.addToProjectDictionary(spellInfo.word)
    } else {
      appendWordToGlobalDictionary(target, spellInfo.word)
    }
    onClose()
    triggerRecheck()
  }

  const addToDefaultDictionary = () => {
    if (!spellInfo) return
    const targets = spellChecker.getActiveAddTargets()
    if (targets.length === 0) {
      spellChecker.addToProjectDictionary(spellInfo.word)
    } else {
      addToDictionary(targets[0])
      return
    }
    onClose()
    triggerRecheck()
  }

  return {
    applySuggestion,
    ignoreWord,
    addToDictionary,
    addToDefaultDictionary,
  }
}
