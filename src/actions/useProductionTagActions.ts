import type { Editor } from '@tiptap/react'
import type { ResolvedPos } from '@tiptap/pm/model'
import { useEditorStore, type ElementType } from '@/stores/editorStore'
import { useActivityBarStore } from '@/stores/activity-bar-store'
import type { SavedSelection } from '@/components/context-menu/types'
import type { ExistingTagInfo } from '@/components/context-menu/helpers/getExistingAnnotations'

export function useProductionTagActions(
  editor: Editor,
  onClose: () => void,
  currentNodeType: ElementType,
  resolvedFrom: ResolvedPos,
  savedSelection: SavedSelection,
  existingTagInfo: ExistingTagInfo | null,
) {
  const deleteTag = useEditorStore((state) => state.deleteTag)
  const tagsPanelOpen = useEditorStore((state) => state.tagsPanelOpen)
  const toggleTagsPanel = useEditorStore((state) => state.toggleTagsPanel)
  const setPendingTagSelection = useEditorStore(
    (state) => state.setPendingTagSelection,
  )
  const setEditingTagId = useEditorStore((state) => state.setEditingTagId)
  const setActiveView = useActivityBarStore((state) => state.setActiveView)

  const tagAs = () => {
    const { from, to, empty } = savedSelection
    const selFrom = empty ? resolvedFrom.start() : from
    const selTo = empty ? resolvedFrom.end() : to
    const text = editor.state.doc.textBetween(selFrom, selTo, ' ')

    let sceneId: string | null = null
    let sceneIndex = 0
    editor.state.doc.nodesBetween(0, selFrom, (node) => {
      if (node.type.name === 'sceneHeading') {
        sceneId = `scene-${sceneIndex}`
        sceneIndex++
      }
      return true
    })

    setPendingTagSelection({
      from: selFrom,
      to: selTo,
      text: text.slice(0, 80),
      elementType: currentNodeType,
      sceneId,
    })
    if (!tagsPanelOpen) toggleTagsPanel()
    setActiveView('tags')
    onClose()
  }

  const editTag = () => {
    if (existingTagInfo) {
      setEditingTagId(existingTagInfo.tagId)
    }
    if (!tagsPanelOpen) toggleTagsPanel()
    setActiveView('tags')
    onClose()
  }

  const removeTag = () => {
    if (!existingTagInfo) return
    const { doc, schema } = editor.state
    const markType = schema.marks.productionTag
    if (!markType) {
      onClose()
      return
    }

    const cursorPos = editor.state.selection.$from.pos
    editor
      .chain()
      .focus()
      .command(({ tr }) => {
        doc.descendants((node, pos) => {
          if (!node.isText) return
          const mark = node.marks.find(
            (m) =>
              m.type === markType && m.attrs.tagId === existingTagInfo.tagId,
          )
          if (mark && pos <= cursorPos && pos + node.nodeSize >= cursorPos) {
            tr.removeMark(pos, pos + node.nodeSize, mark)
          }
        })
        return true
      })
      .run()

    let remaining = 0
    editor.state.doc.descendants((node) => {
      if (!node.isText) return
      if (
        node.marks.some(
          (m) => m.type === markType && m.attrs.tagId === existingTagInfo.tagId,
        )
      ) {
        remaining++
      }
    })
    if (remaining === 0) {
      deleteTag(existingTagInfo.tagId)
    }
    onClose()
  }

  return { tagAs, editTag, removeTag }
}
