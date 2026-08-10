import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useEditorStore } from '@/stores/editorStore'
import { useDocVersion } from '../utils/useDocVersion'
import {
  scanTagOccurrences,
  groupOccurrencesByTag,
  type TagOccurrence,
} from './tagOccurrences'
import type { TagItem } from './tagTypes'
import TagsViewTab from './TagsViewTab'
import TagsManageTab from './TagsManageTab'

interface TagsPanelProps {
  editor: Editor | null
}

// No self-managed open/close here (dropped useDelayedUnmount/useSwipeDismiss
// /the outer bordered wrapper/close button), same call as every other panel
// in this navigator — whatever hosts this owns show/hide. `tagsVisible` is
// a different thing entirely (are tag highlights visible in the editor
// text), that stays.
const TagsPanel: React.FC<TagsPanelProps> = ({ editor }) => {
  const {
    tagCategories,
    tags,
    addTag,
    updateTag,
    deleteTag,
    addTagCategory,
    deleteTagCategory,
    tagsVisible,
    setTagsVisible,
    pendingTagSelection,
    setPendingTagSelection,
    editingTagId,
    setEditingTagId,
  } = useEditorStore()

  const [activeTab, setActiveTab] = useState<'view' | 'manage'>('view')
  const [expandedCats, setExpandedCats] = useState<string[]>([])
  const [expandedTagId, setExpandedTagId] = useState<string | null>(null)
  const tagItemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null,
  )
  const [newEntityName, setNewEntityName] = useState('')

  const [showAddForm, setShowAddForm] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6fa8dc')

  const docVersion = useDocVersion(editor)

  const occurrences = useMemo(() => {
    void docVersion
    return scanTagOccurrences(editor)
  }, [editor, docVersion])

  const occurrencesByTag = useMemo(
    () => groupOccurrencesByTag(occurrences),
    [occurrences],
  )

  const [prevPendingSelection, setPrevPendingSelection] =
    useState(pendingTagSelection)
  if (pendingTagSelection !== prevPendingSelection) {
    setPrevPendingSelection(pendingTagSelection)
    setPendingCategoryId(null)
    setNewEntityName('')
    if (pendingTagSelection) setActiveTab('manage')
  }

  const lastEditingTagRef = useRef<string | null>(null)
  useEffect(() => {
    if (!editingTagId || editingTagId === lastEditingTagRef.current) return
    lastEditingTagRef.current = editingTagId
    const tag = tags.find((t) => t.id === editingTagId)

    const t = setTimeout(() => {
      if (!tag) {
        setEditingTagId(null)
        return
      }

      setActiveTab('manage')
      setExpandedCats((prev) =>
        prev.includes(tag.categoryId) ? prev : [...prev, tag.categoryId],
      )
      setExpandedTagId(editingTagId)
      setEditingTagId(null)

      const el = tagItemRefs.current.get(editingTagId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const textarea = el.querySelector(
          '.tags-item-notes',
        ) as HTMLTextAreaElement | null
        if (textarea) textarea.focus()
      }
    }, 100)

    return () => clearTimeout(t)
  }, [editingTagId, tags, setEditingTagId])

  const tagsByCategory = useMemo(() => {
    const map = new Map<string, typeof tags>()
    for (const cat of tagCategories) {
      const items = tags.filter((t) => t.categoryId === cat.id)
      if (items.length > 0) map.set(cat.id, items)
    }
    return map
  }, [tags, tagCategories])

  const handleNavigateToOccurrence = useCallback(
    (pos: number) => {
      if (!editor) return
      editor.chain().focus().setTextSelection(pos).run()
      const coords = editor.view.coordsAtPos(pos)
      const editorMain = document.querySelector('.editor-main')
      if (editorMain && coords) {
        const rect = editorMain.getBoundingClientRect()
        const scrollTo =
          editorMain.scrollTop + (coords.top - rect.top) - rect.height / 3
        editorMain.scrollTo({ top: scrollTo, behavior: 'auto' })
      }
    },
    [editor],
  )

  const handleNavigateToTag = useCallback(
    (tagId: string) => {
      const occs = occurrencesByTag.get(tagId)
      if (occs && occs.length > 0) handleNavigateToOccurrence(occs[0].from)
    },
    [occurrencesByTag, handleNavigateToOccurrence],
  )

  const handleRemoveOccurrence = useCallback(
    (occ: TagOccurrence) => {
      if (!editor) return
      const { schema } = editor.state
      const markType = schema.marks.productionTag
      if (!markType) return

      editor
        .chain()
        .command(({ tr }) => {
          tr.doc.nodesBetween(occ.from, occ.to, (node, pos) => {
            if (!node.isText) return
            const mark = node.marks.find(
              (m) => m.type === markType && m.attrs.tagId === occ.tagId,
            )
            if (mark) tr.removeMark(pos, pos + node.nodeSize, mark)
          })
          return true
        })
        .run()

      const remaining = occurrencesByTag.get(occ.tagId)
      if (!remaining || remaining.length <= 1) deleteTag(occ.tagId)
    },
    [editor, occurrencesByTag, deleteTag],
  )

  const handleDeleteEntity = useCallback(
    (tagId: string) => {
      if (editor) {
        const { doc, schema } = editor.state
        const markType = schema.marks.productionTag
        if (markType) {
          editor
            .chain()
            .command(({ tr }) => {
              doc.descendants((node, pos) => {
                if (!node.isText) return
                const mark = node.marks.find(
                  (m) => m.type === markType && m.attrs.tagId === tagId,
                )
                if (mark) tr.removeMark(pos, pos + node.nodeSize, mark)
              })
              return true
            })
            .run()
        }
      }
      deleteTag(tagId)
    },
    [editor, deleteTag],
  )

  const handlePickCategory = useCallback(
    (catId: string) => {
      setPendingCategoryId(catId)
      setNewEntityName(pendingTagSelection?.text || '')
    },
    [pendingTagSelection],
  )

  const applyTagMark = useCallback(
    (
      from: number,
      to: number,
      tagId: string,
      categoryId: string,
      color: string,
    ) => {
      if (!editor) return
      const markType = editor.schema.marks.productionTag
      if (!markType) return
      const docSize = editor.state.doc.content.size
      const safeFrom = Math.max(0, Math.min(from, docSize))
      const safeTo = Math.max(safeFrom, Math.min(to, docSize))
      if (safeFrom === safeTo) return

      // Raw dispatch (works without focus), then emit 'update' so
      // React/TipTap re-renders and the memos above recompute.
      const { tr } = editor.state
      tr.addMark(
        safeFrom,
        safeTo,
        markType.create({ tagId, categoryId, color }),
      )
      editor.view.dispatch(tr)
      editor.emit('update', { editor, transaction: tr })
    },
    [editor],
  )

  const handleAddToExistingEntity = useCallback(
    (entity: TagItem) => {
      if (!editor || !pendingTagSelection) return
      const { from, to } = pendingTagSelection
      const cat = tagCategories.find((c) => c.id === entity.categoryId)
      const color = cat?.color || '#9370DB'

      applyTagMark(from, to, entity.id, entity.categoryId, color)

      setExpandedCats((prev) =>
        prev.includes(entity.categoryId) ? prev : [...prev, entity.categoryId],
      )
      setExpandedTagId(entity.id)
      setPendingTagSelection(null)
      setPendingCategoryId(null)
    },
    [
      editor,
      pendingTagSelection,
      tagCategories,
      setPendingTagSelection,
      applyTagMark,
    ],
  )

  const newEntityNameRef = useRef(newEntityName)
  useEffect(() => {
    newEntityNameRef.current = newEntityName
  })

  const handleCreateNewEntity = useCallback(() => {
    if (!editor || !pendingTagSelection || !pendingCategoryId) return
    const { from, to, text, elementType, sceneId } = pendingTagSelection
    const categoryId = pendingCategoryId
    const cat = tagCategories.find((c) => c.id === categoryId)
    const color = cat?.color || '#9370DB'
    const entityName = newEntityNameRef.current.trim() || text

    const tagId = addTag({
      categoryId,
      text,
      name: entityName,
      notes: '',
      sceneId,
      elementType,
    })

    try {
      applyTagMark(from, to, tagId, categoryId, color)
    } catch {
      // Mark application can fail if the document changed; the tag entity
      // is still created either way.
    }

    setExpandedCats((prev) =>
      prev.includes(categoryId) ? prev : [...prev, categoryId],
    )
    setExpandedTagId(tagId)
    setPendingTagSelection(null)
    setPendingCategoryId(null)
  }, [
    editor,
    pendingTagSelection,
    pendingCategoryId,
    tagCategories,
    addTag,
    setPendingTagSelection,
    applyTagMark,
  ])

  const handleCancelPending = useCallback(() => {
    setPendingTagSelection(null)
    setPendingCategoryId(null)
  }, [setPendingTagSelection])

  const handleAddCategory = useCallback(() => {
    if (!newCatName.trim()) return
    addTagCategory(newCatName.trim(), newCatColor)
    setNewCatName('')
    setNewCatColor('#6fa8dc')
    setShowAddForm(false)
  }, [newCatName, newCatColor, addTagCategory])

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <div className="flex items-center px-3 py-2.5 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
          Production Tags
        </span>
        <Badge variant="secondary" className="mr-auto text-[10px]">
          {tags.length}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className={`size-7 ${tagsVisible ? 'text-(--fd-accent)' : 'text-(--fd-text-muted) hover:text-(--fd-text)'}`}
          onClick={() => setTagsVisible(!tagsVisible)}
          title={tagsVisible ? 'Hide tag highlights' : 'Show tag highlights'}
          aria-label={
            tagsVisible ? 'Hide tag highlights' : 'Show tag highlights'
          }
        >
          {tagsVisible ? (
            <Eye className="size-3.5" />
          ) : (
            <EyeOff className="size-3.5" />
          )}
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'view' | 'manage')}
        className="flex flex-col flex-1 min-h-0"
      >
        <TabsList className="w-full shrink-0 rounded-none border-b border-(--fd-border) bg-transparent h-auto p-0">
          <TabsTrigger
            value="view"
            className="flex-1 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-(--fd-accent)"
          >
            View
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className="flex-1 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-(--fd-accent)"
          >
            Manage
            {pendingTagSelection && (
              <span className="inline-block w-1.5 h-1.5 bg-(--fd-accent) rounded-full ml-1.25 align-middle" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="view"
          className="flex-1 mt-0 min-h-0 overflow-y-auto"
        >
          <TagsViewTab
            tagCategories={tagCategories}
            tagsByCategory={tagsByCategory}
            occurrencesByTag={occurrencesByTag}
            hasTags={tags.length > 0}
            onNavigateToEntity={handleNavigateToTag}
            onNavigateToOccurrence={handleNavigateToOccurrence}
          />
        </TabsContent>

        <TabsContent
          value="manage"
          className="flex flex-col flex-1 mt-0 min-h-0"
        >
          <TagsManageTab
            tagCategories={tagCategories}
            tagsByCategory={tagsByCategory}
            occurrencesByTag={occurrencesByTag}
            pendingTagSelection={pendingTagSelection}
            pendingCategoryId={pendingCategoryId}
            newEntityName={newEntityName}
            onNewEntityNameChange={setNewEntityName}
            onPickCategory={handlePickCategory}
            onCreateNewEntity={handleCreateNewEntity}
            onAddToExistingEntity={handleAddToExistingEntity}
            onBackToCategories={() => setPendingCategoryId(null)}
            onCancelPending={handleCancelPending}
            expandedCats={expandedCats}
            onExpandedCatsChange={setExpandedCats}
            expandedTagId={expandedTagId}
            onToggleEntity={(id) =>
              setExpandedTagId(expandedTagId === id ? null : id)
            }
            onUpdateEntityName={(id, name) => updateTag(id, { name })}
            onUpdateEntityNotes={(id, notes) => updateTag(id, { notes })}
            onDeleteEntity={handleDeleteEntity}
            onDeleteCategory={deleteTagCategory}
            onNavigateToOccurrence={handleNavigateToOccurrence}
            onRemoveOccurrence={handleRemoveOccurrence}
            registerItemRef={(id, el) => {
              if (el) tagItemRefs.current.set(id, el)
            }}
            showAddForm={showAddForm}
            newCatName={newCatName}
            newCatColor={newCatColor}
            onNewCatNameChange={setNewCatName}
            onNewCatColorChange={setNewCatColor}
            onOpenAddForm={() => setShowAddForm(true)}
            onSubmitAddForm={handleAddCategory}
            onCancelAddForm={() => setShowAddForm(false)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TagsPanel
