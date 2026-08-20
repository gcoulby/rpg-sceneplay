import { describe, it, expect } from 'vitest'
import { findBracketMatches, getOpenBracketFragment } from './itemBrackets'

describe('findBracketMatches', () => {
  it('finds a single bracketed item', () => {
    expect(findBracketMatches('the [torch] here')).toEqual([
      { start: 4, end: 11, itemKey: 'TORCH' },
    ])
  })

  it('normalizes case and trims whitespace', () => {
    expect(findBracketMatches('[ Rusty Torch ]')).toEqual([
      { start: 0, end: 15, itemKey: 'RUSTY TORCH' },
    ])
  })

  it('finds multiple items in one block', () => {
    expect(findBracketMatches('grab the [torch] and the [rope]')).toEqual([
      { start: 9, end: 16, itemKey: 'TORCH' },
      { start: 25, end: 31, itemKey: 'ROPE' },
    ])
  })

  it('ignores empty or whitespace-only brackets', () => {
    expect(findBracketMatches('nothing [ ] here [] either')).toEqual([])
  })

  it('returns nothing for text with no brackets', () => {
    expect(findBracketMatches('plain text')).toEqual([])
  })

  it('does not match across an unclosed bracket', () => {
    expect(findBracketMatches('an [open bracket with no close')).toEqual([])
  })
})

describe('getOpenBracketFragment', () => {
  it('returns the fragment typed after an open bracket', () => {
    const text = 'grab the [tor'
    expect(getOpenBracketFragment(text, text.length)).toEqual({
      start: 10,
      end: 13,
      fragment: 'tor',
    })
  })

  it('returns null when there is no open bracket', () => {
    expect(getOpenBracketFragment('grab the torch', 14)).toBeNull()
  })

  it('returns null once the bracket before the cursor is already closed', () => {
    const text = 'grab the [torch] and the '
    expect(getOpenBracketFragment(text, text.length)).toBeNull()
  })

  it('only considers text up to the cursor, not the whole line', () => {
    // cursor sits right after "[tor", the "ch]" after it is not typed yet
    const text = 'grab the [torch]'
    expect(getOpenBracketFragment(text, 13)).toEqual({
      start: 10,
      end: 13,
      fragment: 'tor',
    })
  })
})
