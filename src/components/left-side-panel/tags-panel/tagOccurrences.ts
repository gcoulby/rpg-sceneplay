import type { Editor } from '@tiptap/react'

export interface TagOccurrence {
  tagId: string
  text: string
  from: number
  to: number
  sceneId: string | null
  sceneName: string | null
  elementType: string
}

export function scanTagOccurrences(editor: Editor | null): TagOccurrence[] {
  if (!editor) return []
  const { doc, schema } = editor.state
  const markType = schema.marks.productionTag
  if (!markType) return []

  const result: TagOccurrence[] = []

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
      if (mark.type === markType && mark.attrs.tagId) {
        const scene = getScene(pos)
        const resolved = doc.resolve(pos)
        const parentType = resolved.parent.type.name
        result.push({
          tagId: mark.attrs.tagId as string,
          text: node.textContent,
          from: pos,
          to: pos + node.nodeSize,
          sceneId: scene?.id ?? null,
          sceneName: scene?.name ?? null,
          elementType: parentType,
        })
      }
    }
  })

  return result
}

export function groupOccurrencesByTag(
  occurrences: TagOccurrence[],
): Map<string, TagOccurrence[]> {
  const map = new Map<string, TagOccurrence[]>()
  for (const occ of occurrences) {
    const list = map.get(occ.tagId)
    if (list) list.push(occ)
    else map.set(occ.tagId, [occ])
  }
  return map
}
