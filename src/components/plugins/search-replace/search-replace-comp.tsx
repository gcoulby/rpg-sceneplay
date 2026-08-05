import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { useEditorStore } from '@/stores/editorStore'
import { findAllMatches, type MatchResult } from '@/editor/searchMap'
import { searchPluginKey } from './search-replace-plugin'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa'

interface SearchReplaceProps {
  editor: Editor | null
}

const SearchReplace: React.FC<SearchReplaceProps> = ({ editor }) => {
  const { searchOpen, setSearchOpen } = useEditorStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when panel opens
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [searchOpen])

  const clearDecorations = useCallback(() => {
    if (!editor) return
    const { tr } = editor.state
    tr.setMeta(searchPluginKey, DecorationSet.empty)
    editor.view.dispatch(tr)
  }, [editor])

  // The Popover is fully controlled (onOpenChange is a no-op below), so this
  // is the only path that closes it — the X button or the Escape handler.
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setSearchOpen(open)
      if (!open) {
        clearDecorations()
        setSearchTerm('')
        setReplaceTerm('')
        setMatches([])
        setCurrentIndex(-1)
        editor?.commands.focus()
      }
    },
    [setSearchOpen, clearDecorations, editor],
  )

  const updateDecorations = useCallback(
    (found: MatchResult[], activeIdx: number) => {
      if (!editor) return
      const decorations = found.map((m, i) =>
        Decoration.inline(m.from, m.to, {
          class:
            i === activeIdx ? 'search-highlight-current' : 'search-highlight',
        }),
      )
      const { tr } = editor.state
      tr.setMeta(
        searchPluginKey,
        DecorationSet.create(editor.state.doc, decorations),
      )
      editor.view.dispatch(tr)
    },
    [editor],
  )

  const scrollToMatch = useCallback(
    (match: MatchResult) => {
      if (!editor) return
      editor.chain().setTextSelection({ from: match.from, to: match.to }).run()
      // Instant jump, not smooth scroll — smooth scrolling repaints the
      // editor on every intermediate frame, which is slow on long paginated
      // documents. One jump, one repaint.
      requestAnimationFrame(() => {
        const coords = editor.view.coordsAtPos(match.from)
        const scrollEl = editor.view.dom.closest('.editor-main')
        if (scrollEl) {
          const rect = scrollEl.getBoundingClientRect()
          const target =
            scrollEl.scrollTop + (coords.top - rect.top) - rect.height / 3
          scrollEl.scrollTo({ top: target, behavior: 'auto' })
        }
      })
    },
    [editor],
  )

  // Runs a search in direct response to a user action (typing, toggling
  // options). Called from event handlers rather than an effect body, since
  // calling setState synchronously inside an effect body is flagged by
  // react-hooks/set-state-in-effect and, more to the point, there's no
  // external system to synchronise with here — it's just a reaction to
  // input, which is what handlers are for.
  const runSearch = useCallback(
    (term: string, mc: boolean, ww: boolean) => {
      if (!editor) return
      const found = findAllMatches(editor.state.doc, term, mc, ww)
      setMatches(found)
      const idx = found.length > 0 ? 0 : -1
      setCurrentIndex(idx)
      updateDecorations(found, idx)
      if (found.length > 0) scrollToMatch(found[0])
    },
    [editor, updateDecorations, scrollToMatch],
  )

  // Refresh matches when the document changes elsewhere (typing, undo,
  // collaborative edits). This sets state inside a callback subscribed to
  // an external event (the editor's update event), not directly in the
  // effect body — the case react-hooks/set-state-in-effect exempts, since
  // this genuinely is "subscribe and react to an external system changing".
  useEffect(() => {
    if (!editor || !searchOpen || !searchTerm) return
    const onUpdate = () => {
      const found = findAllMatches(
        editor.state.doc,
        searchTerm,
        matchCase,
        wholeWord,
      )
      setMatches(found)
      setCurrentIndex((prev) => {
        const next = Math.min(prev, found.length - 1)
        const idx = next >= 0 ? next : found.length > 0 ? 0 : -1
        updateDecorations(found, idx)
        return idx
      })
    }
    editor.on('update', onUpdate)
    return () => {
      editor.off('update', onUpdate)
    }
  }, [editor, searchOpen, searchTerm, matchCase, wholeWord, updateDecorations])

  const findNext = useCallback(() => {
    if (matches.length === 0) return
    const next = currentIndex < matches.length - 1 ? currentIndex + 1 : 0
    setCurrentIndex(next)
    updateDecorations(matches, next)
    scrollToMatch(matches[next])
  }, [matches, currentIndex, updateDecorations, scrollToMatch])

  const findPrev = useCallback(() => {
    if (matches.length === 0) return
    const prev = currentIndex > 0 ? currentIndex - 1 : matches.length - 1
    setCurrentIndex(prev)
    updateDecorations(matches, prev)
    scrollToMatch(matches[prev])
  }, [matches, currentIndex, updateDecorations, scrollToMatch])

  const replaceOne = useCallback(() => {
    if (!editor || matches.length === 0 || currentIndex < 0) return
    const match = matches[currentIndex]

    editor
      .chain()
      .setTextSelection({ from: match.from, to: match.to })
      .deleteSelection()
      .insertContent(replaceTerm)
      .run()

    const found = findAllMatches(
      editor.state.doc,
      searchTerm,
      matchCase,
      wholeWord,
    )
    setMatches(found)
    const nextIdx =
      found.length > 0 ? Math.min(currentIndex, found.length - 1) : -1
    setCurrentIndex(nextIdx)
    updateDecorations(found, nextIdx)
    if (nextIdx >= 0) scrollToMatch(found[nextIdx])
  }, [
    editor,
    matches,
    currentIndex,
    replaceTerm,
    searchTerm,
    matchCase,
    wholeWord,
    updateDecorations,
    scrollToMatch,
  ])

  const replaceAll = useCallback(() => {
    if (!editor || matches.length === 0) return

    // Reverse order keeps earlier positions valid as later ones are edited.
    const { tr } = editor.state
    for (let i = matches.length - 1; i >= 0; i--) {
      const { from, to } = matches[i]
      if (replaceTerm) {
        tr.replaceWith(from, to, editor.state.schema.text(replaceTerm))
      } else {
        tr.delete(from, to)
      }
    }
    editor.view.dispatch(tr)

    const found = findAllMatches(
      editor.state.doc,
      searchTerm,
      matchCase,
      wholeWord,
    )
    setMatches(found)
    setCurrentIndex(found.length > 0 ? 0 : -1)
    updateDecorations(found, found.length > 0 ? 0 : -1)
  }, [
    editor,
    matches,
    replaceTerm,
    searchTerm,
    matchCase,
    wholeWord,
    updateDecorations,
  ])

  // Keyboard shortcuts. Escape closes explicitly here because the Popover's
  // own dismissal is disabled (onOpenChange below is a no-op).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }
      if (!searchOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        handleOpenChange(false)
        return
      }
      if (
        e.key === 'F3' ||
        ((e.metaKey || e.ctrlKey) && e.key === 'g' && !e.shiftKey)
      ) {
        e.preventDefault()
        findNext()
        return
      }
      if (
        (e.key === 'F3' && e.shiftKey) ||
        ((e.metaKey || e.ctrlKey) && e.key === 'g' && e.shiftKey)
      ) {
        e.preventDefault()
        findPrev()
        return
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, setSearchOpen, handleOpenChange, findNext, findPrev])

  return (
    // onOpenChange is a no-op: this makes the popover fully controlled by
    // `open`, so Base UI's own outside-click/Escape dismissal never fires.
    // Closing only happens through handleOpenChange (X button, or Escape
    // via the keydown handler above).
    <Popover open={searchOpen} onOpenChange={() => {}}>
      <PopoverTrigger
        tabIndex={-1}
        aria-hidden
        className="top-12 right-5 fixed w-0 h-0 pointer-events-none"
      />
      <PopoverContent
        align="end"
        sideOffset={8}
        className="p-0 w-95 text-[13px]"
      >
        <div className="flex items-center justify-between py-2 px-3 border-b border-(--fd-border) font-semibold text-xs text-(--fd-text-muted) uppercase tracking-[0.5px]">
          <span>Find & Replace</span>
          <button
            className="bg-transparent border-none text-(--fd-text-muted) cursor-pointer hover:text-(--fd-text)"
            onClick={() => handleOpenChange(false)}
            aria-label="Close find and replace"
          >
            <FaTimes size={12} />
          </button>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <label className="min-w-13.75 text-xs text-(--fd-text-muted)">
              Find:
            </label>
            <input
              ref={inputRef}
              type="text"
              className="flex-1 h-7 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-[13px] outline-none focus:border-(--fd-accent)"
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value
                setSearchTerm(value)
                runSearch(value, matchCase, wholeWord)
              }}
              aria-label="Find text"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.shiftKey) {
                  e.preventDefault()
                  findPrev()
                } else if (e.key === 'Enter') {
                  e.preventDefault()
                  findNext()
                }
              }}
              placeholder="Search text..."
            />
            <span className="text-[11px] text-(--fd-text-muted) min-w-12.5 text-right">
              {searchTerm
                ? `${matches.length > 0 ? currentIndex + 1 : 0} / ${matches.length}`
                : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <label className="min-w-13.75 text-xs text-(--fd-text-muted)">
              Replace:
            </label>
            <input
              type="text"
              className="flex-1 h-7 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2 text-[13px] outline-none focus:border-(--fd-accent)"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              aria-label="Replace with text"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  replaceOne()
                }
              }}
              placeholder="Replace with..."
            />
          </div>

          <div className="flex gap-4 mb-2.5">
            <label className="flex items-center gap-1.5 text-xs text-(--fd-text-muted) cursor-pointer">
              <input
                type="checkbox"
                className="cursor-pointer"
                checked={matchCase}
                onChange={(e) => {
                  const checked = e.target.checked
                  setMatchCase(checked)
                  runSearch(searchTerm, checked, wholeWord)
                }}
              />
              Match Case
            </label>
            <label className="flex items-center gap-1.5 text-xs text-(--fd-text-muted) cursor-pointer">
              <input
                type="checkbox"
                className="cursor-pointer"
                checked={wholeWord}
                onChange={(e) => {
                  const checked = e.target.checked
                  setWholeWord(checked)
                  runSearch(searchTerm, matchCase, checked)
                }}
              />
              Whole Word
            </label>
          </div>

          <div className="flex gap-1.5">
            <button
              className="flex-1 h-7 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] cursor-pointer text-xs hover:bg-(--fd-menu-hover) disabled:opacity-40 disabled:cursor-default"
              onClick={findPrev}
              disabled={!searchTerm || matches.length === 0}
              aria-label="Find previous match"
            >
              <FaChevronLeft className="inline" size={10} /> Prev
            </button>
            <button
              className="flex-1 h-7 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] cursor-pointer text-xs hover:bg-(--fd-menu-hover) disabled:opacity-40 disabled:cursor-default"
              onClick={findNext}
              disabled={!searchTerm || matches.length === 0}
              aria-label="Find next match"
            >
              Next <FaChevronRight className="inline" size={10} />
            </button>
            <button
              className="flex-1 h-7 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] cursor-pointer text-xs hover:bg-(--fd-menu-hover) disabled:opacity-40 disabled:cursor-default"
              onClick={replaceOne}
              disabled={!searchTerm || matches.length === 0}
              aria-label="Replace current match"
            >
              Replace
            </button>
            <button
              className="flex-1 h-7 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] cursor-pointer text-xs hover:bg-(--fd-menu-hover) disabled:opacity-40 disabled:cursor-default"
              onClick={replaceAll}
              disabled={!searchTerm || matches.length === 0}
              aria-label="Replace all matches"
            >
              Replace All
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default SearchReplace
