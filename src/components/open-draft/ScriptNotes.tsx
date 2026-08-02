import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useDelayedUnmount, useSwipeDismiss } from '@/hooks/useTouch'
import {
  useEditorStore,
  ELEMENT_LABELS,
  NOTE_COLORS,
  type NoteColor,
  type ElementType,
  type NoteFilter,
} from '@/stores/editorStore'
import { useAssetStore, type Asset } from '@/stores/assetStore'
import { useProjectStore } from '@/stores/projectStore'
import { api } from '@/services/api'
import { isTauri } from '@/services/platform'

/** Open a URL in the default browser. Uses Tauri invoke on desktop, window.open on web. */
const openInBrowser = (url: string) => {
  if (isTauri()) {
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke('open_url', { url }).catch((err: unknown) =>
        console.error('Failed to open URL:', err),
      )
    })
  } else {
    window.open(url, '_blank')
  }
}

interface ScriptNotesProps {
  editor: Editor | null
  style?: React.CSSProperties
}

/** Check if a string looks like an image URL */
const isImageUrl = (url: string) =>
  /\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?.*)?$/i.test(url)

/** Check if a string looks like a video URL */
const isVideoUrl = (url: string) =>
  /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) ||
  /youtube\.com\/watch|youtu\.be\/|vimeo\.com\//i.test(url)

/** Convert YouTube/Vimeo URL to embeddable URL */
const toEmbedUrl = (url: string): string | null => {
  // YouTube
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (m) return `https://www.youtube-nocookie.com/embed/${m[1]}`
  // Vimeo
  m = url.match(/vimeo\.com\/(\d+)/)
  if (m) return `https://player.vimeo.com/video/${m[1]}`
  return null
}

/**
 * Render note content with media embeds and @asset references.
 * - URLs on their own line that look like images render as <img>
 * - URLs that look like videos render as <video> or iframe embed
 * - @AssetName references render as clickable asset links
 */
const MEDIA_EMBED_CLASS =
  'my-1 rounded overflow-hidden max-w-full [&_img]:max-w-full [&_img]:h-auto [&_img]:block [&_img]:rounded [&_video]:max-w-full [&_video]:h-auto [&_video]:block [&_video]:rounded [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:border-none [&_iframe]:rounded'

const NoteContentDisplay: React.FC<{
  content: string
  assets: Asset[]
  projectId: string | null
}> = ({ content, assets, projectId }) => {
  if (!content) return null

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Image URL on its own line
    if (isImageUrl(line) && /^https?:\/\//.test(line)) {
      elements.push(
        <div key={i} className={MEDIA_EMBED_CLASS}>
          <img src={line} alt="" loading="lazy" />
        </div>,
      )
      continue
    }

    // Video URL on its own line
    if (isVideoUrl(line) && /^https?:\/\//.test(line)) {
      const embedUrl = toEmbedUrl(line)
      if (embedUrl) {
        if (isTauri()) {
          // In Tauri, YouTube/Vimeo iframes don't work (origin restriction).
          // Show as a clickable link that opens in the default browser.
          elements.push(
            <div key={i} className={MEDIA_EMBED_CLASS}>
              <a
                href={line}
                target="_blank"
                rel="noreferrer"
                className="text-(--fd-accent,#6ea0f7) underline cursor-pointer break-all hover:opacity-80"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  openInBrowser(line)
                }}
              >
                {line}
              </a>
            </div>,
          )
        } else {
          elements.push(
            <div key={i} className={MEDIA_EMBED_CLASS}>
              <iframe src={embedUrl} allowFullScreen title="video" />
            </div>,
          )
        }
      } else {
        elements.push(
          <div key={i} className={MEDIA_EMBED_CLASS}>
            <video src={line} controls preload="metadata" />
          </div>,
        )
      }
      continue
    }

    // Parse @asset references inline
    const parts = line.split(/(@\S+)/g)
    const lineElements: React.ReactNode[] = []
    for (let j = 0; j < parts.length; j++) {
      const part = parts[j]
      if (part.startsWith('@')) {
        const assetName = part.slice(1)
        const asset = assets.find(
          (a) =>
            a.original_name.toLowerCase() === assetName.toLowerCase() ||
            a.original_name.replace(/\s+/g, '_').toLowerCase() ===
              assetName.toLowerCase(),
        )
        if (asset) {
          const isImg = asset.mime_type.startsWith('image/')
          const url = projectId ? api.getAssetUrl(projectId, asset.id) : '#'
          if (isImg) {
            lineElements.push(
              <span
                key={j}
                className="inline text-(--fd-accent) font-medium cursor-pointer hover:underline"
              >
                <img
                  src={url}
                  alt={asset.original_name}
                  className="inline-block mr-0.75 rounded-sm w-auto h-4.5 align-middle"
                  loading="lazy"
                />
                <span className="align-middle">{part}</span>
              </span>,
            )
          } else {
            lineElements.push(
              <a
                key={j}
                className="inline text-(--fd-accent) font-medium cursor-pointer no-underline hover:underline"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                {part}
              </a>,
            )
          }
        } else {
          lineElements.push(
            <span
              key={j}
              className="inline text-(--fd-text-muted) font-medium italic cursor-pointer"
            >
              {part}
            </span>,
          )
        }
      } else {
        // Detect URLs in plain text and render as clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const textParts = part.split(urlRegex)
        for (let k = 0; k < textParts.length; k++) {
          const tp = textParts[k]
          if (urlRegex.test(tp)) {
            const handleClick = (e: React.MouseEvent) => {
              e.stopPropagation()
              e.preventDefault()
              openInBrowser(tp)
            }
            lineElements.push(
              <a
                key={`${j}-${k}`}
                href={tp}
                target="_blank"
                rel="noreferrer"
                className="text-(--fd-accent,#6ea0f7) underline cursor-pointer break-all hover:opacity-80"
                onClick={handleClick}
              >
                {tp}
              </a>,
            )
          } else if (tp) {
            lineElements.push(<span key={`${j}-${k}`}>{tp}</span>)
          }
          // Reset regex lastIndex since we reuse it
          urlRegex.lastIndex = 0
        }
      }
    }

    elements.push(
      <div key={i} className="mb-0.5">
        {lineElements}
      </div>,
    )
  }

  return (
    <div className="text-xs text-(--fd-text) leading-[1.45]">{elements}</div>
  )
}

