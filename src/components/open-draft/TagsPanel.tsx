import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useDelayedUnmount, useSwipeDismiss } from '@/hooks/useTouch'
import { useEditorStore } from '@/stores/editorStore'

interface TagsPanelProps {
  editor: Editor | null
  style?: React.CSSProperties
}

/** An occurrence of a tag entity found by scanning the document. */
interface TagOccurrence {
  tagId: string
  text: string
  from: number
  to: number
  sceneId: string | null
  sceneName: string | null
  elementType: string
}

const TagsPanel: React.FC<TagsPanelProps> = ({ editor, style }) => {
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
    tagsPanelOpen,
    toggleTagsPanel,
    pendingTagSelection,
    setPendingTagSelection,
    editingTagId,
    setEditingTagId,
  } = useEditorStore()

  const [activeTab, setActiveTab] = useState<'view' | 'manage'>('view')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [expandedTagId, setExpandedTagId] = useState<string | null>(null)
  const tagItemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // View-tab: which entity's occurrences are shown
  const [viewExpandedTagId, setViewExpandedTagId] = useState<string | null>(
    null,
  )

  // Ref-based handler for the Create button — bypasses React event delegation
  // to work around iOS WebKit swallowing touch events during keyboard dismiss.
  const createBtnRef = useRef<HTMLButtonElement>(null)
  const createActionRef = useRef<(() => void) | null>(null)

  // Pending-selection step: null → pick category → pick entity or create new
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null,
  )
  const [newEntityName, setNewEntityName] = useState('')

  const [showAddForm, setShowAddForm] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState('#6fa8dc')

  // ── Scan document for tag occurrences ─────────────────────────────────

  const occurrences = useMemo((): TagOccurrence[] => {
    if (!editor) return []
    const { doc, schema } = editor.state
    const markType = schema.marks.productionTag
    if (!markType) return []

    const result: TagOccurrence[] = []

    // Pre-build scene index: for each node offset → which scene it falls in
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
          // Determine element type from parent node
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
  }, [editor, editor?.state.doc])

  // Group occurrences by tagId
  const occurrencesByTag = useMemo(() => {
    const map = new Map<string, TagOccurrence[]>()
    for (const occ of occurrences) {
      const list = map.get(occ.tagId)
      if (list) list.push(occ)
      else map.set(occ.tagId, [occ])
    }
    return map
  }, [occurrences])

  // ── Auto-expand when editingTagId is set from context menu ────────────

  // Auto-switch to Manage tab when pending selection or editing tag
  useEffect(() => {
    if (pendingTagSelection) setActiveTab('manage')
  }, [pendingTagSelection])

  const lastEditingTagRef = useRef<string | null>(null)
  useEffect(() => {
    if (!editingTagId || editingTagId === lastEditingTagRef.current) return
    lastEditingTagRef.current = editingTagId
    const tag = tags.find((t) => t.id === editingTagId)
    if (!tag) {
      setEditingTagId(null)
      return
    }

    setActiveTab('manage')
    setExpandedCats((prev) => {
      const next = new Set(prev)
      next.add(tag.categoryId)
      return next
    })
    setExpandedTagId(editingTagId)
    setEditingTagId(null)

    setTimeout(() => {
      const el = tagItemRefs.current.get(editingTagId)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const textarea = el.querySelector(
          '.tags-item-notes',
        ) as HTMLTextAreaElement | null
        if (textarea) textarea.focus()
      }
    }, 100)
  }, [editingTagId, tags, setEditingTagId])

  // Reset pending category when pending selection changes
  useEffect(() => {
    setPendingCategoryId(null)
    setNewEntityName('')
  }, [pendingTagSelection])

  // ── Group tags by category ────────────────────────────────────────────

  const tagsByCategory = useMemo(() => {
    const map = new Map<string, typeof tags>()
    for (const cat of tagCategories) {
      const items = tags.filter((t) => t.categoryId === cat.id)
      if (items.length > 0) map.set(cat.id, items)
    }
    return map
  }, [tags, tagCategories])

  const toggleCategory = useCallback((catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }, [])

  // ── Navigate to a specific occurrence ─────────────────────────────────

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

  // Navigate to first occurrence of an entity
  const handleNavigateToTag = useCallback(
    (tagId: string) => {
      const occs = occurrencesByTag.get(tagId)
      if (occs && occs.length > 0) {
        handleNavigateToOccurrence(occs[0].from)
      }
    },
    [occurrencesByTag, handleNavigateToOccurrence],
  )

  // ── Remove a single occurrence (mark) ─────────────────────────────────

  const handleRemoveOccurrence = useCallback(
    (tagId: string, from: number, to: number) => {
      if (!editor) return
      const { schema } = editor.state
      const markType = schema.marks.productionTag
      if (!markType) return

      editor
        .chain()
        .command(({ tr }) => {
          // Remove mark in the given range
          tr.doc.nodesBetween(from, to, (node, pos) => {
            if (!node.isText) return
            const mark = node.marks.find(
              (m) => m.type === markType && m.attrs.tagId === tagId,
            )
            if (mark) {
              tr.removeMark(pos, pos + node.nodeSize, mark)
            }
          })
          return true
        })
        .run()

      // If this was the last occurrence, also remove the entity
      const remaining = occurrencesByTag.get(tagId)
      if (!remaining || remaining.length <= 1) {
        deleteTag(tagId)
      }
    },
    [editor, occurrencesByTag, deleteTag],
  )

  // ── Delete an entire entity (all occurrences) ─────────────────────────

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
                if (mark) {
                  tr.removeMark(pos, pos + node.nodeSize, mark)
                }
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

  // ── Pending tag flow: step 1 = pick category, step 2 = pick or create entity ─

  const handlePickCategory = useCallback(
    (catId: string) => {
      setPendingCategoryId(catId)
      setNewEntityName(pendingTagSelection?.text || '')
    },
    [pendingTagSelection],
  )

  /** Apply pending selection to an EXISTING entity */
  /** Apply a production tag mark to the pending selection range. */
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

      // Use raw dispatch (works without focus), then emit 'update' so
      // React/TipTap re-renders and the useMemo recomputes occurrences.
      const { tr } = editor.state
      tr.addMark(
        safeFrom,
        safeTo,
        markType.create({ tagId, categoryId, color }),
      )
      editor.view.dispatch(tr)
      // Force TipTap to notify React listeners
      editor.emit('update', { editor, transaction: tr })
    },
    [editor],
  )

  const handleAddToExistingEntity = useCallback(
    (entity: (typeof tags)[0]) => {
      if (!editor || !pendingTagSelection) return
      const { from, to } = pendingTagSelection
      const cat = tagCategories.find((c) => c.id === entity.categoryId)
      const color = cat?.color || '#9370DB'

      applyTagMark(from, to, entity.id, entity.categoryId, color)

      setExpandedCats((prev) => {
        const next = new Set(prev)
        next.add(entity.categoryId)
        return next
      })
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

  /** Create a NEW entity from pending selection */
  const newEntityNameRef = useRef(newEntityName)
  newEntityNameRef.current = newEntityName
  const handleCreateNewEntity = useCallback(
    (categoryId: string) => {
      if (!editor || !pendingTagSelection) return
      const { from, to, text, elementType, sceneId } = pendingTagSelection
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
        // Mark application can fail if the document changed; tag entity is still created
      }

      setExpandedCats((prev) => {
        const next = new Set(prev)
        next.add(categoryId)
        return next
      })
      setExpandedTagId(tagId)
      setPendingTagSelection(null)
      setPendingCategoryId(null)
    },
    [
      editor,
      pendingTagSelection,
      tagCategories,
      newEntityName,
      addTag,
      setPendingTagSelection,
      applyTagMark,
    ],
  )

  const handleCancelPending = useCallback(() => {
    setPendingTagSelection(null)
    setPendingCategoryId(null)
  }, [setPendingTagSelection])

  // Keep createActionRef in sync with current closure values
  createActionRef.current = pendingCategoryId
    ? () => handleCreateNewEntity(pendingCategoryId)
    : null

  // Native event listener on the Create button — iOS WebKit sometimes
  // swallows React synthetic events during keyboard dismiss.
  useEffect(() => {
    const btn = createBtnRef.current
    if (!btn) return
    const handler = (e: Event) => {
      e.preventDefault()
      createActionRef.current?.()
    }
    btn.addEventListener('touchstart', handler, { passive: false })
    return () => btn.removeEventListener('touchstart', handler)
  }, [pendingCategoryId])

  const handleAddCategory = useCallback(() => {
    if (!newCatName.trim()) return
    addTagCategory(newCatName.trim(), newCatColor)
    setNewCatName('')
    setNewCatColor('#6fa8dc')
    setShowAddForm(false)
  }, [newCatName, newCatColor, addTagCategory])

  const { shouldRender, animationState } = useDelayedUnmount(tagsPanelOpen, 250)
  const panelRef = useRef<HTMLDivElement>(null)
  useSwipeDismiss(panelRef, {
    direction: 'right',
    onDismiss: toggleTagsPanel,
    enabled: shouldRender,
  })

  if (!shouldRender) return null

  const panelClass =
    animationState === 'entered'
      ? 'panel-open'
      : animationState === 'exiting'
        ? 'panel-closing'
        : ''

  // Entities in the currently-selected pending category
  const pendingCatEntities = pendingCategoryId
    ? tags.filter((t) => t.categoryId === pendingCategoryId)
    : []

  const tabBase =
    'tags-tab flex-1 bg-transparent border-none border-b-2 border-transparent text-(--fd-text-muted) text-xs font-medium py-2 cursor-pointer text-center relative transition-colors duration-150 hover:text-(--fd-text) max-[900px]:text-sm max-[900px]:py-3 max-[900px]:min-h-11'
  const tabActive = 'tags-tab-active text-(--fd-accent) border-b-(--fd-accent)'

  return (
    <div
      ref={panelRef}
      className={`tags-panel w-[300px] min-w-[200px] bg-(--fd-navigator-bg) border-l border-(--fd-border) flex flex-col overflow-hidden ${panelClass}`}
      style={style}
    >
      <div className="flex items-center px-3 py-2.5 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
          Production Tags
        </span>
        <span className="text-[10px] text-(--fd-text-muted) mr-auto">
          {tags.length}
        </span>
        <button
          className={`bg-transparent border-none cursor-pointer p-0.5 flex items-center ${tagsVisible ? 'text-(--fd-accent)' : 'text-(--fd-text-muted) hover:text-(--fd-text)'}`}
          onClick={() => setTagsVisible(!tagsVisible)}
          title={tagsVisible ? 'Hide tag highlights' : 'Show tag highlights'}
          aria-label={
            tagsVisible ? 'Hide tag highlights' : 'Show tag highlights'
          }
        >
          {tagsVisible ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3C4.36 3 1.26 5.28 0 8.5c1.26 3.22 4.36 5.5 8 5.5s6.74-2.28 8-5.5C14.74 5.28 11.64 3 8 3zm0 9.17c-1.84 0-3.33-1.49-3.33-3.33S6.16 5.5 8 5.5s3.33 1.49 3.33 3.33S9.84 12.17 8 12.17zm0-5.34a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.36 11.35l2.06 2.06-.71.71L.65 0.06l.71-.71 2.68 2.68C5.19 1.38 6.55 1 8 1c3.64 0 6.74 2.28 8 5.5a9.77 9.77 0 01-2.64 3.85zM8 3.5c-1.1 0-2.12.53-2.75 1.4l1.18 1.18A2 2 0 018 4.83a2 2 0 012 2c0 .23-.04.44-.1.65l1.18 1.18c.87-.63 1.4-1.65 1.4-2.75A3.33 3.33 0 008 3.5zm-4.65.82L5.12 6.1a3.33 3.33 0 004.28 4.28l1.25 1.25C9.56 12.22 8.82 12.5 8 12.5c-3.64 0-6.74-2.28-8-5.5a9.77 9.77 0 013.35-3.68z" />
            </svg>
          )}
        </button>
        <button
          className="bg-transparent border-none text-(--fd-text-muted) text-lg cursor-pointer px-1 py-0 leading-none hover:text-(--fd-text)"
          onClick={toggleTagsPanel}
          title="Close"
          aria-label="Close production tags panel"
        >
          &times;
        </button>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="flex border-b border-(--fd-border) shrink-0">
        <button
          className={`${tabBase}${activeTab === 'view' ? ` ${tabActive}` : ''}`}
          onClick={() => setActiveTab('view')}
        >
          View
        </button>
        <button
          className={`${tabBase}${activeTab === 'manage' ? ` ${tabActive}` : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          Manage
          {pendingTagSelection && (
            <span className="inline-block w-1.5 h-1.5 bg-(--fd-accent) rounded-full ml-[5px] align-middle" />
          )}
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════
           VIEW TAB — clean read-only browse, click to navigate
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'view' && (
        <div className="flex-1 [&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-track]:bg-transparent py-1 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar]:w-[6px] overflow-y-auto">
          {tags.length === 0 ? (
            <div className="px-3 py-5 text-(--fd-text-muted) text-xs italic text-center leading-[1.5]">
              No tags yet. Select text in the editor, right-click, and choose
              &ldquo;Tag&rdquo; to get started.
            </div>
          ) : (
            tagCategories.map((cat) => {
              const entities = tagsByCategory.get(cat.id) || []
              if (entities.length === 0) return null
              const isExpanded = expandedCats.has(cat.id)
              const totalOccs = entities.reduce(
                (sum, e) => sum + (occurrencesByTag.get(e.id)?.length || 0),
                0,
              )
              return (
                <div key={cat.id} className="border-b border-(--fd-border)">
                  <div
                    className="flex items-center gap-2.5 hover:bg-white/[0.03] px-3 py-2.5 min-h-10 cursor-pointer tags-category-header"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <span
                      className="inline-block rounded-[3px] w-3.5 h-3.5 shrink-0"
                      style={{ background: cat.color }}
                    />
                    <span className="tags-category-name flex-1 text-sm text-(--fd-text) font-medium">
                      {cat.name}
                    </span>
                    <span
                      className="text-[10px] text-(--fd-text-muted) bg-(--fd-overlay-subtle) px-1.5 py-px rounded-full"
                      title={`${entities.length} entities, ${totalOccs} occurrences`}
                    >
                      {entities.length}
                    </span>
                    <span
                      className={`text-[10px] text-(--fd-text-muted) transition-transform duration-150${isExpanded ? ' rotate-180' : ''}`}
                    >
                      &#9662;
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="pt-0.5 pb-1.5">
                      {entities.map((entity) => {
                        const entityOccs = occurrencesByTag.get(entity.id) || []
                        const isViewExpanded = viewExpandedTagId === entity.id
                        return (
                          <div key={entity.id}>
                            <div className="flex items-center gap-1.5 py-[3px] pr-3 pl-8 text-[11px]">
                              <span
                                className="flex-1 text-(--fd-text) cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis font-semibold hover:text-(--fd-accent)"
                                onClick={() => handleNavigateToTag(entity.id)}
                                title="Navigate to first occurrence"
                              >
                                {entity.name}
                              </span>
                              <span
                                className="text-[10px] text-(--fd-text-muted) bg-(--fd-overlay-light) px-[5px] py-px rounded-full ml-1 shrink-0"
                                title={`${entityOccs.length} occurrence${entityOccs.length !== 1 ? 's' : ''}`}
                              >
                                {entityOccs.length}
                              </span>
                              {entity.notes && (
                                <span
                                  className="text-(--fd-accent) text-[10px] shrink-0"
                                  title="Has notes"
                                >
                                  *
                                </span>
                              )}
                              {entityOccs.length > 1 && (
                                <button
                                  className="bg-transparent border-none text-(--fd-text-muted) text-[10px] cursor-pointer px-0.5 py-0 shrink-0 hover:text-(--fd-text)"
                                  onClick={() =>
                                    setViewExpandedTagId(
                                      isViewExpanded ? null : entity.id,
                                    )
                                  }
                                  title={
                                    isViewExpanded
                                      ? 'Hide occurrences'
                                      : 'Show occurrences'
                                  }
                                  aria-label={
                                    isViewExpanded
                                      ? `Hide occurrences for ${entity.name}`
                                      : `Show occurrences for ${entity.name}`
                                  }
                                >
                                  {isViewExpanded ? '\u25B4' : '\u25BE'}
                                </button>
                              )}
                            </div>
                            {/* Read-only occurrence list */}
                            {isViewExpanded && entityOccs.length > 1 && (
                              <div className="pt-1 pr-3 pb-2 pl-8">
                                <div>
                                  {entityOccs.map((occ, i) => (
                                    <div
                                      key={`${occ.from}-${i}`}
                                      className="flex items-center gap-1.5 py-[3px] text-[11px]"
                                    >
                                      <span
                                        className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer text-(--fd-accent) hover:underline"
                                        onClick={() =>
                                          handleNavigateToOccurrence(occ.from)
                                        }
                                        title="Navigate to this occurrence"
                                      >
                                        &ldquo;{occ.text.slice(0, 40)}
                                        {occ.text.length > 40 ? '...' : ''}
                                        &rdquo;
                                      </span>
                                      {occ.sceneName && (
                                        <span className="text-[10px] text-(--fd-text-muted) whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] shrink-0">
                                          {occ.sceneName.slice(0, 30)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
           MANAGE TAB — add/edit/delete tags and categories
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'manage' && (
        <>
          {/* ── Pending tag selection: step 1 — pick category ─────────── */}
          {pendingTagSelection && !pendingCategoryId && (
            <div className="tags-pending border-b-2 border-(--fd-accent) bg-(--fd-navigator-bg) flex-1 flex flex-col overflow-y-auto">
              <div className="tags-pending-header flex items-center justify-between px-3.5 pt-2.5 pb-1.5 text-[13px] text-(--fd-text) font-semibold">
                <span>
                  Tag: &ldquo;{pendingTagSelection.text.slice(0, 40)}
                  {pendingTagSelection.text.length > 40 ? '...' : ''}&rdquo;
                </span>
                <button
                  className="tags-pending-cancel bg-transparent border-none text-(--fd-text-muted) text-base cursor-pointer leading-none hover:text-(--fd-text)"
                  onClick={handleCancelPending}
                  aria-label="Cancel pending tag selection"
                >
                  &times;
                </button>
              </div>
              <div className="text-[11px] text-(--fd-accent) uppercase tracking-[0.4px] px-3.5 pt-1.5 pb-1.5 font-semibold">
                Select a category:
              </div>
              <div className="flex-1 pb-1 overflow-y-auto">
                {tagCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="tags-pending-item flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer text-sm text-(--fd-text) min-h-10 border-b border-(--fd-border) hover:bg-(--fd-accent) hover:text-white"
                    onClick={() => handlePickCategory(cat.id)}
                  >
                    <span
                      className="inline-block rounded-[3px] w-3.5 h-3.5 shrink-0"
                      style={{ background: cat.color }}
                    />
                    <span>{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Pending tag selection: step 2 — pick entity or create ─── */}
          {pendingTagSelection && pendingCategoryId && (
            <div className="tags-pending border-b-2 border-(--fd-accent) bg-(--fd-navigator-bg) flex-1 flex flex-col overflow-y-auto">
              <div className="tags-pending-header flex items-center justify-between px-3.5 pt-2.5 pb-1.5 text-[13px] text-(--fd-text) font-semibold">
                <span>
                  {tagCategories.find((c) => c.id === pendingCategoryId)?.name}{' '}
                  &rarr; &ldquo;{pendingTagSelection.text.slice(0, 30)}
                  {pendingTagSelection.text.length > 30 ? '...' : ''}&rdquo;
                </span>
                <button
                  className="tags-pending-cancel bg-transparent border-none text-(--fd-text-muted) text-base cursor-pointer leading-none hover:text-(--fd-text)"
                  onClick={handleCancelPending}
                  aria-label="Cancel pending tag selection"
                >
                  &times;
                </button>
              </div>

              <div className="px-3.5 py-2.5 border-white/[0.06] border-b">
                <div className="text-[11px] text-(--fd-accent) uppercase tracking-[0.4px] pt-1.5 pb-1.5 font-semibold">
                  Create new:
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    className="flex-1 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded-md px-3 py-2.5 text-base outline-none min-h-11 focus:border-(--fd-accent)"
                    type="text"
                    value={newEntityName}
                    onChange={(e) => setNewEntityName(e.target.value)}
                    placeholder="Entity name..."
                    aria-label="New entity name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newEntityName.trim()) {
                        if (pendingCategoryId)
                          handleCreateNewEntity(pendingCategoryId)
                      }
                    }}
                  />
                  <button
                    ref={createBtnRef}
                    className="bg-(--fd-accent) text-white border-none rounded-md px-5 py-2.5 min-h-11 text-[11px] font-semibold cursor-pointer shrink-0 [-webkit-tap-highlight-color:rgba(0,0,0,0.1)] [touch-action:manipulation] disabled:opacity-40 disabled:cursor-default disabled:pointer-events-none hover:opacity-85"
                    onClick={() => {
                      if (pendingCategoryId)
                        handleCreateNewEntity(pendingCategoryId)
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>

              {pendingCatEntities.length > 0 && (
                <>
                  <div className="text-[11px] text-(--fd-accent) uppercase tracking-[0.4px] px-3.5 pb-1.5 font-semibold mt-1.5 pt-1.5 border-t border-(--fd-overlay-subtle)">
                    Or add to existing:
                  </div>
                  <div className="flex-1 pb-1 overflow-y-auto">
                    {pendingCatEntities.map((entity) => {
                      const occCount =
                        occurrencesByTag.get(entity.id)?.length || 0
                      return (
                        <div
                          key={entity.id}
                          className="tags-pending-item flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer text-sm text-(--fd-text) min-h-10 border-b border-(--fd-border) justify-between hover:bg-(--fd-accent) hover:text-white"
                          onClick={() => handleAddToExistingEntity(entity)}
                        >
                          <span className="font-medium">{entity.name}</span>
                          <span className="text-[10px] text-(--fd-text-muted) bg-(--fd-overlay-light) px-1.5 py-px rounded-full">
                            {occCount}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              <button
                className="block w-full bg-transparent border-none border-t border-(--fd-overlay-subtle) text-(--fd-text-muted) text-[11px] px-2.5 py-2 text-left cursor-pointer hover:text-(--fd-accent)"
                onClick={() => setPendingCategoryId(null)}
              >
                &larr; Back to categories
              </button>
            </div>
          )}

          {/* ── Editable tag list (hidden during pending selection) ───── */}
          <div
            className="flex-1 [&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-track]:bg-transparent py-1 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar]:w-[6px] overflow-y-auto"
            style={pendingTagSelection ? { display: 'none' } : undefined}
          >
            {tagCategories.length === 0 ? (
              <div className="px-3 py-5 text-(--fd-text-muted) text-xs italic text-center leading-[1.5]">
                No categories yet. Add one below.
              </div>
            ) : (
              tagCategories.map((cat) => {
                const entities = tagsByCategory.get(cat.id) || []
                const isExpanded = expandedCats.has(cat.id)
                const totalOccs = entities.reduce(
                  (sum, e) => sum + (occurrencesByTag.get(e.id)?.length || 0),
                  0,
                )
                return (
                  <div key={cat.id} className="border-b border-(--fd-border)">
                    <div
                      className="flex items-center gap-2.5 hover:bg-white/[0.03] px-3 py-2.5 min-h-10 cursor-pointer tags-category-header"
                      onClick={() =>
                        entities.length > 0 && toggleCategory(cat.id)
                      }
                    >
                      <span
                        className="inline-block rounded-[3px] w-3.5 h-3.5 shrink-0"
                        style={{ background: cat.color }}
                      />
                      <span
                        className={`tags-category-name flex-1 text-sm font-medium${entities.length === 0 ? '' : ' text-(--fd-text)'}`}
                        style={
                          entities.length === 0
                            ? { color: 'var(--fd-text-muted)' }
                            : undefined
                        }
                      >
                        {cat.name}
                      </span>
                      {entities.length > 0 && (
                        <span
                          className="text-[10px] text-(--fd-text-muted) bg-(--fd-overlay-subtle) px-1.5 py-px rounded-full"
                          title={`${entities.length} entities, ${totalOccs} occurrences`}
                        >
                          {entities.length}
                        </span>
                      )}
                      {!cat.isBuiltIn && (
                        <button
                          className="bg-transparent border-none text-(--fd-text-muted) text-sm cursor-pointer px-0.5 py-0 leading-none shrink-0 hover:text-[#ff6b6b]"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteTagCategory(cat.id)
                          }}
                          title="Delete custom category"
                          aria-label={`Delete custom category ${cat.name}`}
                        >
                          &times;
                        </button>
                      )}
                      {entities.length > 0 && (
                        <span
                          className={`text-[10px] text-(--fd-text-muted) transition-transform duration-150${isExpanded ? ' rotate-180' : ''}`}
                        >
                          &#9662;
                        </span>
                      )}
                    </div>

                    {isExpanded && entities.length > 0 && (
                      <div className="pt-0.5 pb-1.5">
                        {entities.map((entity) => {
                          const entityOccs =
                            occurrencesByTag.get(entity.id) || []
                          const isEntityExpanded = expandedTagId === entity.id
                          return (
                            <div
                              key={entity.id}
                              className={
                                isEntityExpanded
                                  ? 'bg-[rgba(74,158,255,0.06)] rounded'
                                  : ''
                              }
                              ref={(el) => {
                                if (el) tagItemRefs.current.set(entity.id, el)
                              }}
                            >
                              <div className="flex items-center gap-1.5 py-[3px] pr-3 pl-8 text-[11px]">
                                <span
                                  className="flex-1 text-(--fd-text) cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis font-semibold hover:text-(--fd-accent)"
                                  onClick={() =>
                                    setExpandedTagId(
                                      isEntityExpanded ? null : entity.id,
                                    )
                                  }
                                  title="Click to edit"
                                >
                                  {entity.name}
                                </span>
                                <span
                                  className="text-[10px] text-(--fd-text-muted) bg-(--fd-overlay-light) px-[5px] py-px rounded-full ml-1 shrink-0"
                                  title={`${entityOccs.length} occurrence${entityOccs.length !== 1 ? 's' : ''}`}
                                >
                                  {entityOccs.length}
                                </span>
                                <button
                                  className="bg-transparent border-none text-(--fd-text-muted) text-sm cursor-pointer px-0.5 py-0 leading-none shrink-0 hover:text-[#ff6b6b]"
                                  onClick={() => handleDeleteEntity(entity.id)}
                                  title="Delete entity and all occurrences"
                                  aria-label={`Delete entity ${entity.name} and all occurrences`}
                                >
                                  &times;
                                </button>
                              </div>

                              {isEntityExpanded && (
                                <div className="pt-1 pr-3 pb-2 pl-8">
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <label className="text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] shrink-0">
                                      Name
                                    </label>
                                    <input
                                      className="flex-1 bg-(--fd-input-bg) text-(--fd-text) border border-transparent rounded-[3px] px-1.5 py-1 text-xs font-semibold outline-none focus:border-(--fd-accent) focus:bg-black/30"
                                      type="text"
                                      value={entity.name}
                                      onChange={(e) =>
                                        updateTag(entity.id, {
                                          name: e.target.value,
                                        })
                                      }
                                      aria-label={`Edit name for ${entity.name}`}
                                    />
                                  </div>
                                  <textarea
                                    className="w-full bg-(--fd-input-bg) text-(--fd-text) border border-transparent rounded-[3px] px-2 py-1.5 text-[11px] leading-[1.4] resize-y outline-none placeholder:text-(--fd-text-muted) focus:border-(--fd-accent) focus:bg-black/30"
                                    value={entity.notes}
                                    onChange={(e) =>
                                      updateTag(entity.id, {
                                        notes: e.target.value,
                                      })
                                    }
                                    placeholder="Add details: description, requirements, budget notes..."
                                    rows={3}
                                    aria-label={`Notes for ${entity.name}`}
                                  />
                                  {entityOccs.length > 0 && (
                                    <div className="mt-2 border-t border-(--fd-overlay-subtle) pt-1.5">
                                      <div className="text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] shrink-0">
                                        Occurrences ({entityOccs.length})
                                      </div>
                                      {entityOccs.map((occ, i) => (
                                        <div
                                          key={`${occ.from}-${i}`}
                                          className="flex items-center gap-1.5 py-[3px] text-[11px]"
                                        >
                                          <span
                                            className="flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer text-(--fd-accent) hover:underline"
                                            onClick={() =>
                                              handleNavigateToOccurrence(
                                                occ.from,
                                              )
                                            }
                                            title="Navigate to this occurrence"
                                          >
                                            &ldquo;{occ.text.slice(0, 40)}
                                            {occ.text.length > 40 ? '...' : ''}
                                            &rdquo;
                                          </span>
                                          {occ.sceneName && (
                                            <span className="text-[10px] text-(--fd-text-muted) whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] shrink-0">
                                              {occ.sceneName.slice(0, 30)}
                                            </span>
                                          )}
                                          <button
                                            className="bg-transparent border-none text-(--fd-text-muted) text-xs cursor-pointer px-[3px] py-0 shrink-0 hover:text-[#ff6b6b]"
                                            onClick={() =>
                                              handleRemoveOccurrence(
                                                occ.tagId,
                                                occ.from,
                                                occ.to,
                                              )
                                            }
                                            title="Remove this occurrence"
                                            aria-label={`Remove occurrence of ${entity.name}`}
                                          >
                                            &times;
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Add custom category */}
          {showAddForm ? (
            <div className="flex gap-1 px-3 py-2 border-t border-(--fd-border) shrink-0">
              <input
                type="text"
                className="flex-1 h-[26px] bg-[#222] text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-[11px] outline-none focus:border-(--fd-accent)"
                placeholder="Category name..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                autoFocus
                aria-label="New category name"
              />
              <input
                type="color"
                className="bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-white/15 border-none rounded-[3px] [&::-webkit-color-swatch]:rounded-[3px] w-[26px] h-[26px] cursor-pointer"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                aria-label="New category color"
              />
              <button
                className="px-2 h-[26px] bg-transparent border border-(--fd-accent) rounded-[3px] text-(--fd-accent) text-[11px] cursor-pointer hover:bg-[rgba(74,158,255,0.1)]"
                onClick={handleAddCategory}
              >
                Add
              </button>
              <button
                className="px-2 h-[26px] bg-transparent border border-(--fd-border) rounded-[3px] text-(--fd-text-muted) text-[11px] cursor-pointer"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="mx-3 mt-2 mb-3 p-2 bg-transparent border border-dashed border-(--fd-border) rounded text-(--fd-text-muted) text-xs cursor-pointer shrink-0 text-center hover:border-(--fd-accent) hover:text-(--fd-accent)"
              onClick={() => setShowAddForm(true)}
            >
              + Add Category
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default TagsPanel
