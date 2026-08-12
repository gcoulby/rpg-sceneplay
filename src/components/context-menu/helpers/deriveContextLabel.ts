import type { Editor } from '@tiptap/react'
import type { ResolvedPos } from '@tiptap/pm/model'
import { singleLine } from '@/utils/open-draft/nodeText'
import type { ElementType } from '@/stores/editorStore'

export function deriveContextLabel(
  editor: Editor,
  resolvedFrom: ResolvedPos,
  currentNodeType: ElementType,
): string {
  const text = singleLine(resolvedFrom.parent.textContent)

  if (currentNodeType === 'character') {
    return text.replace(/\s*\([^)]*\)\s*/g, '').trim()
  }

  if (currentNodeType === 'sceneHeading') {
    return text
  }

  if (currentNodeType === 'dialogue' || currentNodeType === 'parenthetical') {
    let characterName = ''
    const pos = resolvedFrom.before(resolvedFrom.depth)
    editor.state.doc.nodesBetween(0, pos, (node) => {
      if (node.type.name === 'character') {
        characterName = singleLine(node.textContent)
          .replace(/\s*\([^)]*\)\s*/g, '')
          .trim()
      }
      return true
    })
    return characterName || text.slice(0, 40)
  }

  return text.slice(0, 60)
}
