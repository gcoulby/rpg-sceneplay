import React, { useEffect, useState, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import {
  ELEMENT_LABELS,
  NOTE_COLORS,
  type ElementType,
} from '@/stores/editorStore'
import { useEditorStore } from '@/stores/editorStore'
import { singleLine } from '@/utils/nodeText'

// Element types for the picker sheet
const ELEMENT_TYPES: ElementType[] = [
  'sceneHeading',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
  'general',
  'shot',
  'newAct',
  'endOfAct',
  'lyrics',
  'showEpisode',
  'castList',
]

// Context-aware ordering: most likely choices first
const ELEMENT_ORDER: Record<string, ElementType[]> = {
  sceneHeading: [
    'action',
    'character',
    'general',
    'transition',
    'shot',
    'sceneHeading',
    'dialogue',
    'parenthetical',
    'newAct',
    'endOfAct',
    'lyrics',
    'showEpisode',
    'castList',
  ],
  action: [
    'action',
    'character',
    'dialogue',
    'general',
    'sceneHeading',
    'transition',
    'shot',
    'parenthetical',
    'newAct',
    'endOfAct',
    'lyrics',
    'showEpisode',
    'castList',
  ],
  character: [
    'dialogue',
    'parenthetical',
    'action',
    'character',
    'general',
    'sceneHeading',
    'transition',
    'shot',
    'newAct',
    'endOfAct',
    'lyrics',
    'showEpisode',
    'castList',
  ],
  dialogue: [
    'action',
    'character',
    'general',
    'dialogue',
    'parenthetical',
    'sceneHeading',
    'transition',
    'shot',
    'newAct',
    'endOfAct',
    'lyrics',
    'showEpisode',
    'castList',
  ],
  parenthetical: [
    'dialogue',
    'action',
    'character',
    'general',
    'parenthetical',
    'sceneHeading',
    'transition',
    'shot',
    'newAct',
    'endOfAct',
    'lyrics',
    'showEpisode',
    'castList',
  ],
  transition: [
    'sceneHeading',
    'action',
    'transition',
    'general',
    'character',
    'dialogue',
    'parenthetical',
    'shot',
    'newAct',
    'endOfAct',
    'lyrics',
    'showEpisode',
    'castList',
  ],
  general: [
    'general',
    'action',
    'character',
    'dialogue',
    'sceneHeading',
    'transition',
    'parenthetical',
    'shot',
    'newAct',
    'endOfAct',
    'lyrics',
    'showEpisode',
    'castList',
  ],
  shot: [
    'action',
    'shot',
    'character',
    'general',
    'sceneHeading',
    'transition',
    'dialogue',
    'parenthetical',
    'newAct',
    'endOfAct',
    'lyrics',
    'showEpisode',
    'castList',
  ],
  newAct: [
    'sceneHeading',
    'action',
    'newAct',
    'general',
    'character',
    'dialogue',
    'parenthetical',
    'transition',
    'shot',
    'endOfAct',
    'lyrics',
    'showEpisode',
    'castList',
  ],
  endOfAct: [
    'newAct',
    'sceneHeading',
    'action',
    'endOfAct',
    'general',
    'character',
    'dialogue',
    'parenthetical',
    'transition',
    'shot',
    'lyrics',
    'showEpisode',
    'castList',
  ],
  lyrics: [
    'lyrics',
    'dialogue',
    'action',
    'character',
    'general',
    'sceneHeading',
    'parenthetical',
    'transition',
    'shot',
    'newAct',
    'endOfAct',
    'showEpisode',
    'castList',
  ],
  showEpisode: [
    'action',
    'sceneHeading',
    'showEpisode',
    'general',
    'character',
    'dialogue',
    'parenthetical',
    'transition',
    'shot',
    'newAct',
    'endOfAct',
    'lyrics',
    'castList',
  ],
  castList: [
    'castList',
    'action',
    'character',
    'general',
    'sceneHeading',
    'dialogue',
    'parenthetical',
    'transition',
    'shot',
    'newAct',
    'endOfAct',
    'lyrics',
    'showEpisode',
  ],
}

interface MobileAccessoryBarProps {
  editor: Editor
}

const MobileAccessoryBar: React.FC<MobileAccessoryBarProps> = ({ editor }) => {
  const [bottom, setBottom] = useState(0)
  const [visible, setVisible] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [currentElement, setCurrentElement] = useState<ElementType>('action')
  const barRef = useRef<HTMLDivElement>(null)

  const {
    scriptNotesOpen,
    toggleScriptNotes,
    addNote,
    setNoteFilter,
    tagsPanelOpen,
    toggleTagsPanel,
    setPendingTagSelection,
  } = useEditorStore()

  // Track current element type at cursor
  useEffect(() => {
    if (!editor) return
    const update = () => {
      try {
        const { $from } = editor.state.selection
        const nodeType = $from.parent.type.name as ElementType
        if (ELEMENT_LABELS[nodeType]) setCurrentElement(nodeType)
      } catch {
        /* ignore */
      }
    }
    update()
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  // Position bar above the virtual keyboard using visualViewport
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      // When keyboard is up, visualViewport.height < window.innerHeight
      const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop
      if (keyboardHeight > 100) {
        // Keyboard is visible
        setBottom(keyboardHeight)
        setVisible(true)
      } else {
        setVisible(false)
        setSheetOpen(false)
      }
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  // Also show when editor is focused (even if viewport hasn't caught up yet)
  useEffect(() => {
    if (!editor) return
    const onFocus = () => {
      // Give the viewport a moment to adjust
      setTimeout(() => {
        const vv = window.visualViewport
        if (vv) {
          const kbh = window.innerHeight - vv.height - vv.offsetTop
          if (kbh > 100) {
            setBottom(kbh)
            setVisible(true)
          }
        }
      }, 300)
    }
    const onBlur = () => {
      // Delay to allow button taps in the bar to register
      setTimeout(() => {
        if (!barRef.current?.contains(document.activeElement)) {
          setVisible(false)
          setSheetOpen(false)
        }
      }, 200)
    }
    editor.on('focus', onFocus)
    editor.on('blur', onBlur)
    return () => {
      editor.off('focus', onFocus)
      editor.off('blur', onBlur)
    }
  }, [editor])

  const handleElementSelect = useCallback(
    (type: ElementType) => {
      editor.chain().focus().setNode(type).run()
      setSheetOpen(false)
    },
    [editor],
  )

  const handleAddNote = useCallback(() => {
    const { from, to } = editor.state.selection
    const $from = editor.state.doc.resolve(from)
    const hasSelection = from !== to
    const anchorText = hasSelection
      ? editor.state.doc.textBetween(from, to, ' ')
      : editor.state.doc.textBetween($from.start(), $from.end(), ' ')

    const currentNodeType = $from.parent.type.name as ElementType

    // Find scene
    let sceneId: string | null = null
    let sceneIdx = 0
    editor.state.doc.nodesBetween(0, from, (node) => {
      if (node.type.name === 'sceneHeading') {
        sceneId = `scene-${sceneIdx}`
        sceneIdx++
      }
      return true
    })

    const contextLabel = singleLine($from.parent.textContent).slice(0, 60)
    const defaultColor = NOTE_COLORS[0]
    const noteId = addNote({
      content: '',
      anchorText: anchorText.slice(0, 120),
      elementType: currentNodeType,
      contextLabel,
      color: defaultColor.name,
      sceneId,
    })

    const markFrom = hasSelection ? from : $from.start()
    const markTo = hasSelection ? to : $from.end()
    editor
      .chain()
      .focus()
      .setTextSelection({ from: markFrom, to: markTo })
      .setMark('scriptNote', { noteId, color: defaultColor.hex })
      .run()

    setNoteFilter({
      elementType: null,
      contextLabel: null,
      color: null,
      noteId,
    })
    if (!scriptNotesOpen) toggleScriptNotes()
  }, [editor, addNote, setNoteFilter, scriptNotesOpen, toggleScriptNotes])

  const handleTag = useCallback(() => {
    const { from, to } = editor.state.selection
    const $from = editor.state.doc.resolve(from)
    const hasSelection = from !== to
    const selFrom = hasSelection ? from : $from.start()
    const selTo = hasSelection ? to : $from.end()
    const text = editor.state.doc.textBetween(selFrom, selTo, ' ')
    const currentNodeType = $from.parent.type.name as ElementType

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
  }, [editor, setPendingTagSelection, tagsPanelOpen, toggleTagsPanel])

  if (!visible) return null

  const orderedTypes = ELEMENT_ORDER[currentElement] || ELEMENT_TYPES

  return (
    <>
      {/* Bottom sheet for element type picker */}
      {sheetOpen && (
        <div
          className="top-0 right-0 left-0 z-[3550] fixed flex flex-col justify-end mob-acc-sheet-overlay"
          style={{ bottom: bottom + 44 }}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setSheetOpen(false)
          }}
        >
          <div className="mob-acc-sheet bg-(--fd-dropdown-bg) border-t border-(--fd-border) rounded-t-xl max-h-[50vh] overflow-y-auto shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-2 [-webkit-overflow-scrolling:touch]">
            <div className="py-3 px-4 pb-2 text-xs font-semibold text-(--fd-text-muted) uppercase tracking-[0.5px] sticky top-0 bg-inherit">
              Element Type
            </div>
            <div className="flex flex-col">
              {orderedTypes.map((type) => (
                <button
                  key={type}
                  className={`flex items-center py-2.5 px-4 border-none bg-transparent text-(--fd-text) text-[15px] text-left cursor-pointer [-webkit-tap-highlight-color:transparent] active:bg-(--fd-accent) active:text-white ${currentElement === type ? 'text-(--fd-accent)! font-semibold' : ''}`}
                  onPointerDown={(e) => {
                    e.preventDefault()
                    handleElementSelect(type)
                  }}
                >
                  {currentElement === type && '\u2713 '}
                  {ELEMENT_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* The accessory bar */}
      <div
        ref={barRef}
        className="mob-acc-bar fixed left-0 right-0 z-[3600] h-11 flex items-center gap-0.5 px-1.5 bg-(--fd-toolbar-bg,var(--fd-bg-secondary)) border-t border-(--fd-border) shadow-[0_-2px_8px_rgba(0,0,0,0.2)] [-webkit-tap-highlight-color:transparent] [touch-action:none]"
        style={{ bottom }}
      >
        {/* Element type — most prominent */}
        <button
          className="flex items-center gap-1 h-8 px-2.5 bg-(--fd-accent) text-white border-none rounded-md text-[13px] font-semibold whitespace-nowrap cursor-pointer shrink-0 [-webkit-tap-highlight-color:transparent] active:opacity-80"
          onPointerDown={(e) => {
            e.preventDefault()
            setSheetOpen(!sheetOpen)
          }}
        >
          <span>{ELEMENT_LABELS[currentElement]}</span>
          <span className="opacity-80 text-[9px]">
            {sheetOpen ? '\u25BC' : '\u25B2'}
          </span>
        </button>

        <div className="w-px h-6 bg-(--fd-border) mx-1 shrink-0" />

        {/* Script Note */}
        <button
          className="mob-acc-btn flex items-center justify-center w-10 h-9 bg-transparent border-none rounded-md text-(--fd-text-secondary,#aaa) cursor-pointer shrink-0 [-webkit-tap-highlight-color:transparent] active:bg-(--fd-accent) active:text-white"
          onPointerDown={(e) => {
            e.preventDefault()
            handleAddNote()
          }}
          title="Add Script Note"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </button>

        {/* Tag */}
        <button
          className="mob-acc-btn flex items-center justify-center w-10 h-9 bg-transparent border-none rounded-md text-(--fd-text-secondary,#aaa) cursor-pointer shrink-0 [-webkit-tap-highlight-color:transparent] active:bg-(--fd-accent) active:text-white"
          onPointerDown={(e) => {
            e.preventDefault()
            handleTag()
          }}
          title="Tag"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        </button>

        {/* Context menu accessible via 3-finger touch on mobile */}
      </div>
    </>
  )
}

export default MobileAccessoryBar
