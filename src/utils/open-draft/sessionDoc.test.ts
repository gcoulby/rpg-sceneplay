import { describe, it, expect, beforeEach } from 'vitest';
import { stashSessionDoc, takeSessionDoc, clearSessionDoc } from './sessionDoc';

const DOC = { type: 'doc', content: [{ type: 'action' }] };

describe('sessionDoc', () => {
  beforeEach(() => clearSessionDoc());

  it('returns nothing when nothing was stashed', () => {
    expect(takeSessionDoc(null)).toBeNull();
  });

  it('round-trips a document for the same context', () => {
    stashSessionDoc({ doc: DOC, docId: 'd1' });
    expect(takeSessionDoc('d1')).toEqual(DOC);
  });

  it('handles an unsaved document with no id', () => {
    stashSessionDoc({ doc: DOC, docId: null });
    expect(takeSessionDoc(null)).toEqual(DOC);
  });

  it('consumes the stash so it cannot be restored twice', () => {
    stashSessionDoc({ doc: DOC, docId: 'd1' });
    expect(takeSessionDoc('d1')).toEqual(DOC);
    expect(takeSessionDoc('d1')).toBeNull();
  });

  it('refuses a different document, and leaves the stash intact', () => {
    stashSessionDoc({ doc: DOC, docId: 'd1' });
    expect(takeSessionDoc('d2')).toBeNull();
    expect(takeSessionDoc(null)).toBeNull();
    // Still there for the document it came from.
    expect(takeSessionDoc('d1')).toEqual(DOC);
  });

  it('forgets the document when cleared', () => {
    stashSessionDoc({ doc: DOC, docId: null });
    clearSessionDoc();
    expect(takeSessionDoc(null)).toBeNull();
  });
});
