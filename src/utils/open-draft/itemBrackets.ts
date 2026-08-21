/**
 * Pure text-scanning half of the `[item]` tracking feature — kept separate
 * from ScreenplayEditor.tsx's `item` mark sync effect (which does the
 * ProseMirror position math) so the actual bracket-matching rule is
 * unit-testable without a full editor instance.
 */

export interface BracketMatch {
  /** Character offset within the block's text where the match starts (the `[`). */
  start: number
  /** Character offset where it ends (exclusive — just after the `]`). */
  end: number
  /** Normalized (trimmed, uppercased) text between the brackets. */
  itemKey: string
}

const BRACKET_RE = /\[([^[\]]+)\]/g

export interface OpenBracketFragment {
  /** Character offset where the fragment starts (right after the `[`). */
  start: number
  /** Character offset where it ends — always the cursor position. */
  end: number
  /** Whatever's been typed between `[` and the cursor so far. */
  fragment: string
}

/**
 * Finds the currently-open, not-yet-closed `[...` bracket the cursor is
 * inside of, if any — the trigger condition for item-name autocomplete
 * (suggesting known gear item names as you type `[`). Distinct from
 * `findBracketMatches` above, which only recognizes *completed* `[...]`
 * pairs for mark syncing.
 */
export function getOpenBracketFragment(
  text: string,
  cursorOffset: number,
): OpenBracketFragment | null {
  const before = text.slice(0, cursorOffset)
  const lastOpen = before.lastIndexOf('[')
  if (lastOpen === -1) return null
  const afterOpen = before.slice(lastOpen + 1)
  if (afterOpen.includes(']')) return null // already closed before the cursor
  return { start: lastOpen + 1, end: cursorOffset, fragment: afterOpen }
}

/**
 * Finds every `[...]` span in a block's text. Empty brackets (`[]`) and
 * brackets containing only whitespace produce no match — nothing to track.
 */
export function findBracketMatches(text: string): BracketMatch[] {
  const matches: BracketMatch[] = []
  BRACKET_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = BRACKET_RE.exec(text))) {
    const itemKey = m[1].trim().toUpperCase()
    if (itemKey) {
      matches.push({ start: m.index, end: m.index + m[0].length, itemKey })
    }
  }
  return matches
}
