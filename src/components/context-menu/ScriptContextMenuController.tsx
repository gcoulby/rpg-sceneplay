import { useCallback, useEffect, useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useIsTouchDevice } from '@/hooks/useTouch'
import { spellCheckPluginKey } from '@/editor/extensions/SpellCheck'
import { grammarPluginKey } from '@/editor/extensions/Grammar'
import { spellChecker } from '@/editor/spellchecker'
import { ScriptContextMenu } from './ScriptContextMenu'
import RollDialog from '@/components/roll-dialog/RollDialog'
import { useRollNoteStore } from '@/stores/rollNoteStore'
import type { ContextMenuState, GrammarInfo, SpellInfo } from './types'
import { CLOSED_STATE } from './constants'

export function ScriptContextMenuController() {
  const editor = useEditorStore((state) => state.editor)
  const isTouch = useIsTouchDevice()
  const rollDialogRequest = useRollNoteStore((s) => s.rollDialogRequest)

  const [menuState, setMenuState] = useState<ContextMenuState>(CLOSED_STATE)
  const [rollDialogState, setRollDialogState] = useState<{
    open: boolean
    insertPos: number | null
  }>({ open: false, insertPos: null })

  // Opened by the Mod-0 / Numpad0 shortcut (see ElementShortcutExtension in
  // ScreenplayEditor.tsx), which can't reach this component's state
  // directly — it goes through rollNoteStore instead.
  useEffect(() => {
    if (!rollDialogRequest) return
    setRollDialogState({ open: true, insertPos: rollDialogRequest.pos })
  }, [rollDialogRequest])

  useEffect(() => {
    if (!isTouch) return

    const handleThreeFingerTouch = (event: TouchEvent) => {
      if (event.touches.length !== 3) return
      event.preventDefault()

      let x = 0
      let y = 0
      for (let i = 0; i < 3; i++) {
        x += event.touches[i].clientX
        y += event.touches[i].clientY
      }

      setMenuState({
        visible: true,
        position: { x: x / 3, y: y / 3 },
        spellInfo: null,
        grammarInfo: null,
      })
    }

    document.addEventListener('touchstart', handleThreeFingerTouch, {
      passive: false,
    })
    return () =>
      document.removeEventListener('touchstart', handleThreeFingerTouch)
  }, [isTouch])

  useEffect(() => {
    if (!editor) return
    const isTouchDevice = navigator.maxTouchPoints > 0

    const handleContextMenu = (event: MouseEvent) => {
      const editorDom = editor.view.dom
      if (!editorDom.contains(event.target as Node)) return
      event.preventDefault()
      if (isTouchDevice) return

      const pos = editor.view.posAtCoords({
        left: event.clientX,
        top: event.clientY,
      })
      if (pos) {
        const { from, to } = editor.state.selection
        const clickInSelection = pos.pos >= from && pos.pos <= to && from !== to
        if (!clickInSelection) {
          editor.commands.setTextSelection(pos.pos)
        }
      }

      let spellInfo: SpellInfo | null = null
      const target = event.target as HTMLElement
      if (
        target.classList.contains('spell-error') ||
        target.closest('.spell-error')
      ) {
        if (pos) {
          const pluginState = spellCheckPluginKey.getState(editor.state) as
            | {
                decorations: import('@tiptap/pm/view').DecorationSet
                enabled: boolean
              }
            | undefined
          if (pluginState?.enabled) {
            const decos = pluginState.decorations.find(pos.pos, pos.pos)
            if (decos.length > 0) {
              const deco = decos[0]
              const word = editor.state.doc.textBetween(deco.from, deco.to)
              spellInfo = {
                word,
                from: deco.from,
                to: deco.to,
                suggestions: spellChecker.suggest(word),
              }
            }
          }
        }
      }

      let grammarInfo: GrammarInfo | null = null
      if (
        pos &&
        (target.classList.contains('grammar-issue') ||
          target.closest('.grammar-issue'))
      ) {
        const grammarState = grammarPluginKey.getState(editor.state) as
          | {
              enabled: boolean
              issues: import('@/plugins/registry').GrammarIssue[]
            }
          | undefined
        if (grammarState?.enabled && Array.isArray(grammarState.issues)) {
          const hit = grammarState.issues.find(
            (issue) => pos.pos >= issue.from && pos.pos <= issue.to,
          )
          if (hit) {
            grammarInfo = {
              from: hit.from,
              to: hit.to,
              ruleId: hit.ruleId,
              message: hit.message,
              severity: hit.severity,
              suggestions: hit.suggestions ?? [],
            }
          }
        }
      }

      setMenuState({
        visible: true,
        position: { x: event.clientX, y: event.clientY },
        spellInfo,
        grammarInfo,
      })
    }

    const editorEl = editor.view.dom.parentElement
    if (!editorEl) return
    editorEl.addEventListener('contextmenu', handleContextMenu)
    return () => editorEl.removeEventListener('contextmenu', handleContextMenu)
  }, [editor])

  const handleClose = useCallback(() => {
    setMenuState((state) => ({ ...state, visible: false }))
  }, [])

  if (!editor) return null

  return (
    <>
      {menuState.visible && (
        <ScriptContextMenu
          editor={editor}
          position={menuState.position}
          spellInfo={menuState.spellInfo}
          grammarInfo={menuState.grammarInfo}
          onClose={handleClose}
          overrideSelection={menuState.savedSelection}
          onOpenRollDialog={(insertPos) =>
            setRollDialogState({ open: true, insertPos })
          }
        />
      )}
      <RollDialog
        editor={editor}
        open={rollDialogState.open}
        onOpenChange={(open) =>
          setRollDialogState((s) => ({ ...s, open }))
        }
        insertPos={rollDialogState.insertPos}
      />
    </>
  )
}