const ScriptNotes: React.FC<ScriptNotesProps> = ({ editor, style }) => {
  const {
    notes,
    scriptNotesOpen,
    scenes,
    updateNote,
    deleteNote,
    toggleScriptNotes,
    noteFilter,
    setNoteFilter,
    generalNotes,
    addGeneralNote,
    updateGeneralNote,
    deleteGeneralNote,
    notesActiveTab: activeTab,
    setNotesActiveTab: setActiveTab,
  } = useEditorStore()

  const { assets } = useAssetStore()
  const { currentProject } = useProjectStore()
  const projectId = currentProject?.id ?? null

  // Track which note is being edited (shows textarea), null = preview mode for all
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)

  // Track which general note is being edited
  const [editingGeneralNoteId, setEditingGeneralNoteId] = useState<
    string | null
  >(null)

  // @asset autocomplete state
  const [assetQuery, setAssetQuery] = useState<string | null>(null)
  const [assetSuggestions, setAssetSuggestions] = useState<Asset[]>([])
  const [assetSugIdx, setAssetSugIdx] = useState(0)
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map())

  // Sync external filter changes (from context menu) to panel
  const [localFilter, setLocalFilter] = useState<NoteFilter>(noteFilter)
  useEffect(() => {
    setLocalFilter(noteFilter)
  }, [noteFilter])

  // Unique context labels and element types from notes for filter chips
  const filterOptions = useMemo(() => {
    const types = new Set<string>()
    const contexts = new Set<string>()
    for (const n of notes) {
      types.add(n.elementType)
      if (n.contextLabel) contexts.add(n.contextLabel)
    }
    return {
      types: Array.from(types).sort(),
      contexts: Array.from(contexts).sort(),
    }
  }, [notes])

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // If filtering to a specific note by ID, only show that one
      if (localFilter.noteId) return n.id === localFilter.noteId
      if (localFilter.elementType && n.elementType !== localFilter.elementType)
        return false
      if (
        localFilter.contextLabel &&
        n.contextLabel !== localFilter.contextLabel
      )
        return false
      if (localFilter.color && n.color !== localFilter.color) return false
      return true
    })
  }, [notes, localFilter])

  const isFiltered =
    localFilter.elementType ||
    localFilter.contextLabel ||
    localFilter.color ||
    localFilter.noteId

  const getSceneName = useCallback(
    (sceneId: string | null) => {
      if (!sceneId) return null
      const scene = scenes.find((s) => s.id === sceneId)
      return scene ? scene.heading : null
    },
    [scenes],
  )

  const getNoteColorHex = (colorName: NoteColor): string => {
    const c = NOTE_COLORS.find((nc) => nc.name === colorName)
    return c ? c.hex : NOTE_COLORS[0].hex
  }

  const handleClearFilter = useCallback(() => {
    const cleared: NoteFilter = {
      elementType: null,
      contextLabel: null,
      color: null,
      noteId: null,
    }
    setLocalFilter(cleared)
    setNoteFilter(cleared)
  }, [setNoteFilter])

  const toggleTypeFilter = useCallback(
    (type: string) => {
      const next: NoteFilter = {
        ...localFilter,
        elementType: localFilter.elementType === type ? null : type,
      }
      setLocalFilter(next)
      setNoteFilter(next)
    },
    [localFilter, setNoteFilter],
  )

  const toggleContextFilter = useCallback(
    (ctx: string) => {
      const next: NoteFilter = {
        ...localFilter,
        contextLabel: localFilter.contextLabel === ctx ? null : ctx,
      }
      setLocalFilter(next)
      setNoteFilter(next)
    },
    [localFilter, setNoteFilter],
  )

  const toggleColorFilter = useCallback(
    (color: NoteColor) => {
      const next: NoteFilter = {
        ...localFilter,
        color: localFilter.color === color ? null : color,
      }
      setLocalFilter(next)
      setNoteFilter(next)
    },
    [localFilter, setNoteFilter],
  )

  const [pendingDeleteNoteId, setPendingDeleteNoteId] = useState<string | null>(
    null,
  )
  const [pendingDeleteGeneralNoteId, setPendingDeleteGeneralNoteId] = useState<
    string | null
  >(null)

  const handleDeleteRequest = useCallback((id: string) => {
    setPendingDeleteNoteId(id)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    const id = pendingDeleteNoteId
    if (!id) return
    setPendingDeleteNoteId(null)
    if (editor) {
      const { doc, schema } = editor.state
      const markType = schema.marks.scriptNote
      if (markType) {
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            doc.descendants((node, pos) => {
              if (!node.isText) return
              const mark = node.marks.find(
                (m) => m.type === markType && m.attrs.noteId === id,
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
    deleteNote(id)
  }, [editor, deleteNote, pendingDeleteNoteId])

  const handleColorChange = useCallback(
    (id: string, color: NoteColor) => {
      updateNote(id, { color })
      if (editor) {
        const hex = getNoteColorHex(color)
        const { doc, schema } = editor.state
        const markType = schema.marks.scriptNote
        if (markType) {
          editor
            .chain()
            .command(({ tr }) => {
              doc.descendants((node, pos) => {
                if (!node.isText) return
                const mark = node.marks.find(
                  (m) => m.type === markType && m.attrs.noteId === id,
                )
                if (mark) {
                  tr.removeMark(pos, pos + node.nodeSize, mark)
                  tr.addMark(
                    pos,
                    pos + node.nodeSize,
                    markType.create({ noteId: id, color: hex }),
                  )
                }
              })
              return true
            })
            .run()
        }
      }
    },
    [editor, updateNote],
  )

  const handleNavigateToNote = useCallback(
    (noteId: string) => {
      if (!editor) return
      const { doc, schema } = editor.state
      const markType = schema.marks.scriptNote
      if (!markType) return

      let targetPos: number | null = null
      doc.descendants((node, pos) => {
        if (targetPos !== null) return false
        if (!node.isText) return
        const mark = node.marks.find(
          (m) => m.type === markType && m.attrs.noteId === noteId,
        )
        if (mark) {
          targetPos = pos
          return false
        }
      })

      if (targetPos !== null) {
        editor.chain().focus().setTextSelection(targetPos).run()
        const coords = editor.view.coordsAtPos(targetPos)
        const editorMain = document.querySelector('.editor-main')
        if (editorMain && coords) {
          const rect = editorMain.getBoundingClientRect()
          const scrollTo =
            editorMain.scrollTop + (coords.top - rect.top) - rect.height / 3
          editorMain.scrollTo({ top: scrollTo, behavior: 'auto' })
        }
      }
    },
    [editor],
  )

  // ── General notes handlers ──
  const handleAddGeneralNote = useCallback(() => {
    const id = addGeneralNote({
      title: '',
      content: '',
      color: 'Yellow' as NoteColor,
    })
    setEditingGeneralNoteId(id)
  }, [addGeneralNote])

  const handleDeleteGeneralNoteConfirm = useCallback(() => {
    if (!pendingDeleteGeneralNoteId) return
    deleteGeneralNote(pendingDeleteGeneralNoteId)
    setPendingDeleteGeneralNoteId(null)
    if (editingGeneralNoteId === pendingDeleteGeneralNoteId)
      setEditingGeneralNoteId(null)
  }, [deleteGeneralNote, pendingDeleteGeneralNoteId, editingGeneralNoteId])

  // When external filter opens panel to a specific script note, switch to script tab
  useEffect(() => {
    if (
      noteFilter.noteId ||
      noteFilter.elementType ||
      noteFilter.contextLabel ||
      noteFilter.color
    ) {
      setActiveTab('script')
    }
  }, [noteFilter])

  /** Handle @asset autocomplete inside textarea */
  const handleTextareaChange = useCallback(
    (noteId: string, value: string) => {
      updateNote(noteId, { content: value })

      // Check for @mention trigger
      const textarea = textareaRefs.current.get(noteId)
      if (!textarea) return
      const cursor = textarea.selectionStart
      const before = value.slice(0, cursor)
      const atMatch = before.match(/@(\S*)$/)
      if (atMatch) {
        const query = atMatch[1].toLowerCase()
        setAssetQuery(query)
        const matches = assets
          .filter(
            (a) =>
              a.original_name.toLowerCase().includes(query) ||
              a.original_name
                .replace(/\s+/g, '_')
                .toLowerCase()
                .includes(query),
          )
          .slice(0, 8)
        setAssetSuggestions(matches)
        setAssetSugIdx(0)
      } else {
        setAssetQuery(null)
        setAssetSuggestions([])
      }
    },
    [updateNote, assets],
  )

  const insertAssetRef = useCallback(
    (noteId: string, asset: Asset) => {
      const note = notes.find((n) => n.id === noteId)
      if (!note) return
      const textarea = textareaRefs.current.get(noteId)
      if (!textarea) return

      const cursor = textarea.selectionStart
      const before = note.content.slice(0, cursor)
      const after = note.content.slice(cursor)
      const atMatch = before.match(/@(\S*)$/)
      if (!atMatch) return

      const prefix = before.slice(0, before.length - atMatch[0].length)
      const ref = `@${asset.original_name.replace(/\s+/g, '_')}`
      const newContent = prefix + ref + ' ' + after
      updateNote(noteId, { content: newContent })

      setAssetQuery(null)
      setAssetSuggestions([])

      // Restore cursor position after insert
      requestAnimationFrame(() => {
        const pos = prefix.length + ref.length + 1
        textarea.setSelectionRange(pos, pos)
        textarea.focus()
      })
    },
    [notes, updateNote],
  )

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>, noteId: string) => {
      if (assetSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setAssetSugIdx((i) => Math.min(i + 1, assetSuggestions.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setAssetSugIdx((i) => Math.max(i - 1, 0))
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          insertAssetRef(noteId, assetSuggestions[assetSugIdx])
        } else if (e.key === 'Escape') {
          setAssetQuery(null)
          setAssetSuggestions([])
        }
      }
    },
    [assetSuggestions, assetSugIdx, insertAssetRef],
  )

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const { shouldRender, animationState } = useDelayedUnmount(
    scriptNotesOpen,
    250,
  )
  const panelRef = useRef<HTMLDivElement>(null)
  useSwipeDismiss(panelRef, {
    direction: 'right',
    onDismiss: toggleScriptNotes,
    enabled: shouldRender,
  })

  if (!shouldRender) return null

  const panelClass =
    animationState === 'entered'
      ? 'panel-open'
      : animationState === 'exiting'
        ? 'panel-closing'
        : ''

  const snTabClass = (active: boolean) =>
    `flex-1 bg-none border-none border-b-2 text-xs font-medium py-2 px-3 cursor-pointer transition-colors hover:text-(--fd-text) ${active ? 'text-(--fd-accent) border-b-(--fd-accent)' : 'text-(--fd-text-muted) border-b-transparent'}`

  return (
    <div
      ref={panelRef}
      className={`script-notes-panel w-75 min-w-50 bg-(--fd-navigator-bg) border-l border-(--fd-border) flex flex-col overflow-hidden ${panelClass}`}
      style={style}
    >
      <div className="flex items-center px-3 py-2.5 border-b border-(--fd-border) shrink-0 gap-2">
        <span className="font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
          Notes
        </span>
        <button
          className="bg-none border-none text-(--fd-text-muted) text-lg cursor-pointer py-0 px-1 leading-none hover:text-(--fd-text)"
          onClick={toggleScriptNotes}
          title="Close"
        >
          &times;
        </button>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex border-b border-(--fd-border) shrink-0">
        <button
          className={snTabClass(activeTab === 'general')}
          onClick={() => setActiveTab('general')}
        >
          General{generalNotes.length > 0 ? ` (${generalNotes.length})` : ''}
        </button>
        <button
          className={snTabClass(activeTab === 'script')}
          onClick={() => setActiveTab('script')}
        >
          Script
          {notes.length > 0
            ? ` (${isFiltered ? `${filteredNotes.length}/` : ''}${notes.length})`
            : ''}
        </button>
      </div>

      {activeTab === 'script' && (
        <>
          {/* ── Multi-dimensional filter bar ── */}
          <div className="border-b border-(--fd-border) shrink-0 pt-1.5 px-2.5 pb-1">
            {/* Active filter summary + clear */}
            {isFiltered && (
              <div className="flex flex-wrap items-center gap-1 mb-1.5">
                {localFilter.noteId && (
                  <span
                    className="inline-flex items-center gap-0.75 py-0.5 px-2 bg-[rgba(74,158,255,.12)] border border-(--fd-accent) rounded-[10px] text-(--fd-accent) text-[10px] cursor-pointer whitespace-nowrap max-w-37.5 overflow-hidden text-ellipsis hover:bg-[rgba(74,158,255,.22)]"
                    onClick={handleClearFilter}
                  >
                    Selected note
                    <span className="opacity-60 ml-0.5 text-xs">&times;</span>
                  </span>
                )}
                {localFilter.elementType && (
                  <span
                    className="inline-flex items-center gap-0.75 py-0.5 px-2 bg-[rgba(74,158,255,.12)] border border-(--fd-accent) rounded-[10px] text-(--fd-accent) text-[10px] cursor-pointer whitespace-nowrap max-w-37.5 overflow-hidden text-ellipsis hover:bg-[rgba(74,158,255,.22)]"
                    onClick={() => toggleTypeFilter(localFilter.elementType!)}
                  >
                    {ELEMENT_LABELS[localFilter.elementType as ElementType] ||
                      localFilter.elementType}
                    <span className="opacity-60 ml-0.5 text-xs">&times;</span>
                  </span>
                )}
                {localFilter.contextLabel && (
                  <span
                    className="inline-flex items-center gap-0.75 bg-[rgba(232,155,79,.12)] hover:bg-[rgba(232,155,79,.22)] px-2 py-0.5 border border-[#e89b4f] rounded-[10px] max-w-37.5 overflow-hidden text-[#e89b4f] text-[10px] text-ellipsis whitespace-nowrap cursor-pointer"
                    onClick={() =>
                      toggleContextFilter(localFilter.contextLabel!)
                    }
                  >
                    {localFilter.contextLabel}
                    <span className="opacity-60 ml-0.5 text-xs">&times;</span>
                  </span>
                )}
                {localFilter.color && (
                  <span
                    className="inline-flex items-center gap-0.75 py-0.5 px-2 bg-[rgba(74,158,255,.12)] border border-(--fd-accent) rounded-[10px] text-(--fd-accent) text-[10px] cursor-pointer whitespace-nowrap max-w-37.5 overflow-hidden text-ellipsis hover:bg-[rgba(74,158,255,.22)]"
                    onClick={() => toggleColorFilter(localFilter.color!)}
                    style={{ borderColor: getNoteColorHex(localFilter.color) }}
                  >
                    {localFilter.color}
                    <span className="opacity-60 ml-0.5 text-xs">&times;</span>
                  </span>
                )}
                <button
                  className="ml-auto bg-none border-none text-(--fd-text-muted) text-[10px] cursor-pointer underline p-0 hover:text-(--fd-text)"
                  onClick={handleClearFilter}
                >
                  Show All
                </button>
              </div>
            )}

            {/* Type filter row */}
            {filterOptions.types.length > 1 && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] text-(--fd-text-muted) uppercase tracking-[0.4px] w-10.5 shrink-0">
                  Type
                </span>
                <div className="flex flex-wrap flex-1 gap-0.75 min-w-0">
                  {filterOptions.types.map((t) => (
                    <button
                      key={t}
                      className={`py-0.5 px-1.75 rounded-[3px] text-[10px] cursor-pointer whitespace-nowrap max-w-30 overflow-hidden text-ellipsis border ${localFilter.elementType === t ? 'bg-(--fd-accent) border-(--fd-accent) text-white' : 'bg-transparent border-(--fd-border) text-(--fd-text-muted) hover:border-[#555] hover:text-(--fd-text)'}`}
                      onClick={() => toggleTypeFilter(t)}
                    >
                      {ELEMENT_LABELS[t as ElementType] || t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Context filter row */}
            {filterOptions.contexts.length > 0 && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] text-(--fd-text-muted) uppercase tracking-[0.4px] w-10.5 shrink-0">
                  Context
                </span>
                <div className="flex flex-wrap flex-1 gap-0.75 min-w-0">
                  {filterOptions.contexts.map((c) => (
                    <button
                      key={c}
                      className={`py-0.5 px-1.75 rounded-[3px] text-[10px] cursor-pointer whitespace-nowrap max-w-30 overflow-hidden text-ellipsis border ${localFilter.contextLabel === c ? 'bg-[#e89b4f] border-[#e89b4f] text-white' : 'bg-transparent border-(--fd-border) text-(--fd-text-muted) hover:border-[#555] hover:text-(--fd-text)'}`}
                      onClick={() => toggleContextFilter(c)}
                    >
                      {c.length > 25 ? c.slice(0, 25) + '...' : c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color filter */}
            <div className="flex items-center gap-1 mb-0.5 pl-12">
              {NOTE_COLORS.map((c) => {
                const count = notes.filter((n) => n.color === c.name).length
                if (count === 0) return null
                return (
                  <button
                    key={c.name}
                    className={`w-4 h-4 p-0 border-2 rounded-full cursor-pointer bg-transparent flex items-center justify-center hover:border-white/30 ${localFilter.color === c.name ? 'border-white' : 'border-transparent'}`}
                    onClick={() => toggleColorFilter(c.name)}
                    title={`${c.name} (${count})`}
                    style={{ '--swatch-color': c.hex } as React.CSSProperties}
                  >
                    <span className="block w-2.5 h-2.5 rounded-full bg-(--swatch-color)" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Notes list ── */}
          <div className="flex-1 [&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-track]:bg-transparent p-2 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar]:w-1.5 overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <div className="py-5 px-3 text-(--fd-text-muted) text-xs italic text-center leading-[1.5]">
                {notes.length === 0
                  ? 'No notes yet. Select text in the editor, right-click, and choose "Add Script Note".'
                  : 'No notes match this filter.'}
              </div>
            ) : (
              filteredNotes.map((note) => {
                const hex = getNoteColorHex(note.color)
                const sceneName = getSceneName(note.sceneId)
                const elemLabel =
                  ELEMENT_LABELS[note.elementType as ElementType] ||
                  note.elementType
                const isEditing = editingNoteId === note.id

                return (
                  <div
                    key={note.id}
                    className="note-item bg-(--fd-dropdown-bg) border border-(--fd-border) border-l-3 border-l-(--fd-accent) rounded-md p-2.5 mb-2 flex flex-col gap-1.5 transition-colors hover:border-[#555]"
                    style={{ borderLeftColor: hex }}
                  >
                    <div className="flex justify-between items-start gap-1.5">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] text-(--fd-accent) font-semibold uppercase tracking-[0.3px]">
                          {elemLabel}
                        </span>
                        {note.contextLabel && (
                          <span
                            className="max-w-42.5 overflow-hidden font-medium text-[#e89b4f] text-[10px] hover:underline text-ellipsis whitespace-nowrap cursor-pointer"
                            onClick={() =>
                              toggleContextFilter(note.contextLabel)
                            }
                            title={`Filter by "${note.contextLabel}"`}
                          >
                            {note.contextLabel}
                          </span>
                        )}
                        {sceneName && (
                          <span className="text-[10px] text-(--fd-text-muted) whitespace-nowrap overflow-hidden text-ellipsis max-w-42.5">
                            {sceneName}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-(--fd-text-muted) whitespace-nowrap shrink-0">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>

                    {note.anchorText && (
                      <div
                        className="text-[11px] text-(--fd-text-muted) italic py-1 px-2 bg-black/15 rounded-[3px] cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis transition-colors hover:text-(--fd-accent)"
                        onClick={() => handleNavigateToNote(note.id)}
                        title="Click to navigate to this text"
                      >
                        &ldquo;{note.anchorText}&rdquo;
                      </div>
                    )}

                    {/* Note content: edit mode or rendered preview */}
                    {isEditing ? (
                      <div className="relative">
                        <textarea
                          ref={(el) => {
                            if (el) textareaRefs.current.set(note.id, el)
                          }}
                          className="w-full bg-black/20 text-(--fd-text) border border-transparent rounded-[3px] py-1.5 px-2 text-xs font-sans leading-[1.4] resize-y outline-none placeholder:text-(--fd-text-muted) placeholder:text-[11px] focus:border-(--fd-accent) focus:bg-black/30"
                          value={note.content}
                          onChange={(e) =>
                            handleTextareaChange(note.id, e.target.value)
                          }
                          onKeyDown={(e) => handleTextareaKeyDown(e, note.id)}
                          onBlur={() => {
                            // Delay to allow suggestion click
                            setTimeout(() => {
                              setEditingNoteId(null)
                              setAssetQuery(null)
                              setAssetSuggestions([])
                            }, 200)
                          }}
                          placeholder="Write your note... (use @filename to reference assets, paste media URLs on their own line)"
                          rows={3}
                          autoFocus
                        />
                        {assetSuggestions.length > 0 && assetQuery !== null && (
                          <div className="absolute bottom-[calc(100%+2px)] left-0 right-0 max-h-50 overflow-y-auto bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-md shadow-[0_4px_12px_rgba(0,0,0,.4)] z-2600 py-1">
                            {assetSuggestions.map((a, idx) => (
                              <div
                                key={a.id}
                                className={`flex items-center gap-1.5 py-1.25 px-2.5 cursor-pointer text-xs ${idx === assetSugIdx ? 'bg-(--fd-accent) text-white' : 'text-(--fd-text)'}`}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  insertAssetRef(note.id, a)
                                }}
                              >
                                <span className="text-sm shrink-0">
                                  {a.mime_type.startsWith('image/')
                                    ? '🖼'
                                    : a.mime_type.startsWith('video/')
                                      ? '🎬'
                                      : '📎'}
                                </span>
                                <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                                  {a.original_name}
                                </span>
                                <span
                                  className={`text-[10px] shrink-0 ${idx === assetSugIdx ? 'text-white/60' : 'text-(--fd-text-muted)'}`}
                                >
                                  {a.tags.slice(0, 2).join(', ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="py-1 px-2 bg-black/12 border border-transparent rounded-[3px] cursor-pointer min-h-7 transition-colors hover:border-(--fd-border)"
                        onClick={() => setEditingNoteId(note.id)}
                        title="Click to edit"
                      >
                        {note.content ? (
                          <NoteContentDisplay
                            content={note.content}
                            assets={assets}
                            projectId={projectId}
                          />
                        ) : (
                          <span className="text-(--fd-text-muted) text-[11px] italic">
                            Click to add note...
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        {NOTE_COLORS.map((c) => (
                          <button
                            key={c.name}
                            className={`w-3.5 h-3.5 rounded-full border-2 cursor-pointer p-0 transition-[border-color,transform] duration-150 hover:scale-120 ${note.color === c.name ? 'border-white' : 'border-transparent'}`}
                            style={{ background: c.hex }}
                            onClick={() => handleColorChange(note.id, c.name)}
                            title={c.name}
                          />
                        ))}
                      </div>
                      <button
                        className="bg-none border-none text-(--fd-text-muted) text-[11px] cursor-pointer py-0.5 px-1.5 hover:text-[#ff6b6b]"
                        onClick={() => handleDeleteRequest(note.id)}
                        title="Delete note"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {pendingDeleteNoteId && (
            <div
              className="top-0 z-3000 fixed inset-x-0 max-[480px]:pt-[env(safe-area-inset-top,0px)] flex justify-center items-start bg-black/50 px-4 max-[480px]:px-0 pt-[5vh] pb-4 max-[480px]:pb-0 h-[var(--vv-height,100dvh)] overflow-y-auto dialog-overlay"
              onClick={() => setPendingDeleteNoteId(null)}
            >
              <div
                className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-80 max-w-100 max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col max-[768px]:min-w-0 max-[768px]:max-w-none max-[768px]:w-[calc(100vw-32px-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] max-[480px]:w-screen! max-[480px]:max-w-screen! max-[480px]:rounded-t-none max-[480px]:rounded-b-xl max-[480px]:max-h-[60vh] max-[480px]:overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0 text-(--fd-text)">
                  Delete Note
                </div>
                <div className="flex-auto p-5 overflow-y-auto">
                  <p style={{ margin: 0 }}>
                    Delete this note? The highlight will also be removed from
                    the script.
                  </p>
                </div>
                <div className="flex justify-end gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0 [&_button]:h-8.5 [&_button]:px-4.5 [&_button]:bg-(--fd-toolbar-bg) [&_button]:text-(--fd-text) [&_button]:border [&_button]:border-(--fd-border) [&_button]:rounded [&_button]:cursor-pointer [&_button]:text-sm [&_button]:hover:bg-(--fd-menu-hover) max-[768px]:[&_button]:h-10">
                  <button onClick={() => setPendingDeleteNoteId(null)}>
                    Cancel
                  </button>
                  <button
                    className="bg-(--fd-accent)! border-(--fd-accent)! text-white! hover:opacity-90"
                    style={{ background: '#c0392b' }}
                    onClick={handleDeleteConfirm}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── General Notes tab ── */}
      {activeTab === 'general' && (
        <>
          <div className="flex items-center py-2 px-3 border-b border-(--fd-border) shrink-0">
            <button
              className="bg-transparent border border-(--fd-border) rounded text-(--fd-text-muted) text-xs py-1 px-3 cursor-pointer transition-colors hover:border-(--fd-accent) hover:text-(--fd-accent)"
              onClick={handleAddGeneralNote}
            >
              + Add Note
            </button>
          </div>
          <div className="flex-1 [&::-webkit-scrollbar-thumb]:bg-[#444] [&::-webkit-scrollbar-track]:bg-transparent p-2 [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar]:w-1.5 overflow-y-auto">
            {generalNotes.length === 0 ? (
              <div className="py-5 px-3 text-(--fd-text-muted) text-xs italic text-center leading-[1.5]">
                No general notes yet. Click &ldquo;+ Add Note&rdquo; to create
                one.
              </div>
            ) : (
              generalNotes.map((gn) => {
                const hex = getNoteColorHex(gn.color)
                const isEditing = editingGeneralNoteId === gn.id
                return (
                  <div
                    key={gn.id}
                    className="note-item bg-(--fd-dropdown-bg) border border-(--fd-border) border-l-3 border-l-(--fd-accent) rounded-md p-2.5 mb-2 flex flex-col gap-1.5 transition-colors hover:border-[#555]"
                    style={{ borderLeftColor: hex }}
                  >
                    <div className="flex justify-between items-start gap-1.5">
                      <span className="text-[10px] text-(--fd-text-muted) whitespace-nowrap shrink-0">
                        {formatDate(gn.createdAt)}
                      </span>
                    </div>
                    {isEditing ? (
                      <>
                        <input
                          className="w-full bg-transparent border-none border-b border-(--fd-border) text-(--fd-text) font-semibold text-[13px] outline-none py-1 mb-1.5 focus:border-b-(--fd-accent) placeholder:text-(--fd-text-muted)"
                          value={gn.title}
                          onChange={(e) =>
                            updateGeneralNote(gn.id, { title: e.target.value })
                          }
                          placeholder="Note title..."
                          autoFocus
                        />
                        <textarea
                          className="w-full bg-black/20 text-(--fd-text) border border-transparent rounded-[3px] py-1.5 px-2 text-xs font-sans leading-[1.4] resize-y outline-none placeholder:text-(--fd-text-muted) placeholder:text-[11px] focus:border-(--fd-accent) focus:bg-black/30"
                          value={gn.content}
                          onChange={(e) =>
                            updateGeneralNote(gn.id, {
                              content: e.target.value,
                            })
                          }
                          onBlur={() =>
                            setTimeout(() => setEditingGeneralNoteId(null), 200)
                          }
                          placeholder="Write your note..."
                          rows={4}
                        />
                      </>
                    ) : (
                      <div
                        className="py-1 px-2 bg-black/12 border border-transparent rounded-[3px] cursor-pointer min-h-7 transition-colors hover:border-(--fd-border)"
                        onClick={() => setEditingGeneralNoteId(gn.id)}
                        title="Click to edit"
                      >
                        {gn.title && (
                          <div className="font-semibold text-[13px] text-(--fd-text) mb-1">
                            {gn.title}
                          </div>
                        )}
                        {gn.content ? (
                          <NoteContentDisplay
                            content={gn.content}
                            assets={assets}
                            projectId={projectId}
                          />
                        ) : (
                          <span className="text-(--fd-text-muted) text-[11px] italic">
                            {gn.title ? '' : 'Click to add note...'}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div className="flex gap-1">
                        {NOTE_COLORS.map((c) => (
                          <button
                            key={c.name}
                            className={`w-3.5 h-3.5 rounded-full border-2 cursor-pointer p-0 transition-[border-color,transform] duration-150 hover:scale-120 ${gn.color === c.name ? 'border-white' : 'border-transparent'}`}
                            style={{ background: c.hex }}
                            onClick={() =>
                              updateGeneralNote(gn.id, { color: c.name })
                            }
                            title={c.name}
                          />
                        ))}
                      </div>
                      <button
                        className="bg-none border-none text-(--fd-text-muted) text-[11px] cursor-pointer py-0.5 px-1.5 hover:text-[#ff6b6b]"
                        onClick={() => setPendingDeleteGeneralNoteId(gn.id)}
                        title="Delete note"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {pendingDeleteGeneralNoteId && (
            <div
              className="top-0 z-3000 fixed inset-x-0 max-[480px]:pt-[env(safe-area-inset-top,0px)] flex justify-center items-start bg-black/50 px-4 max-[480px]:px-0 pt-[5vh] pb-4 max-[480px]:pb-0 h-[var(--vv-height,100dvh)] overflow-y-auto dialog-overlay"
              onClick={() => setPendingDeleteGeneralNoteId(null)}
            >
              <div
                className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-80 max-w-100 max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col max-[768px]:min-w-0 max-[768px]:max-w-none max-[768px]:w-[calc(100vw-32px-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] max-[480px]:w-screen! max-[480px]:max-w-screen! max-[480px]:rounded-t-none max-[480px]:rounded-b-xl max-[480px]:max-h-[60vh] max-[480px]:overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0 text-(--fd-text)">
                  Delete Note
                </div>
                <div className="flex-auto p-5 overflow-y-auto">
                  <p style={{ margin: 0 }}>Delete this general note?</p>
                </div>
                <div className="flex justify-end gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0 [&_button]:h-8.5 [&_button]:px-4.5 [&_button]:bg-(--fd-toolbar-bg) [&_button]:text-(--fd-text) [&_button]:border [&_button]:border-(--fd-border) [&_button]:rounded [&_button]:cursor-pointer [&_button]:text-sm [&_button]:hover:bg-(--fd-menu-hover) max-[768px]:[&_button]:h-10">
                  <button onClick={() => setPendingDeleteGeneralNoteId(null)}>
                    Cancel
                  </button>
                  <button
                    className="bg-(--fd-accent)! border-(--fd-accent)! text-white! hover:opacity-90"
                    style={{ background: '#c0392b' }}
                    onClick={handleDeleteGeneralNoteConfirm}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ScriptNotes
