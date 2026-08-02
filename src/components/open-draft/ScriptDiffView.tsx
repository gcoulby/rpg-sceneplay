import React, { useMemo, useState } from 'react'
import type { JSONContent } from '@tiptap/react'
import {
  computeScriptDiff,
  type DiffBlock,
  type WordDiff,
} from '@/utils/scriptDiff'

interface Props {
  docA: JSONContent
  docB: JSONContent
  labelA: string
  labelB: string
  onClose?: () => void
}

type ViewMode = 'side-by-side' | 'unified' | 'changes-only'

const ELEMENT_LABEL: Record<string, string> = {
  sceneHeading: 'Scene',
  action: 'Action',
  character: 'Character',
  dialogue: 'Dialogue',
  parenthetical: 'Parenthetical',
  transition: 'Transition',
  general: 'General',
  shot: 'Shot',
  newAct: 'Act Break',
  endOfAct: 'End of Act',
}

const ScriptDiffView: React.FC<Props> = ({
  docA,
  docB,
  labelA,
  labelB,
  onClose,
}) => {
  const [mode, setMode] = useState<ViewMode>('side-by-side')
  const [showSummary, setShowSummary] = useState(true)

  const diff = useMemo(() => computeScriptDiff(docA, docB), [docA, docB])

  const displayBlocks = useMemo(() => {
    if (mode === 'changes-only')
      return diff.blocks.filter((b) => b.type !== 'unchanged')
    return diff.blocks
  }, [diff.blocks, mode])

  return (
    <div className="flex flex-col h-full w-full bg-(--fd-background) text-(--fd-text)">
      <div className="flex items-center gap-3.5 py-2.5 px-4.5 border-b border-(--fd-border) shrink-0 flex-wrap">
        <div className="flex flex-1 items-center gap-2 min-w-50 text-xs">
          <span className="flex items-center gap-1">
            <span className="bg-[#64748b] px-1.75 py-px rounded-[3px] font-bold text-[10px] text-white">
              A
            </span>
            {labelA}
          </span>
          <span className="text-(--fd-text-muted)">→</span>
          <span className="flex items-center gap-1">
            <span className="bg-[#3b82f6] px-1.75 py-px rounded-[3px] font-bold text-[10px] text-white">
              B
            </span>
            {labelB}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className={`bg-none border border-(--fd-border) text-(--fd-text-muted) py-1 px-2.5 rounded text-[11px] cursor-pointer hover:bg-(--fd-overlay-light) hover:text-(--fd-text) ${mode === 'side-by-side' ? 'bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
            onClick={() => setMode('side-by-side')}
          >
            Side-by-side
          </button>
          <button
            className={`bg-none border border-(--fd-border) text-(--fd-text-muted) py-1 px-2.5 rounded text-[11px] cursor-pointer hover:bg-(--fd-overlay-light) hover:text-(--fd-text) ${mode === 'unified' ? 'bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
            onClick={() => setMode('unified')}
          >
            Unified
          </button>
          <button
            className={`bg-none border border-(--fd-border) text-(--fd-text-muted) py-1 px-2.5 rounded text-[11px] cursor-pointer hover:bg-(--fd-overlay-light) hover:text-(--fd-text) ${mode === 'changes-only' ? 'bg-(--fd-accent)! text-white! border-(--fd-accent)!' : ''}`}
            onClick={() => setMode('changes-only')}
          >
            Changes only
          </button>
          <button
            className="bg-none border border-(--fd-border) text-(--fd-text-muted) py-1 px-2.5 rounded text-[11px] cursor-pointer hover:bg-(--fd-overlay-light) hover:text-(--fd-text)"
            onClick={() => setShowSummary((v) => !v)}
          >
            {showSummary ? 'Hide Summary' : 'Show Summary'}
          </button>
          {onClose && (
            <button
              className="bg-none border-none text-(--fd-text-muted) text-xl cursor-pointer py-0 px-2 leading-none hover:text-(--fd-text)"
              onClick={onClose}
              title="Close diff"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto py-4.5 px-7 font-['Courier_New',Courier,monospace] text-[12pt] bg-(--fd-page-bg,white) text-[#222]">
          {displayBlocks.length === 0 ? (
            <div className="p-10 text-[#888] text-center italic">
              No differences.
            </div>
          ) : mode === 'side-by-side' ? (
            <SideBySideDiff blocks={displayBlocks} />
          ) : (
            <UnifiedDiff blocks={displayBlocks} />
          )}
        </div>
        {showSummary && (
          <div className="w-70 shrink-0 border-l border-(--fd-border) bg-(--fd-navigator-bg) p-4 overflow-y-auto text-(--fd-text) font-[inherit] text-xs">
            <h4 className="m-0 mb-2.5 text-[13px] uppercase tracking-[0.04em] text-(--fd-text)">
              Summary
            </h4>
            <div className="flex items-center gap-2 py-1 text-(--fd-text-muted)">
              <span className="bg-[#10b981] px-2 py-px rounded-[3px] min-w-8 font-bold text-[11px] text-white text-center">
                +{diff.summary.totalAdded}
              </span>
              added
            </div>
            <div className="flex items-center gap-2 py-1 text-(--fd-text-muted)">
              <span className="bg-[#ef4444] px-2 py-px rounded-[3px] min-w-8 font-bold text-[11px] text-white text-center">
                −{diff.summary.totalDeleted}
              </span>
              deleted
            </div>
            <div className="flex items-center gap-2 py-1 text-(--fd-text-muted)">
              <span className="bg-[#f59e0b] px-2 py-px rounded-[3px] min-w-8 font-bold text-[11px] text-white text-center">
                ~{diff.summary.totalModified}
              </span>
              modified
            </div>
            {diff.summary.scenesChanged.length > 0 && (
              <>
                <h5 className="mt-4 mb-1.5 text-[11px] uppercase tracking-[0.04em] text-(--fd-text-muted)">
                  Scenes changed ({diff.summary.scenesChanged.length})
                </h5>
                <ul className="m-0 p-0 list-none">
                  {diff.summary.scenesChanged.slice(0, 20).map((s, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-1.5 py-0.75 text-[11px]"
                    >
                      {s}
                    </li>
                  ))}
                  {diff.summary.scenesChanged.length > 20 && (
                    <li className="flex items-center gap-1.5 py-0.75 text-[11px]">
                      <em>+{diff.summary.scenesChanged.length - 20} more</em>
                    </li>
                  )}
                </ul>
              </>
            )}
            {diff.summary.dialogueDelta.length > 0 && (
              <>
                <h5 className="mt-4 mb-1.5 text-[11px] uppercase tracking-[0.04em] text-(--fd-text-muted)">
                  Dialogue changes
                </h5>
                <ul className="m-0 p-0 list-none">
                  {diff.summary.dialogueDelta.map((d) => (
                    <li
                      key={d.character}
                      className="flex items-center gap-1.5 py-0.75 text-[11px]"
                    >
                      <strong>{d.character}</strong>
                      <span className="bg-[#10b981] px-2 py-px rounded-[3px] min-w-8 font-bold text-[11px] text-white text-center">
                        +{d.added}
                      </span>
                      <span className="bg-[#ef4444] px-2 py-px rounded-[3px] min-w-8 font-bold text-[11px] text-white text-center">
                        −{d.removed}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Side-by-side renderer ──────────────────────────────────────────────────

const SideBySideDiff: React.FC<{ blocks: DiffBlock[] }> = ({ blocks }) => (
  <div className="gap-3 grid grid-cols-2">
    <div className="flex flex-col gap-1">
      {blocks.map((b, i) => (
        <BlockView key={`a-${i}`} side="a" block={b} />
      ))}
    </div>
    <div className="flex flex-col gap-1">
      {blocks.map((b, i) => (
        <BlockView key={`b-${i}`} side="b" block={b} />
      ))}
    </div>
  </div>
)

// Screenplay element-specific spacing in diff blocks. Note: these classes
// (diff-el-*) style the diff view's own wrapper, not the real screenplay
// pagination elements (.scene-heading/.character/etc), so they're safe to
// express as plain utilities here.
const DIFF_BLOCK_BASE =
  'py-2 px-3 border-l-[3px] border-transparent rounded-sm relative min-h-[30px]'
const DIFF_TYPE_CLASSES: Record<DiffBlock['type'], string> = {
  added: 'bg-[rgba(16,185,129,0.08)] border-l-[#10b981]',
  deleted: 'bg-[rgba(239,68,68,0.08)] border-l-[#ef4444] opacity-70',
  modified: 'bg-[rgba(245,158,11,0.08)] border-l-[#f59e0b]',
  unchanged: 'opacity-55',
}
const DIFF_EL_CONTENT_CLASSES: Record<string, string> = {
  sceneHeading: 'font-bold uppercase',
  character: 'uppercase text-center ml-[2in]',
  dialogue: 'ml-[1in] mr-[1.5in]',
  transition: 'text-right',
  parenthetical: 'ml-[1.5in] italic',
}

const BlockView: React.FC<{ side: 'a' | 'b'; block: DiffBlock }> = ({
  side,
  block,
}) => {
  const showHere =
    block.type === 'unchanged' ||
    (side === 'a' && (block.type === 'deleted' || block.type === 'modified')) ||
    (side === 'b' && (block.type === 'added' || block.type === 'modified'))

  if (!showHere) {
    return <div className={`${DIFF_BLOCK_BASE} bg-black/2`} />
  }

  const text = side === 'a' ? block.oldText : block.newText
  const typeLabel = ELEMENT_LABEL[block.elementType] || block.elementType

  return (
    <div className={`${DIFF_BLOCK_BASE} ${DIFF_TYPE_CLASSES[block.type]}`}>
      <div className="mb-0.75 font-sans text-[#888] text-[9px] uppercase tracking-wider">
        {typeLabel}
      </div>
      <div
        className={`font-['Courier_New',Courier,monospace] whitespace-pre-wrap wrap-break-word ${DIFF_EL_CONTENT_CLASSES[block.elementType] || ''}`}
      >
        {block.type === 'modified' && block.wordDiffs ? (
          <WordDiffView diffs={block.wordDiffs} side={side} />
        ) : (
          <span>{text}</span>
        )}
      </div>
    </div>
  )
}

const WordDiffView: React.FC<{ diffs: WordDiff[]; side: 'a' | 'b' }> = ({
  diffs,
  side,
}) => (
  <>
    {diffs.map((d, i) => {
      if (d.kind === 'same') return <span key={i}>{d.text}</span>
      if (d.kind === 'removed' && side === 'a') {
        return (
          <span
            key={i}
            className="bg-[rgba(239,68,68,0.25)] text-[#888] line-through"
          >
            {d.text}
          </span>
        )
      }
      if (d.kind === 'added' && side === 'b') {
        return (
          <span
            key={i}
            className="bg-[rgba(16,185,129,0.3)] border-[#10b981] border-b-2 no-underline"
          >
            {d.text}
          </span>
        )
      }
      return null
    })}
  </>
)

// ── Unified renderer ──────────────────────────────────────────────────────

const UnifiedDiff: React.FC<{ blocks: DiffBlock[] }> = ({ blocks }) => (
  <div className="flex flex-col gap-1">
    {blocks.map((b, i) => {
      const typeLabel = ELEMENT_LABEL[b.elementType] || b.elementType
      const elClass = DIFF_EL_CONTENT_CLASSES[b.elementType] || ''
      if (b.type === 'unchanged') {
        return (
          <div
            key={i}
            className={`${DIFF_BLOCK_BASE} ${DIFF_TYPE_CLASSES.unchanged}`}
          >
            <div className="mb-0.75 font-sans text-[#888] text-[9px] uppercase tracking-wider">
              {typeLabel}
            </div>
            <div
              className={`font-['Courier_New',Courier,monospace] whitespace-pre-wrap wrap-break-word ${elClass}`}
            >
              {b.oldText}
            </div>
          </div>
        )
      }
      if (b.type === 'modified' && b.wordDiffs) {
        return (
          <div
            key={i}
            className={`${DIFF_BLOCK_BASE} ${DIFF_TYPE_CLASSES.modified}`}
          >
            <div className="mb-0.75 font-sans text-[#888] text-[9px] uppercase tracking-wider">
              {typeLabel} (modified)
            </div>
            <div
              className={`font-['Courier_New',Courier,monospace] whitespace-pre-wrap wrap-break-word ${elClass}`}
            >
              <WordDiffView diffs={b.wordDiffs} side="a" />
              {' → '}
              <WordDiffView diffs={b.wordDiffs} side="b" />
            </div>
          </div>
        )
      }
      if (b.type === 'deleted') {
        return (
          <div
            key={i}
            className={`${DIFF_BLOCK_BASE} ${DIFF_TYPE_CLASSES.deleted}`}
          >
            <div className="mb-0.75 font-sans text-[#888] text-[9px] uppercase tracking-wider">
              {typeLabel} (deleted)
            </div>
            <div
              className={`font-['Courier_New',Courier,monospace] whitespace-pre-wrap wrap-break-word ${elClass}`}
            >
              <del>{b.oldText}</del>
            </div>
          </div>
        )
      }
      return (
        <div
          key={i}
          className={`${DIFF_BLOCK_BASE} ${DIFF_TYPE_CLASSES.added}`}
        >
          <div className="mb-0.75 font-sans text-[#888] text-[9px] uppercase tracking-wider">
            {typeLabel} (added)
          </div>
          <div
            className={`font-['Courier_New',Courier,monospace] whitespace-pre-wrap wrap-break-word ${elClass}`}
          >
            {b.newText}
          </div>
        </div>
      )
    })}
  </div>
)

export default ScriptDiffView
