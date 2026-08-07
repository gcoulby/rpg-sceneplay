import React, { useState, useEffect, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import { grammarPluginKey } from '@/editor/extensions/Grammar'
import { grammarIgnore, GrammarIgnore } from '@/editor/grammar/grammarIgnore'
import { useEditorStore } from '@/stores/editorStore'
import { RETEXT_CATEGORY_META } from '@/editor/grammar/retextProvider'
import { HARPER_CATEGORY_META } from '@/editor/grammar/harperProvider'
import type { GrammarIssue } from '@/plugins/registry'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

interface WritingSuggestionsPopoverProps {
  editor: Editor | null
}

const WritingSuggestionsPopover: React.FC<WritingSuggestionsPopoverProps> = ({
  editor,
}) => {
  const writingSuggestionsOpen = useEditorStore((s) => s.writingSuggestionsOpen)
  const setWritingSuggestionsOpen = useEditorStore(
    (s) => s.setWritingSuggestionsOpen,
  )
  const setGrammarRuleEnabled = useEditorStore((s) => s.setGrammarRuleEnabled)

  const [issues, setIssues] = useState<GrammarIssue[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // Pull current issues from the plugin state and stay in sync as edits happen.
  // Gate on the plugin's issues array reference: meta-only transactions (e.g.
  // activeRange highlight updates) keep the same reference, so we skip those
  // to avoid an infinite render loop with the highlight effect below.
  const lastIssuesRef = React.useRef<GrammarIssue[] | null>(null)
  useEffect(() => {
    if (!editor || !writingSuggestionsOpen) return
    const pull = () => {
      const ps = grammarPluginKey.getState(editor.state) as
        | { issues?: GrammarIssue[] }
        | undefined
      const psIssues = ps?.issues ?? []
      if (psIssues === lastIssuesRef.current) return
      lastIssuesRef.current = psIssues
      const next = [...psIssues].sort((a, b) => a.from - b.from)
      setIssues(next)
      setCurrentIndex((idx) => Math.min(idx, Math.max(0, next.length - 1)))
    }
    pull()
    editor.on('transaction', pull)
    return () => {
      editor.off('transaction', pull)
    }
  }, [editor, writingSuggestionsOpen])

  // Highlight current issue + scroll into view.
  useEffect(() => {
    if (!editor || editor.isDestroyed || !writingSuggestionsOpen) return
    const issue = issues[currentIndex]
    if (!issue) {
      const tr = editor.state.tr.setMeta(grammarPluginKey, {
        activeRange: null,
      })
      editor.view.dispatch(tr)
      return
    }
    const tr = editor.state.tr
    tr.setMeta(grammarPluginKey, {
      activeRange: { from: issue.from, to: issue.to },
    })
    try {
      tr.setSelection(TextSelection.near(editor.state.doc.resolve(issue.from)))
      tr.scrollIntoView()
    } catch {
      /* position may be transiently invalid mid-edit */
    }
    editor.view.dispatch(tr)
  }, [editor, issues, currentIndex, writingSuggestionsOpen])

  const clearHighlight = useCallback(() => {
    if (!editor || editor.isDestroyed) return
    const tr = editor.state.tr.setMeta(grammarPluginKey, {
      activeRange: null,
    })
    editor.view.dispatch(tr)
  }, [editor])

  const handleClose = useCallback(() => {
    setWritingSuggestionsOpen(false)
    clearHighlight()
    setIssues([])
    setCurrentIndex(0)
  }, [setWritingSuggestionsOpen, clearHighlight])

  const currentIssue: GrammarIssue | undefined = issues[currentIndex]

  const goNext = useCallback(() => {
    if (issues.length === 0) return
    setCurrentIndex((idx) => Math.min(idx + 1, issues.length - 1))
  }, [issues.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((idx) => Math.max(0, idx - 1))
  }, [])

  const handleApplySuggestion = useCallback(
    (replacement: string) => {
      if (!editor || !currentIssue) return
      const tr = editor.state.tr
      tr.insertText(replacement, currentIssue.from, currentIssue.to)
      editor.view.dispatch(tr)
      // Issues list refreshes via the transaction subscription. Stay at the
      // same index — after the rescan it lands on the next remaining issue.
    },
    [currentIssue, editor],
  )

  const handleIgnoreOnce = useCallback(() => {
    if (!editor || !currentIssue) return
    const snippetStart = Math.max(0, currentIssue.from - 30)
    const snippetEnd = Math.min(
      editor.state.doc.content.size,
      currentIssue.to + 30,
    )
    const text = editor.state.doc.textBetween(snippetStart, snippetEnd, ' ')
    const localIdx = currentIssue.from - snippetStart
    const length = currentIssue.to - currentIssue.from
    const ctxKey = GrammarIgnore.buildContextKey(text, localIdx, length)
    grammarIgnore.ignoreOnce(currentIssue.ruleId, ctxKey)
    const tr = editor.state.tr.setMeta(grammarPluginKey, { rescanAll: true })
    editor.view.dispatch(tr)
  }, [currentIssue, editor])

  const handleIgnoreRuleForDoc = useCallback(() => {
    if (!editor || !currentIssue) return
    grammarIgnore.ignoreRuleForDoc(currentIssue.ruleId)
    const tr = editor.state.tr.setMeta(grammarPluginKey, { rescanAll: true })
    editor.view.dispatch(tr)
  }, [currentIssue, editor])

  const handleDisableRuleEverywhere = useCallback(() => {
    if (!currentIssue) return
    setGrammarRuleEnabled(currentIssue.ruleId, false)
    // Store subscriber inside Grammar extension triggers a rescan automatically.
  }, [currentIssue, setGrammarRuleEnabled])

  const ruleLabel = currentIssue
    ? (RETEXT_CATEGORY_META[
        currentIssue.ruleId as keyof typeof RETEXT_CATEGORY_META
      ]?.label ??
      HARPER_CATEGORY_META[
        currentIssue.ruleId as keyof typeof HARPER_CATEGORY_META
      ]?.label ??
      currentIssue.ruleId)
    : ''

  const contextSnippet =
    editor && currentIssue
      ? (() => {
          const start = Math.max(0, currentIssue.from - 30)
          const end = Math.min(
            editor.state.doc.content.size,
            currentIssue.to + 30,
          )
          const text = editor.state.doc.textBetween(start, end, ' ')
          const offsetIntoSnippet = currentIssue.from - start
          const issueLen = currentIssue.to - currentIssue.from
          return {
            before: text.slice(0, offsetIntoSnippet),
            match: text.slice(offsetIntoSnippet, offsetIntoSnippet + issueLen),
            after: text.slice(offsetIntoSnippet + issueLen),
          }
        })()
      : null

  return (
    <Popover open={writingSuggestionsOpen} onOpenChange={() => {}}>
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
        {issues.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mb-3 text-4xl">&#10003;</div>
            <div className="text-(--fd-text) text-sm">
              No writing suggestions found.
            </div>
            <Button
              className="mt-4 bg-(--fd-accent)! border-(--fd-accent)! text-white! hover:opacity-90"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-2.5 px-3.5 border-b border-(--fd-border)">
              <span className="font-semibold text-sm text-(--fd-text)">
                Writing Suggestions: {issues.length} issue
                {issues.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-(--fd-text-muted)">
                {currentIndex + 1} / {issues.length}
              </span>
            </div>

            <div className="flex flex-col gap-3 p-3.5">
              <div>
                <label className="text-xs text-(--fd-text-muted) uppercase tracking-[0.5px]">
                  {ruleLabel}:
                </label>
                <div className="mt-1 min-h-9 flex items-center bg-(--fd-input-bg) border border-(--fd-border) rounded-[3px] px-2.5 py-1.5">
                  {contextSnippet && (
                    <span>
                      {contextSnippet.before}
                      <span className="spell-modal-error-word">
                        {contextSnippet.match}
                      </span>
                      {contextSnippet.after}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-(--fd-text-muted) uppercase tracking-[0.5px]">
                  Why:
                </label>
                <div className="mt-1 text-[13px] text-(--fd-text) leading-[1.4]">
                  {currentIssue?.message}
                </div>
              </div>

              <div>
                <label className="text-xs text-(--fd-text-muted) uppercase tracking-[0.5px]">
                  Suggestions:
                </label>
                <div className="mt-1 min-h-24 max-h-40 overflow-y-auto bg-(--fd-input-bg) border border-(--fd-border) rounded-[3px] p-1.5">
                  {!currentIssue?.suggestions ||
                  currentIssue.suggestions.length === 0 ? (
                    <div className="text-(--fd-text-muted) italic text-xs px-1.5 py-1">
                      (no automatic replacement — edit manually or skip)
                    </div>
                  ) : (
                    currentIssue.suggestions.map((s, i) => (
                      <div
                        key={`${s}-${i}`}
                        className="px-1.5 py-1 rounded-[3px] cursor-pointer text-[13px] hover:bg-(--fd-menu-hover)"
                        onClick={() => handleApplySuggestion(s)}
                        onDoubleClick={() => handleApplySuggestion(s)}
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
                <Button onClick={handleIgnoreOnce}>Ignore Once</Button>
                <Button onClick={handleIgnoreRuleForDoc}>
                  Ignore in Document
                </Button>
                <Button onClick={handleDisableRuleEverywhere}>
                  Disable Rule
                </Button>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button onClick={goPrev} disabled={currentIndex === 0}>
                  Previous
                </Button>
                <Button
                  className="bg-(--fd-accent)! border-(--fd-accent)! text-white! hover:opacity-90"
                  onClick={goNext}
                  disabled={currentIndex >= issues.length - 1}
                >
                  Next
                </Button>
                <Button onClick={handleClose}>Close</Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default WritingSuggestionsPopover
