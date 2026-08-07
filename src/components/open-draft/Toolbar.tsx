import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Editor } from '@tiptap/react'
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaSubscript,
  FaSuperscript,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaUndo,
  FaRedo,
  FaSearchPlus,
  FaSearchMinus,
  FaSearch,
  FaStickyNote,
  FaTags,
  FaPaintBrush,
  FaHighlighter,
  FaEllipsisV,
  FaHashtag,
} from 'react-icons/fa'
import { useEditorStore, NOTE_COLORS } from '@/stores/editorStore'
import type { ElementType } from '@/stores/editorStore'
import { singleLine } from '@/utils/open-draft/nodeText'
import { useFormattingTemplateStore } from '@/stores/formattingTemplateStore'
import { BUILT_IN_ELEMENT_IDS } from '@/stores/formattingTypes'
import {
  getCurrentElementRule,
  getLockedFormatting,
  toggleBoldOverride,
  toggleItalicOverride,
  toggleUnderlineOverride,
} from '@/utils/open-draft/effectiveFormatting'
import type { LockedFormatting } from '@/utils/open-draft/effectiveFormatting'
import FontPicker from './FontPicker'
import ColorPicker from './ColorPicker'
import LanguageSelector from './LanguageSelector'
import { FONT_REGISTRY, loadFont } from '@/utils/open-draft/fonts'

interface ToolbarProps {
  editor: Editor | null
}

const FONT_SIZES = [
  8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96,
]

