import { useCallback } from 'react'
import type { Editor } from '@tiptap/react'

export function useGoToScene(
  editor: Editor | null,
  scrollContainer?: HTMLDivElement | null,
) {
  const goToPosition = useCallback(
    (pos: number) => {
      if (!editor) return
      editor
        .chain()
        .focus()
        .setTextSelection(pos + 1)
        .run()
      requestAnimationFrame(() => {
        const coords = editor.view.coordsAtPos(pos + 1)
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect()
          const scrollTo =
            scrollContainer.scrollTop + (coords.top - containerRect.top) - 60
          scrollContainer.scrollTo({ top: scrollTo, behavior: 'auto' })
        }
      })
    },
    [editor, scrollContainer],
  )

  const goToScene = useCallback(
    (sceneIndex: number) => {
      if (!editor) return
      const { doc } = editor.state
      let currentScene = -1
      let targetPos = 0
      doc.descendants((node, pos) => {
        if (node.type.name === 'sceneHeading') {
          currentScene++
          if (currentScene === sceneIndex) {
            targetPos = pos
            return false
          }
        }
        return true
      })
      goToPosition(targetPos)
    },
    [editor, goToPosition],
  )

  return { goToScene, goToPosition }
}
