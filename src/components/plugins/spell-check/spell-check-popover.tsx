import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import { spellChecker, PROJECT_DICT_TARGET } from '@/editor/spellchecker'
import { spellCheckPluginKey } from '@/editor/extensions/SpellCheck'
import { useEditorStore } from '@/stores/editorStore'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'

interface SpellError {
  word: string
  from: number
  to: number
  context: string
  contextKey: string
}

interface SpellCheckPopoverProps {
  editor: Editor | null
}

const SpellCheckPopover: React.FC<SpellCheckPopoverProps> = ({ editor }) => {
  const spellCheckOpen = useEditorStore((s) => s.spellCheckOpen)
  const setSpellCheckOpen = useEditorStore((s) => s.setSpellCheckOpen)
  const flagProperNouns = useEditorStore(
    (s) => s.spellingSettings.flagProperNouns,
  )

  const [errors, setErrors] = useState<SpellError[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(0)
  const [replacementText, setReplacementText] = useState('')
  const [complete, setComplete] = useState(false)
  const [dictError, setDictError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const clearActiveHighlight = useCallback(() => {
    if (!editor || editor.isDestroyed) return
    const tr = editor.state.tr.setMeta(spellCheckPluginKey, {
      activeRange: null,
    })
    editor.view.dispatch(tr)
  }, [editor])

  const rescan = useCallback(() => {
    if (!editor) return []
    return spellChecker.findAllErrors(editor.state.doc, flagProperNouns)
  }, [editor, flagProperNouns])

  const goToError = useCallback(
    (errs: SpellError[], idx: number) => {
      if (!editor) return
      if (errs.length === 0 || idx < 0 || idx >= errs.length) {
        setComplete(true)
        clearActiveHighlight()
        return
      }
      setCurrentIndex(idx)
      const err = errs[idx]
      const sugs = spellChecker.suggest(err.word)
      setSuggestions(sugs)
      setSelectedSuggestion(0)
      setReplacementText(sugs[0] || err.word)

      const tr = editor.state.tr
      tr.setMeta(spellCheckPluginKey, {
        activeRange: { from: err.from, to: err.to },
      })
      tr.setSelection(TextSelection.near(editor.state.doc.resolve(err.from)))
      tr.scrollIntoView()
      editor.view.dispatch(tr)
    },
    [editor, clearActiveHighlight],
  )

  // Kick off a scan when opened.
  useEffect(() => {
    if (!spellCheckOpen || !editor) return
    let cancelled = false
    const doScan = async () => {
      const ready = await spellChecker.whenReady()
      if (cancelled) return
      if (!ready) {
        setDictError(true)
        return
      }
      const found = rescan()
      if (found.length === 0) {
        setComplete(true)
        return
      }
      setComplete(false)
      setDictError(false)
      setErrors(found)
      goToError(found, 0)
    }
    doScan()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spellCheckOpen, editor])

  const handleClose = useCallback(() => {
    setSpellCheckOpen(false)
    clearActiveHighlight()
    setErrors([])
    setCurrentIndex(0)
  }, [setSpellCheckOpen, clearActiveHighlight])

  const currentError = errors[currentIndex] as SpellError | undefined

  const handleChange = useCallback(() => {
    if (!editor || !currentError) return
    const { tr } = editor.state
    tr.insertText(replacementText, currentError.from, currentError.to)
    editor.view.dispatch(tr)
    setTimeout(() => {
      const found = rescan()
      setErrors(found)
      goToError(found, Math.min(currentIndex, found.length - 1))
    }, 100)
  }, [editor, currentError, replacementText, rescan, currentIndex, goToError])

  const handleChangeAll = useCallback(() => {
    if (!editor || !currentError) return
    const word = currentError.word
    const { tr } = editor.state
    const allErrors = errors.filter(
      (e) => e.word.toLowerCase() === word.toLowerCase(),
    )
    for (let i = allErrors.length - 1; i >= 0; i--) {
      tr.insertText(replacementText, allErrors[i].from, allErrors[i].to)
    }
    editor.view.dispatch(tr)
    setTimeout(() => {
      const found = rescan()
      setErrors(found)
      goToError(found, 0)
    }, 100)
  }, [editor, currentError, replacementText, errors, rescan, goToError])

  const handleIgnore = useCallback(() => {
    if (!currentError) return
    spellChecker.ignoreOnce(currentError.word, currentError.contextKey)
    const found = rescan()
    setErrors(found)
    goToError(found, Math.min(currentIndex, found.length - 1))
  }, [currentError, currentIndex, rescan, goToError])

  const handleIgnoreAll = useCallback(() => {
    if (!currentError) return
    spellChecker.ignoreWord(currentError.word)
    const found = rescan()
    setErrors(found)
    goToError(found, Math.min(currentIndex, found.length - 1))
  }, [currentError, rescan, currentIndex, goToError])

  const handleAddToDictionaryTarget = useCallback(
    (target: string) => {
      if (!currentError) return
      if (target === PROJECT_DICT_TARGET) {
        spellChecker.addToProjectDictionary(currentError.word)
      } else {
        useEditorStore
          .getState()
          .appendWordToGlobalDictionary(target, currentError.word)
      }
      const found = rescan()
      setErrors(found)
      goToError(found, Math.min(currentIndex, found.length - 1))
    },
    [currentError, rescan, currentIndex, goToError],
  )

  const handleAddToDictionary = useCallback(() => {
    const targets = spellChecker.getActiveAddTargets()
    handleAddToDictionaryTarget(targets[0] || PROJECT_DICT_TARGET)
  }, [handleAddToDictionaryTarget])

  const handleRecheck = useCallback(() => {
    setComplete(false)
    const found = rescan()
    if (found.length === 0) {
      setComplete(true)
      return
    }
    setErrors(found)
    goToError(found, 0)
  }, [rescan, goToError])

  const handleSuggestionClick = useCallback(
    (idx: number) => {
      setSelectedSuggestion(idx)
      setReplacementText(suggestions[idx])
    },
    [suggestions],
  )

  return (
    <Popover open={spellCheckOpen} onOpenChange={() => {}}>
      <PopoverTrigger
        tabIndex={-1}
        aria-hidden
        className="top-12 right-5 fixed w-0 h-0 pointer-events-none"
      />
      <PopoverContent
        align="end"
        sideOffset={8}
        className="p-0 w-105 text-[13px]"
      >
        {dictError ? (
          <div className="p-8 text-center">
            <div className="text-(--fd-text-muted) text-4xl mb-3">&#9888;</div>
            <div className="text-(--fd-text) text-sm">
              Dictionary could not be loaded.
              <br />
              <span className="text-xs text-(--fd-text-muted)">
                Spell check is not available in this environment.
              </span>
            </div>
            <button className="mt-4 dialog-primary" onClick={handleClose}>
              Close
            </button>
          </div>
        ) : complete ? (
          <div className="p-8 text-center">
            <div className="text-(--fd-text-muted) text-4xl mb-3">&#10003;</div>
            <div className="text-(--fd-text) text-sm mb-4">
              Spelling check is complete.
            </div>
            <div className="flex justify-center gap-2">
              <button onClick={handleRecheck}>Recheck</button>
              <button className="dialog-primary" onClick={handleClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-2.5 px-3.5 border-b border-(--fd-border)">
              <span className="font-semibold text-sm text-(--fd-text)">
                Spelling: {errors.length} issue{errors.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-(--fd-text-muted)">
                {currentIndex + 1} / {errors.length}
              </span>
            </div>

            <div className="flex flex-col gap-3 p-3.5">
              <div>
                <label className="text-xs text-(--fd-text-muted) uppercase tracking-[0.5px]">
                  Not in Dictionary:
                </label>
                <div className="mt-1 min-h-9 flex items-center bg-(--fd-input-bg) border border-(--fd-border) rounded-[3px] px-2.5 py-1.5">
                  {currentError &&
                    (() => {
                      const ctx = currentError.context
                      const lcCtx = ctx.toLowerCase()
                      const lcWord = currentError.word.toLowerCase()
                      const idx = lcCtx.indexOf(lcWord)
                      if (idx < 0) return <span>{ctx}</span>
                      return (
                        <span>
                          {ctx.slice(0, idx)}
                          <span className="spell-modal-error-word">
                            {ctx.slice(idx, idx + currentError.word.length)}
                          </span>
                          {ctx.slice(idx + currentError.word.length)}
                        </span>
                      )
                    })()}
                </div>
              </div>

              <div>
                <label className="text-xs text-(--fd-text-muted) uppercase tracking-[0.5px]">
                  Change to:
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  className="mt-1 w-full h-9 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-2.5 text-[13px] outline-none focus:border-(--fd-accent)"
                  value={replacementText}
                  onChange={(e) => setReplacementText(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-(--fd-text-muted) uppercase tracking-[0.5px]">
                  Suggestions:
                </label>
                <div className="mt-1 min-h-24 max-h-40 overflow-y-auto bg-(--fd-input-bg) border border-(--fd-border) rounded-[3px] p-1.5">
                  {suggestions.length === 0 ? (
                    <div className="text-(--fd-text-muted) italic text-xs px-1.5 py-1">
                      (no suggestions)
                    </div>
                  ) : (
                    suggestions.map((s, i) => (
                      <div
                        key={s}
                        className={`px-1.5 py-1 rounded-[3px] cursor-pointer text-[13px] ${
                          i === selectedSuggestion
                            ? 'bg-(--fd-accent) text-white'
                            : 'hover:bg-(--fd-menu-hover)'
                        }`}
                        onClick={() => handleSuggestionClick(i)}
                        onDoubleClick={() => {
                          handleSuggestionClick(i)
                          handleChange()
                        }}
                      >
                        {s}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2 px-3.5 pb-3.5">
              <div className="flex flex-col gap-1.5">
                <button onClick={handleIgnore}>Ignore Once</button>
                <button onClick={handleIgnoreAll}>Ignore All</button>
                <button onClick={handleAddToDictionary}>
                  Add to Dictionary
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                <button className="dialog-primary" onClick={handleChange}>
                  Change
                </button>
                <button onClick={handleChangeAll}>Change All</button>
                <button onClick={handleRecheck}>Recheck</button>
                <button onClick={handleClose}>Close</button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default SpellCheckPopover
