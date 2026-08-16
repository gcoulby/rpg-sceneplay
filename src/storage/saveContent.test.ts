import { describe, it, expect } from 'vitest'
import { hasSaveableCollections } from './saveContent'

describe('hasSaveableCollections', () => {
  it('is false for a bare doc with no metadata at all', () => {
    expect(hasSaveableCollections({ type: 'doc', content: [] })).toBe(false)
  })

  it('is false when every collection key is present but empty', () => {
    expect(
      hasSaveableCollections({
        type: 'doc',
        content: [],
        _notes: [],
        _pdfEmbeds: [],
        _sheets: [],
        _map: null,
      }),
    ).toBe(false)
  })

  it('is true when a PDF has been imported, even with no prose', () => {
    // This is the exact shape that motivated this function: a document with
    // no text yet, but a real PDF embed — must count as saveable, or the
    // whole write gets skipped and the PDF silently never persists.
    expect(
      hasSaveableCollections({
        type: 'doc',
        content: [],
        _pdfEmbeds: [{ id: 'e1', fileName: 'sheet.pdf' }],
      }),
    ).toBe(true)
  })

  it('is true for a non-empty character sheet, notes, or map, independently', () => {
    expect(hasSaveableCollections({ _sheets: [{ id: 's1' }] })).toBe(true)
    expect(hasSaveableCollections({ _notes: [{ id: 'n1' }] })).toBe(true)
    expect(hasSaveableCollections({ _map: { id: 'm1' } })).toBe(true)
  })

  it('ignores settings/config keys that are always non-empty by default', () => {
    // _tagCategories and _pageLayout carry non-empty defaults regardless of
    // whether the user has touched anything — they must not make an
    // otherwise-untouched document look saveable.
    expect(
      hasSaveableCollections({
        _tagCategories: [{ id: 'general', name: 'General' }],
        _pageLayout: { size: 'letter' },
        _spellCheckEnabled: true,
      }),
    ).toBe(false)
  })

  it('is false for null/undefined content', () => {
    expect(hasSaveableCollections(null)).toBe(false)
    expect(hasSaveableCollections(undefined)).toBe(false)
  })
})
