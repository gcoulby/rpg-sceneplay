/**
 * The open document, held across a route change.
 *
 * Settings and the plugin routes are separate routes, so leaving the editor
 * unmounts ScreenplayEditor and destroys the ProseMirror document with it. The
 * autosaved copy in local storage is at most one tick old, but a document that
 * was never saved at all — a brand-new screenplay, or a file imported from disk
 * before the first autosave lands — would come back blank.
 *
 * This module keeps the last document in memory (never on disk — that is what
 * the storage providers are for) so the editor can put it back exactly as the
 * writer left it.
 *
 * The stash is identified by document id, and reading it consumes it, so a
 * document can never be restored into a context it did not come from.
 */

export interface SessionDoc {
  /** ProseMirror JSON of the document body. */
  doc: unknown;
  /** Id of the document this body belongs to; null for an unsaved draft. */
  docId: string | null;
}

let stash: SessionDoc | null = null;

export function stashSessionDoc(entry: SessionDoc): void {
  stash = entry;
}

/**
 * Take back the stashed document, but only when it belongs to the context asking
 * for it. A mismatch leaves the stash alone: the editor moved on to a different
 * document, and the stashed one may still be wanted if it comes back.
 */
export function takeSessionDoc(docId: string | null): unknown | null {
  if (!stash) return null;
  if (stash.docId !== docId) return null;
  const { doc } = stash;
  stash = null;
  return doc;
}

/**
 * Drop the stash. Called wherever the editor is deliberately reset — a new
 * screenplay, say — so an abandoned document can never reappear in a blank one
 * that happens to share its (null) id.
 */
export function clearSessionDoc(): void {
  stash = null;
}
