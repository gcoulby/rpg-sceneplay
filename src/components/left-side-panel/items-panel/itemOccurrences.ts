import type { Editor } from '@tiptap/react'

export interface ItemOccurrence {
  itemKey: string
  text: string
  from: number
  to: number
  sceneId: string | null
  sceneName: string | null
}

/** Mirrors `scanTagOccurrences` (tags-panel/tagOccurrences.ts), minus the
 *  category/elementType bits items don't have — items are auto-discovered
 *  purely from the `item` mark, not manually tagged against a registry. */
export function scanItemOccurrences(editor: Editor | null): ItemOccurrence[] {
  if (!editor) return []
  const { doc, schema } = editor.state
  const markType = schema.marks.item
  if (!markType) return []

  const result: ItemOccurrence[] = []

  const sceneRanges: Array<{ id: string; name: string; from: number }> = []
  let sceneIdx = 0
  doc.descendants((node, pos) => {
    if (node.type.name === 'sceneHeading') {
      sceneRanges.push({
        id: `scene-${sceneIdx}`,
        name: node.textContent || 'Untitled Scene',
        from: pos,
      })
      sceneIdx++
    }
  })

  const getScene = (pos: number) => {
    let scene: { id: string; name: string } | null = null
    for (const s of sceneRanges) {
      if (s.from <= pos) scene = { id: s.id, name: s.name }
      else break
    }
    return scene
  }

  doc.descendants((node, pos) => {
    if (!node.isText) return
    for (const mark of node.marks) {
      if (mark.type === markType && mark.attrs.itemKey) {
        const scene = getScene(pos)
        result.push({
          itemKey: mark.attrs.itemKey as string,
          text: node.textContent,
          from: pos,
          to: pos + node.nodeSize,
          sceneId: scene?.id ?? null,
          sceneName: scene?.name ?? null,
        })
      }
    }
  })

  return result
}

export function groupOccurrencesByItem(
  occurrences: ItemOccurrence[],
): Map<string, ItemOccurrence[]> {
  const map = new Map<string, ItemOccurrence[]>()
  for (const occ of occurrences) {
    const list = map.get(occ.itemKey)
    if (list) list.push(occ)
    else map.set(occ.itemKey, [occ])
  }
  return map
}
