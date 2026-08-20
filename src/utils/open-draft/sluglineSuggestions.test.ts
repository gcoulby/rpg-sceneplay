import { describe, it, expect } from 'vitest'
import { getSlugSuggestionContext } from './sluglineSuggestions'

describe('getSlugSuggestionContext', () => {
  it('suggests prefixes before a space is typed', () => {
    const ctx = getSlugSuggestionContext('INT', [])
    expect(ctx).not.toBeNull()
    expect(ctx?.suggestions).toEqual(['INT.', 'INT./EXT.'])
    expect(ctx?.segmentStart).toBe(0)
    expect(ctx?.segmentEnd).toBe(3)
  })

  it('still suggests the longer INT./EXT. prefix once INT. is fully typed', () => {
    const ctx = getSlugSuggestionContext('INT.', [])
    expect(ctx?.suggestions).toEqual(['INT./EXT.'])
  })

  it('suggests nothing once the longest prefix is fully typed', () => {
    expect(getSlugSuggestionContext('INT./EXT.', [])).toBeNull()
  })

  it('suggests known locations once a prefix + space is typed', () => {
    const ctx = getSlugSuggestionContext('INT. COF', ['COFFEE SHOP', 'KITCHEN'])
    expect(ctx).not.toBeNull()
    expect(ctx?.suggestions).toEqual(['COFFEE SHOP'])
    expect(ctx?.segmentStart).toBe(5)
    expect(ctx?.segmentEnd).toBe(8)
  })

  it('does not suggest locations without a recognized prefix', () => {
    expect(getSlugSuggestionContext('COFFEE ', ['COFFEE SHOP'])).toBeNull()
  })

  it('suggests time of day once a dash separator is typed', () => {
    const ctx = getSlugSuggestionContext('INT. COFFEE SHOP - DA', [])
    expect(ctx).not.toBeNull()
    expect(ctx?.suggestions).toEqual(['DAY', 'DAWN'])
    expect(ctx?.segmentStart).toBe(19)
  })

  it('returns null once the typed fragment exactly matches a suggestion', () => {
    expect(getSlugSuggestionContext('INT. COFFEE SHOP - DAY', [])).toBeNull()
  })

  it('is case-insensitive when matching', () => {
    const ctx = getSlugSuggestionContext('int. coffee shop - nig', [])
    expect(ctx?.suggestions).toEqual(['NIGHT'])
  })
})