// Priority groups — higher number = hidden first when toolbar shrinks.
// Priority 1 = zoom-out (just the minus button area)
// Priority 2 = zoom/goto/search
// Priority 3 = alignment buttons
// Priority 4 = font style & colors (bold/italic/underline/strike/sub/super + colors + language)
// Priority 5 = font face & size
const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  const {
    activeElement,
    setActiveElement,
    zoomLevel,
    setZoomLevel,
    zoomPanelOpen,
    setZoomPanelOpen,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    setSearchOpen,
    setGoToPageOpen,
    scriptNotesOpen,
    toggleScriptNotes,
    addNote,
    setNoteFilter,
    tagsPanelOpen,
    toggleTagsPanel,
    setPendingTagSelection,
    setEditingTagId,
    toolbarMode,
  } = useEditorStore()

  const activeTemplate = useFormattingTemplateStore((s) =>
    s.getActiveTemplate(),
  )
  const isEnforceMode = activeTemplate.mode === 'enforce'
  const isOverrideMode = activeTemplate.mode === 'override'

  // Per-attribute locking state — updates reactively when cursor moves between elements
  const [locked, setLocked] = useState<LockedFormatting>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    textAlign: false,
    textColor: false,
    backgroundColor: false,
    textTransform: false,
    fontFamily: false,
    fontSize: false,
    subscript: false,
    superscript: false,
  })

  // Color picker state
  const [textColorOpen, setTextColorOpen] = useState(false)
  const [bgColorOpen, setBgColorOpen] = useState(false)
  const [currentTextColor, setCurrentTextColor] = useState<string>('#000000')
  const [currentBgColor, setCurrentBgColor] = useState<string>('#ffff00')

  // Track the font/size of the text at current cursor position. Empty string
  // / null indicates the selection spans more than one value ("mixed").
  const [cursorFont, setCursorFont] = useState<string>(fontFamily)
  const [cursorSize, setCursorSize] = useState<number | null>(fontSize)
  // Fonts found in document that aren't in the registry
  const [extraFonts, setExtraFonts] = useState<string[]>([])

  const detectFormatting = useCallback(() => {
    if (!editor) return

    // Update locked formatting for current element
    const rule = getCurrentElementRule(editor, activeTemplate)
    setLocked(getLockedFormatting(rule, isEnforceMode))

    const { from, to, empty } = editor.state.selection

    // For an empty cursor, fall back to the textStyle mark at that position.
    if (empty) {
      const attrs = editor.getAttributes('textStyle')
      const detectedFont = (attrs.fontFamily as string | undefined) || ''
      const detectedSize = (attrs.fontSize as string | undefined) || ''
      const effectiveFont = detectedFont || rule?.fontFamily || fontFamily
      setCursorFont(effectiveFont)
      if (
        effectiveFont &&
        !FONT_REGISTRY.find((f) => f.name === effectiveFont)
      ) {
        setExtraFonts((prev) =>
          prev.includes(effectiveFont) ? prev : [...prev, effectiveFont],
        )
      }
      if (detectedSize) {
        const parsed = parseInt(detectedSize, 10)
        setCursorSize(!isNaN(parsed) ? parsed : (rule?.fontSize ?? fontSize))
      } else {
        setCursorSize(rule?.fontSize ?? fontSize)
      }
      return
    }

    // For a real selection, walk the text nodes within [from, to]. If every
    // text node carries the same fontFamily / fontSize, show that value;
    // otherwise show the picker as blank to indicate "mixed".
    const fonts = new Set<string>()
    const sizes = new Set<string>()
    let sawText = false
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText || !node.text) return
      const start = Math.max(pos, from)
      const end = Math.min(pos + node.nodeSize, to)
      if (end <= start) return
      sawText = true
      const ts = node.marks.find((m) => m.type.name === 'textStyle')
      const ff = (ts?.attrs.fontFamily as string | undefined) || ''
      const fs = (ts?.attrs.fontSize as string | undefined) || ''
      fonts.add(ff)
      sizes.add(fs)
    })

    if (!sawText) {
      // Selection contains only block boundaries / no text — fall back to cursor attrs.
      const attrs = editor.getAttributes('textStyle')
      const detectedFont = (attrs.fontFamily as string | undefined) || ''
      const detectedSize = (attrs.fontSize as string | undefined) || ''
      const effectiveFont = detectedFont || rule?.fontFamily || fontFamily
      setCursorFont(effectiveFont)
      if (detectedSize) {
        const parsed = parseInt(detectedSize, 10)
        setCursorSize(!isNaN(parsed) ? parsed : (rule?.fontSize ?? fontSize))
      } else {
        setCursorSize(rule?.fontSize ?? fontSize)
      }
      return
    }

    if (fonts.size > 1) {
      setCursorFont('')
    } else {
      const single = [...fonts][0] || ''
      const effective = single || rule?.fontFamily || fontFamily
      setCursorFont(effective)
      if (effective && !FONT_REGISTRY.find((f) => f.name === effective)) {
        setExtraFonts((prev) =>
          prev.includes(effective) ? prev : [...prev, effective],
        )
      }
    }

    if (sizes.size > 1) {
      setCursorSize(null)
    } else {
      const single = [...sizes][0] || ''
      if (single) {
        const parsed = parseInt(single, 10)
        setCursorSize(!isNaN(parsed) ? parsed : (rule?.fontSize ?? fontSize))
      } else {
        setCursorSize(rule?.fontSize ?? fontSize)
      }
    }
  }, [editor, fontFamily, fontSize, activeTemplate, isEnforceMode])

  useEffect(() => {
    if (!editor) return
    editor.on('selectionUpdate', detectFormatting)
    editor.on('transaction', detectFormatting)
    // Run once on mount / editor ready
    detectFormatting()
    return () => {
      editor.off('selectionUpdate', detectFormatting)
      editor.off('transaction', detectFormatting)
    }
  }, [editor, detectFormatting])

  // Collect all unique fonts used in the document (for extra fonts display)
  useEffect(() => {
    if (!editor) return
    const collectFonts = () => {
      const found = new Set<string>()
      editor.state.doc.descendants((node) => {
        if (node.isText && node.marks) {
          for (const mark of node.marks) {
            if (mark.type.name === 'textStyle' && mark.attrs.fontFamily) {
              const f = mark.attrs.fontFamily as string
              if (!FONT_REGISTRY.find((r) => r.name === f)) {
                found.add(f)
              }
            }
          }
        }
      })
      if (found.size > 0) {
        setExtraFonts((prev) => {
          const merged = new Set([...prev, ...found])
          return merged.size !== prev.length ? [...merged] : prev
        })
      }
    }
    collectFonts()
    editor.on('update', collectFonts)
    return () => {
      editor.off('update', collectFonts)
    }
  }, [editor])

  const handleElementChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value
    if (!editor) return
    setActiveElement(type as ElementType)
    // Three cases:
    //   1. Built-in screenplay element (sceneHeading, action, etc.) — direct setNode
    //   2. Real schema node not in BUILT_IN list (avPara, avShot, avDirection) — also direct setNode
    //   3. Template-declared custom id (sceneCharacters, soundEffect, etc.) — wrap as customElement
    if (BUILT_IN_ELEMENT_IDS.includes(type)) {
      editor.chain().focus().setNode(type).run()
      return
    }
    if (editor.schema.nodes[type]) {
      editor.chain().focus().setNode(type).run()
      return
    }
    const rule = activeTemplate.rules[type]
    if (rule) {
      editor
        .chain()
        .focus()
        .setNode('customElement', {
          customTypeId: type,
          customLabel: rule.label,
        })
        .run()
    }
  }

  /** True when the selection is inside an AV cell — used to scope the element dropdown. */
  const isInsideAvCell = React.useMemo(() => {
    if (!editor) return false
    try {
      const { $from } = editor.state.selection
      for (let d = $from.depth; d >= 0; d--) {
        if ($from.node(d).type.name === 'avCell') return true
      }
    } catch {
      /* ignore */
    }
    return false
    // Re-evaluate on selection updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, activeElement])

  /** Element ids valid inside an AV cell (per the avCell schema content rule). */
  const AV_CELL_ELEMENT_IDS = ['avPara', 'avShot', 'avDirection']

  const isActive = (format: string) => {
    if (!editor) return false
    return editor.isActive(format)
  }

  // Editable zoom input
  const [zoomInput, setZoomInput] = useState(String(zoomLevel))
  const [zoomEditing, setZoomEditing] = useState(false)
  const zoomInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!zoomEditing) setZoomInput(String(zoomLevel))
  }, [zoomLevel, zoomEditing])
  const commitZoom = () => {
    const val = parseInt(zoomInput, 10)
    if (!isNaN(val) && val >= 50 && val <= 300) setZoomLevel(val)
    else setZoomInput(String(zoomLevel))
    setZoomEditing(false)
  }

  // ── Responsive overflow ──────────────────────────────────────────────
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [hiddenPriorities, setHiddenPriorities] = useState<Set<string>>(
    new Set(),
  )
  const [overflowOpen, setOverflowOpen] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)

  // Close overflow menu on outside click
  useEffect(() => {
    if (!overflowOpen) return
    const handler = (e: MouseEvent) => {
      if (
        overflowRef.current &&
        !overflowRef.current.contains(e.target as Node)
      ) {
        setOverflowOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [overflowOpen])

  // Hide order: "1" first, then "2" (matches "2" and "2b"), "3", "4", "5" last
  const HIDE_ORDER = ['1', '2', '3', '4', '5']

  // Measure toolbar overflow and determine which priority groups to hide
  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar) return

    const measure = () => {
      const containerWidth = toolbar.clientWidth
      const groups = toolbar.querySelectorAll<HTMLElement>('[data-priority]')
      if (groups.length === 0) return

      // Show all groups to measure natural widths
      groups.forEach((g) => (g.style.display = ''))

      const OVERFLOW_BTN_WIDTH = 36
      const allItems: { el: HTMLElement; key: string }[] = []
      const newHidden = new Set<string>()

      let totalWidth = 0
      for (const child of toolbar.children) {
        const el = child as HTMLElement
        const w = el.offsetWidth
        if (el.dataset.priority) {
          // CSS-hidden items (e.g. toolbar-desktop-only on mobile) have 0 width —
          // mark them as hidden so they appear in the overflow menu.
          if (w === 0) {
            newHidden.add(el.dataset.priority)
          } else {
            allItems.push({ el, key: el.dataset.priority })
          }
        }
        totalWidth += w + 2
      }

      if (totalWidth > containerWidth) {
        let currentTotal = totalWidth + OVERFLOW_BTN_WIDTH

        for (const prefix of HIDE_ORDER) {
          if (currentTotal <= containerWidth) break
          const matching = allItems.filter((p) => p.key.startsWith(prefix))
          for (const { el, key } of matching) {
            newHidden.add(key)
            currentTotal -= el.offsetWidth + 2
            el.style.display = 'none'
          }
        }
      }

      setHiddenPriorities((prev) => {
        if (prev.size !== newHidden.size) return newHidden
        for (const p of newHidden) {
          if (!prev.has(p)) return newHidden
        }
        return prev
      })
    }

    let rafId = 0
    let lastWidth = 0
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const w = Math.round(entry.contentRect.width)
      // Only re-measure if container width actually changed (not just internal reflow)
      if (w === lastWidth) return
      lastWidth = w
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(measure)
    })
    ro.observe(toolbar)
    requestAnimationFrame(measure)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [])

  const hasOverflow = hiddenPriorities.size > 0

  // ── Notes handler (shared between inline and overflow) ──
  const handleNotesClick = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      e.preventDefault()
      if (!editor) {
        toggleScriptNotes()
        return
      }

      // Detect if cursor is on an existing note
      const noteMarkType = editor.schema.marks.scriptNote
      if (noteMarkType) {
        const $from = editor.state.selection.$from
        let noteMark = $from.marks().find((m) => m.type === noteMarkType)
        if (!noteMark) {
          const node = $from.nodeAfter || $from.nodeBefore
          if (node?.marks)
            noteMark = node.marks.find((m) => m.type === noteMarkType)
        }
        if (noteMark) {
          setNoteFilter({
            elementType: null,
            contextLabel: null,
            color: null,
            noteId: noteMark.attrs.noteId as string,
          })
          if (!scriptNotesOpen) toggleScriptNotes()
          return
        }
      }

      const { from, to, empty } = editor.state.selection
      const $from = editor.state.selection.$from
      const selFrom = empty ? $from.start() : from
      const selTo = empty ? $from.end() : to
      const text = editor.state.doc.textBetween(selFrom, selTo, ' ')

      if (text.trim()) {
        const currentNodeType = $from.parent.type.name
        const nodeText = singleLine($from.parent.textContent)
        let contextLabel = nodeText.slice(0, 60)
        if (currentNodeType === 'character') {
          contextLabel = nodeText.replace(/\s*\([^)]*\)\s*/g, '').trim()
        } else if (currentNodeType === 'sceneHeading') {
          contextLabel = nodeText
        } else if (
          currentNodeType === 'dialogue' ||
          currentNodeType === 'parenthetical'
        ) {
          let charName = ''
          editor.state.doc.nodesBetween(0, selFrom, (node) => {
            if (node.type.name === 'character') {
              charName = singleLine(node.textContent)
                .replace(/\s*\([^)]*\)\s*/g, '')
                .trim()
            }
            return true
          })
          if (charName) contextLabel = charName
        }

        let sceneId: string | null = null
        let sceneIdx = 0
        editor.state.doc.nodesBetween(0, selFrom, (node) => {
          if (node.type.name === 'sceneHeading') {
            sceneId = `scene-${sceneIdx}`
            sceneIdx++
          }
          return true
        })

        const defaultColor = NOTE_COLORS[0]
        const noteId = addNote({
          content: '',
          anchorText: text.slice(0, 120),
          elementType: currentNodeType,
          contextLabel,
          color: defaultColor.name,
          sceneId,
        })

        const { tr } = editor.state
        const markType = editor.schema.marks.scriptNote
        if (markType) {
          tr.addMark(
            selFrom,
            selTo,
            markType.create({ noteId, color: defaultColor.hex }),
          )
          editor.view.dispatch(tr)
          editor.emit('update', { editor, transaction: tr })
        }

        setNoteFilter({
          elementType: null,
          contextLabel: null,
          color: null,
          noteId,
        })
        if (!scriptNotesOpen) toggleScriptNotes()
      } else {
        toggleScriptNotes()
      }
    },
    [editor, scriptNotesOpen, toggleScriptNotes, addNote, setNoteFilter],
  )

  // ── Tags handler (shared between inline and overflow) ──
  const handleTagsClick = useCallback(
    (e: React.PointerEvent | React.MouseEvent) => {
      e.preventDefault()
      if (!editor) {
        toggleTagsPanel()
        return
      }

      const markType = editor.schema.marks.productionTag
      if (markType) {
        const $from = editor.state.selection.$from
        const storedMarks = $from.marks()
        let tagMark = storedMarks.find((m) => m.type === markType)
        if (!tagMark) {
          const node = $from.nodeAfter || $from.nodeBefore
          if (node?.marks) tagMark = node.marks.find((m) => m.type === markType)
        }

        if (tagMark) {
          setEditingTagId(tagMark.attrs.tagId as string)
          if (!tagsPanelOpen) toggleTagsPanel()
          return
        }
      }

      const { from, to, empty } = editor.state.selection
      const $from = editor.state.selection.$from
      const selFrom = empty ? $from.start() : from
      const selTo = empty ? $from.end() : to
      const text = editor.state.doc.textBetween(selFrom, selTo, ' ')

      if (text.trim()) {
        const currentNodeType = $from.parent.type.name
        let sceneId: string | null = null
        let sceneIdx = 0
        editor.state.doc.nodesBetween(0, selFrom, (node) => {
          if (node.type.name === 'sceneHeading') {
            sceneId = `scene-${sceneIdx}`
            sceneIdx++
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
      } else {
        toggleTagsPanel()
      }
    },
    [
      editor,
      tagsPanelOpen,
      toggleTagsPanel,
      setPendingTagSelection,
      setEditingTagId,
    ],
  )

  // ── Shared renderers for toolbar groups (used both inline and in overflow) ──

  const renderFontFaceSize = useCallback(
    (inOverflow = false) => (
      <React.Fragment key="font-face-size">
        <div
          className="toolbar-group flex items-center gap-px"
          style={
            locked.fontFamily
              ? { opacity: 0.5, pointerEvents: 'none' }
              : undefined
          }
        >
          <FontPicker
            value={cursorFont}
            extraFonts={extraFonts}
            onChange={(val) => {
              if (locked.fontFamily) return
              setFontFamily(val)
              const entry = FONT_REGISTRY.find((f) => f.name === val)
              if (entry) loadFont(entry)
              const DEFAULT_FONTS = [
                'Courier Final Draft',
                'Courier Prime',
                'Courier New',
                'Courier',
              ]
              if (DEFAULT_FONTS.includes(val)) {
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .setMark('textStyle', { fontFamily: null })
                  .removeEmptyTextStyle()
                  .run()
              } else {
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .setMark('textStyle', { fontFamily: val })
                  .run()
              }
              if (inOverflow) setOverflowOpen(false)
            }}
          />
        </div>
        <div className="toolbar-group flex items-center gap-px">
          <select
            className="font-size-selector h-5.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-overlay-medium) rounded-[5px] px-2 text-[11.5px] cursor-pointer outline-none min-w-15 focus:border-(--fd-accent)"
            value={cursorSize ?? ''}
            disabled={locked.fontSize}
            onChange={(e) => {
              if (locked.fontSize) return
              if (e.target.value === '') return // user clicked the mixed placeholder — no-op
              const val = Number(e.target.value)
              setFontSize(val)
              if (val === 12) {
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .setMark('textStyle', { fontSize: null })
                  .removeEmptyTextStyle()
                  .run()
              } else {
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .setFontSize(`${val}pt`)
                  .run()
              }
              if (inOverflow) setOverflowOpen(false)
            }}
            title="Font Size"
          >
            {/* Mixed-selection placeholder. */}
            {cursorSize === null && (
              <option value="" disabled hidden>
                —
              </option>
            )}
            {(cursorSize !== null && !FONT_SIZES.includes(cursorSize)
              ? [...FONT_SIZES, cursorSize].sort((a, b) => a - b)
              : FONT_SIZES
            ).map((s) => (
              <option key={s} value={s}>
                {s}pt
              </option>
            ))}
          </select>
        </div>
      </React.Fragment>
    ),
    [
      cursorFont,
      cursorSize,
      extraFonts,
      editor,
      setFontFamily,
      setFontSize,
      locked,
    ],
  )

  // showPopups: when false, only render buttons (no ColorPicker popups).
  // This prevents the hidden inline copy from stealing popup state from the overflow copy.
  const renderFontStyleColors = useCallback(
    (inOverflow = false, showPopups = true) => (
      <React.Fragment key="font-style-colors">
        <div className="toolbar-group flex items-center gap-px">
          <button
            className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default ${isActive('bold') ? 'active bg-(--fd-overlay-medium) border-transparent' : ''}`}
            title="Bold (⌘B)"
            disabled={locked.bold}
            onClick={() => {
              if (!editor || locked.bold) return
              if (isOverrideMode) {
                toggleBoldOverride(
                  editor,
                  getCurrentElementRule(editor, activeTemplate),
                )
              } else {
                editor
                  .chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleBold()
                  .run()
              }
            }}
          >
            <FaBold />
          </button>
          <button
            className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default ${isActive('italic') ? 'active bg-(--fd-overlay-medium) border-transparent' : ''}`}
            title="Italic (⌘I)"
            disabled={locked.italic}
            onClick={() => {
              if (!editor || locked.italic) return
              if (isOverrideMode) {
                toggleItalicOverride(
                  editor,
                  getCurrentElementRule(editor, activeTemplate),
                )
              } else {
                editor
                  .chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleItalic()
                  .run()
              }
            }}
          >
            <FaItalic />
          </button>
          <button
            className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default ${isActive('underline') ? 'active bg-(--fd-overlay-medium) border-transparent' : ''}`}
            title="Underline (⌘U)"
            disabled={locked.underline}
            onClick={() => {
              if (!editor || locked.underline) return
              if (isOverrideMode) {
                toggleUnderlineOverride(
                  editor,
                  getCurrentElementRule(editor, activeTemplate),
                )
              } else {
                editor
                  .chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleUnderline()
                  .run()
              }
            }}
          >
            <FaUnderline />
          </button>
          <button
            className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default ${isActive('strike') ? 'active bg-(--fd-overlay-medium) border-transparent' : ''}`}
            title="Strikethrough"
            disabled={locked.strikethrough}
            onClick={() => {
              if (!locked.strikethrough)
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleStrike()
                  .run()
            }}
          >
            <FaStrikethrough />
          </button>
          <button
            className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default ${isActive('subscript') ? 'active bg-(--fd-overlay-medium) border-transparent' : ''}`}
            title="Subscript"
            disabled={locked.subscript}
            onClick={() => {
              if (!locked.subscript)
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleSubscript()
                  .run()
            }}
          >
            <FaSubscript />
          </button>
          <button
            className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default ${isActive('superscript') ? 'active bg-(--fd-overlay-medium) border-transparent' : ''}`}
            title="Superscript"
            disabled={locked.superscript}
            onClick={() => {
              if (!locked.superscript)
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleSuperscript()
                  .run()
            }}
          >
            <FaSuperscript />
          </button>
        </div>

        <div
          className={
            inOverflow
              ? 'toolbar-overflow-sep w-full h-px bg-(--fd-border) my-0.5'
              : `toolbar-separator w-px h-4 bg-(--fd-border) opacity-50 mx-[5px]`
          }
        />

        <div
          className="toolbar-group flex items-center gap-px"
          style={{ position: 'relative' }}
        >
          <button
            className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
            title="Text Color"
            disabled={locked.textColor}
            onClick={() => {
              if (!locked.textColor) {
                setTextColorOpen(!textColorOpen)
                setBgColorOpen(false)
              }
            }}
          >
            <FaPaintBrush style={{ color: currentTextColor }} />
          </button>
          {showPopups && textColorOpen && (
            <ColorPicker
              value={currentTextColor}
              onChange={(color) => {
                setCurrentTextColor(color || '#000000')
                if (color) {
                  editor
                    ?.chain()
                    .focus(undefined, { scrollIntoView: false })
                    .setColor(color)
                    .run()
                } else {
                  editor
                    ?.chain()
                    .focus(undefined, { scrollIntoView: false })
                    .unsetColor()
                    .run()
                }
                setTextColorOpen(false)
              }}
              onClose={() => setTextColorOpen(false)}
            />
          )}

          <button
            className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
            title="Highlight Color"
            disabled={locked.backgroundColor}
            onClick={() => {
              if (!locked.backgroundColor) {
                setBgColorOpen(!bgColorOpen)
                setTextColorOpen(false)
              }
            }}
          >
            <FaHighlighter style={{ color: currentBgColor }} />
          </button>
          {showPopups && bgColorOpen && (
            <ColorPicker
              value={currentBgColor}
              onChange={(color) => {
                setCurrentBgColor(color || '#ffff00')
                if (color) {
                  editor
                    ?.chain()
                    .focus(undefined, { scrollIntoView: false })
                    .toggleHighlight({ color })
                    .run()
                } else {
                  editor
                    ?.chain()
                    .focus(undefined, { scrollIntoView: false })
                    .unsetHighlight()
                    .run()
                }
                setBgColorOpen(false)
              }}
              onClose={() => setBgColorOpen(false)}
            />
          )}
        </div>

        <div
          className={
            inOverflow
              ? 'toolbar-overflow-sep w-full h-px bg-(--fd-border) my-0.5'
              : `toolbar-separator w-px h-4 bg-(--fd-border) opacity-50 mx-[5px]`
          }
        />

        <LanguageSelector editor={editor} activeElement={activeElement} />
      </React.Fragment>
    ),
    [
      editor,
      isOverrideMode,
      activeTemplate,
      activeElement,
      textColorOpen,
      bgColorOpen,
      currentTextColor,
      currentBgColor,
      locked,
    ],
  )

  const renderAlignment = useCallback(
    (_inOverflow = false) => (
      <div className="toolbar-group flex items-center gap-px" key="alignment">
        <button
          className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default ${editor?.isActive({ textAlign: 'left' }) ? 'active bg-(--fd-overlay-medium) border-transparent' : ''}`}
          title="Align Left"
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          disabled={locked.textAlign}
        >
          <FaAlignLeft />
        </button>
        <button
          className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default ${editor?.isActive({ textAlign: 'center' }) ? 'active bg-(--fd-overlay-medium) border-transparent' : ''}`}
          title="Align Center"
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          disabled={locked.textAlign}
        >
          <FaAlignCenter />
        </button>
        <button
          className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default ${editor?.isActive({ textAlign: 'right' }) ? 'active bg-(--fd-overlay-medium) border-transparent' : ''}`}
          title="Align Right"
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          disabled={locked.textAlign}
        >
          <FaAlignRight />
        </button>
        <button
          className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default ${editor?.isActive({ textAlign: 'justify' }) ? 'active bg-(--fd-overlay-medium) border-transparent' : ''}`}
          title="Justify"
          onClick={() => editor?.chain().focus().setTextAlign('justify').run()}
          disabled={locked.textAlign}
        >
          <FaAlignJustify />
        </button>
      </div>
    ),
    [editor, locked],
  )

  const renderSearchGoto = useCallback(
    (inOverflow = false) => (
      <div className="toolbar-group flex items-center gap-px" key="search-goto">
        <button
          className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
          title="Find & Replace (⌘F)"
          onClick={() => {
            setSearchOpen(true)
            if (inOverflow) setOverflowOpen(false)
          }}
        >
          <FaSearch />
        </button>
        <button
          className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
          title="Go to Page (⌘G)"
          onClick={() => {
            setGoToPageOpen(true)
            if (inOverflow) setOverflowOpen(false)
          }}
        >
          <FaHashtag />
        </button>
      </div>
    ),
    [setSearchOpen, setGoToPageOpen],
  )

  const renderZoom = useCallback(
    (_inOverflow = false) => (
      <div
        className="toolbar-group zoom-group flex items-center gap-1"
        key="zoom"
      >
        <button
          className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
          title="Zoom Out"
          onClick={() => setZoomLevel(zoomLevel - 10)}
          disabled={zoomLevel <= 50}
        >
          <FaSearchMinus />
        </button>
        {zoomEditing ? (
          <input
            ref={zoomInputRef}
            className="zoom-input w-10 bg-(--fd-input-bg) border border-(--fd-accent) rounded-[3px] text-(--fd-text) text-[11px] text-center outline-none py-px px-0.5 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0"
            type="number"
            min={50}
            max={200}
            step={10}
            value={zoomInput}
            onChange={(e) => setZoomInput(e.target.value)}
            onBlur={commitZoom}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitZoom()
              if (e.key === 'Escape') {
                setZoomInput(String(zoomLevel))
                setZoomEditing(false)
              }
            }}
            autoFocus
          />
        ) : (
          <span
            className="zoom-label text-(--fd-text-muted) text-[11px] min-w-9 text-center tabular-nums cursor-pointer"
            onClick={() => {
              setZoomEditing(true)
              setTimeout(() => zoomInputRef.current?.select(), 0)
            }}
            title="Click to edit zoom"
          >
            {zoomLevel}%
          </span>
        )}
        <button
          className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
          title="Zoom In"
          onClick={() => setZoomLevel(zoomLevel + 10)}
          disabled={zoomLevel >= 300}
        >
          <FaSearchPlus />
        </button>
      </div>
    ),
    [zoomLevel, zoomEditing, zoomInput, setZoomLevel, commitZoom],
  )

  const renderZoomMin = useCallback(
    (_inOverflow = false) => (
      <div
        className="toolbar-group zoom-group flex items-center gap-1"
        key="zoom-min"
      >
        <button
          className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
          title="Zoom Out"
          onClick={() => setZoomLevel(zoomLevel - 10)}
          disabled={zoomLevel <= 50}
        >
          <FaSearchMinus />
        </button>
      </div>
    ),
    [zoomLevel, setZoomLevel],
  )

  // Check if a given prefix has any hidden items
  const isHidden = useCallback(
    (prefix: string) => {
      for (const k of hiddenPriorities) {
        if (k.startsWith(prefix)) return true
      }
      return false
    },
    [hiddenPriorities],
  )

  // Build overflow menu content from hidden priorities
  const overflowContent = useMemo(() => {
    if (hiddenPriorities.size === 0) return null
    const items: React.ReactNode[] = []
    const addSep = () => {
      if (items.length > 0)
        items.push(
          <div
            className="toolbar-overflow-sep w-full h-px bg-(--fd-border) my-0.5"
            key={`sep-${items.length}`}
          />,
        )
    }

    // Show items in logical order (most important first within overflow)
    if (isHidden('5')) {
      addSep()
      items.push(renderFontFaceSize(true))
    }
    if (isHidden('4')) {
      addSep()
      items.push(renderFontStyleColors(true))
    }
    if (isHidden('3')) {
      addSep()
      items.push(renderAlignment(true))
    }
    if (isHidden('2')) {
      addSep()
      items.push(renderSearchGoto(true))
      items.push(renderZoom(true))
    }
    if (isHidden('1') && !isHidden('2')) {
      addSep()
      items.push(renderZoomMin(true))
    }

    return items
  }, [
    hiddenPriorities,
    isHidden,
    renderZoomMin,
    renderZoom,
    renderSearchGoto,
    renderAlignment,
    renderFontStyleColors,
    renderFontFaceSize,
  ])

  if (toolbarMode === 'hidden') return null

  return (
    <div
      className={`toolbar flex items-center h-[30px] bg-(--fd-toolbar-bg) shadow-(--fd-chrome-shadow) px-2 gap-0.5 shrink-0 relative z-[1]${toolbarMode === 'comfortable' ? ' toolbar-comfortable h-9' : ''}`}
      ref={toolbarRef}
    >
      {/* Undo / Redo — always visible */}
      <div className="toolbar-group flex items-center gap-px">
        <button
          className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
          title="Undo (⌘Z)"
          onClick={() => {
            try {
              editor?.chain().focus().undo().run()
            } catch {}
          }}
          disabled={
            !editor ||
            typeof (editor.can() as any).undo !== 'function' ||
            !(editor.can() as any).undo()
          }
        >
          <FaUndo />
        </button>
        <button
          className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
          title="Redo (⇧⌘Z)"
          onClick={() => {
            try {
              editor?.chain().focus().redo().run()
            } catch {}
          }}
          disabled={
            !editor ||
            typeof (editor.can() as any).redo !== 'function' ||
            !(editor.can() as any).redo()
          }
        >
          <FaRedo />
        </button>
      </div>

      <div className="toolbar-separator w-px h-4 bg-(--fd-border) opacity-50 mx-[5px]" />

      {/* Element type selector — always visible */}
      <div className="toolbar-group flex items-center gap-px">
        <select
          className="element-selector h-5.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-overlay-medium) rounded-[5px] px-2 text-[11.5px] cursor-pointer outline-none min-w-[140px] focus:border-(--fd-accent)"
          value={activeElement}
          onChange={handleElementChange}
        >
          {Object.values(activeTemplate.rules)
            .filter((r) => r.enabled)
            // When inside an AV cell, only cell-valid types make sense — selecting
            // sceneHeading/action/etc. silently fails the schema check anyway.
            .filter((r) =>
              isInsideAvCell
                ? AV_CELL_ELEMENT_IDS.includes(r.id)
                : !AV_CELL_ELEMENT_IDS.includes(r.id),
            )
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
        </select>
      </div>

      <div className="toolbar-separator w-px h-4 bg-(--fd-border) opacity-50 mx-[5px]" />

      {/* Priority 5: Font face & size — hidden on mobile, collapsible on desktop */}
      <div
        className="toolbar-priority-block flex items-center gap-0.5 toolbar-desktop-only"
        data-priority="5"
      >
        {renderFontFaceSize()}
        <div className="toolbar-separator w-px h-4 bg-(--fd-border) opacity-50 mx-[5px]" />
      </div>

      {/* Priority 4: Font style & colors — hidden on mobile, collapsible on desktop.
          Suppress ColorPicker popups when hidden so they only render in the overflow copy. */}
      <div
        className="toolbar-priority-block flex items-center gap-0.5 toolbar-desktop-only"
        data-priority="4"
      >
        {renderFontStyleColors(false, !isHidden('4'))}
        <div className="toolbar-separator w-px h-4 bg-(--fd-border) opacity-50 mx-[5px]" />
      </div>

      {/* Priority 3: Alignment — hidden on mobile, collapsible on desktop */}
      <div
        className="toolbar-priority-block flex items-center gap-0.5 toolbar-desktop-only"
        data-priority="3"
      >
        {renderAlignment()}
        <div className="toolbar-separator w-px h-4 bg-(--fd-border) opacity-50 mx-[5px]" />
      </div>

      {/* Priority 2: Search & Go to — collapsible on desktop */}
      <div
        className="toolbar-priority-block flex items-center gap-0.5"
        data-priority="2"
      >
        {renderSearchGoto()}
      </div>

      <div className="toolbar-separator w-px h-4 bg-(--fd-border) opacity-50 mx-[5px]" />

      {/* Notes & Tags — always visible */}
      <div className="toolbar-group flex items-center gap-px">
        <button
          className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default${scriptNotesOpen ? ' active bg-(--fd-overlay-medium) border-transparent' : ''}`}
          title="Script Notes"
          onPointerDown={handleNotesClick}
        >
          <FaStickyNote />
        </button>
        <button
          className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default${tagsPanelOpen ? ' active bg-(--fd-overlay-medium) border-transparent' : ''}`}
          title="Production Tags"
          onPointerDown={handleTagsClick}
        >
          <FaTags />
        </button>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Overflow 3-dot menu */}
      {hasOverflow && (
        <div
          className="toolbar-group relative flex items-center gap-px toolbar-overflow-wrap"
          ref={overflowRef}
        >
          <button
            className={`toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default toolbar-overflow-btn text-sm${overflowOpen ? ' active bg-(--fd-overlay-medium) border-transparent' : ''}`}
            title="More formatting options"
            onClick={() => setOverflowOpen(!overflowOpen)}
          >
            <FaEllipsisV />
          </button>
          {overflowOpen && (
            <div className="toolbar-overflow-menu absolute top-full right-0 z-[200] bg-[var(--fd-dropdown-bg,var(--fd-bg))] border border-(--fd-border) rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.18)] py-1.5 px-2 mt-1 flex flex-wrap items-center gap-1 min-w-[200px] max-w-[min(400px,calc(100vw-16px))] overflow-visible [&_.color-picker-popup]:top-auto [&_.color-picker-popup]:bottom-full [&_.color-picker-popup]:left-auto [&_.color-picker-popup]:right-0">
              {overflowContent}
            </div>
          )}
        </div>
      )}

      {/* Zoom — desktop: P1 hides zoom-out, P2 hides zoom label/in */}
      <div
        className="zoom-group toolbar-priority-block flex items-center gap-1"
        data-priority="1"
      >
        <button
          className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
          title="Zoom Out"
          onClick={() => setZoomLevel(zoomLevel - 10)}
          disabled={zoomLevel <= 50}
        >
          <FaSearchMinus />
        </button>
      </div>
      <div
        className="zoom-group toolbar-priority-block flex items-center gap-1"
        data-priority="2b"
      >
        {zoomEditing ? (
          <input
            ref={zoomInputRef}
            className="zoom-input w-10 bg-(--fd-input-bg) border border-(--fd-accent) rounded-[3px] text-(--fd-text) text-[11px] text-center outline-none py-px px-0.5 [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0"
            type="number"
            min={50}
            max={200}
            step={10}
            value={zoomInput}
            onChange={(e) => setZoomInput(e.target.value)}
            onBlur={commitZoom}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitZoom()
              if (e.key === 'Escape') {
                setZoomInput(String(zoomLevel))
                setZoomEditing(false)
              }
            }}
            autoFocus
          />
        ) : (
          <span
            className="zoom-label text-(--fd-text-muted) text-[11px] min-w-9 text-center tabular-nums cursor-pointer"
            onClick={() => {
              setZoomEditing(true)
              setTimeout(() => zoomInputRef.current?.select(), 0)
            }}
            title="Click to edit zoom"
          >
            {zoomLevel}%
          </span>
        )}
        <button
          className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
          title="Zoom In"
          onClick={() => setZoomLevel(zoomLevel + 10)}
          disabled={zoomLevel >= 300}
        >
          <FaSearchPlus />
        </button>
      </div>

      {/* Zoom — mobile: single button */}
      <div className="toolbar-group zoom-mobile-group hidden flex items-center gap-px">
        <button
          className="toolbar-btn flex items-center justify-center w-[26px] h-6 bg-transparent border border-transparent rounded-[5px] text-(--fd-text) cursor-pointer text-xs transition-[background] duration-100 hover:bg-(--fd-overlay-light) hover:border-transparent disabled:opacity-30 disabled:cursor-default"
          title="Zoom"
          onClick={() => setZoomPanelOpen(!zoomPanelOpen)}
        >
          <FaSearchPlus />
        </button>
      </div>
    </div>
  )
}

export default Toolbar
