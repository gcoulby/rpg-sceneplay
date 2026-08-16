import { useState } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import type { PdfEmbed } from '../types'

/**
 * Which PDF tab was last selected — pure UI convenience state, not document
 * content, so it lives in `localStorage` rather than the saved document
 * (mirrors the codebase's existing avoidance of `localStorage` for actual
 * document data, e.g. `idb.ts`'s size/durability reasoning — a single short
 * string per document is a different, fine, use of it).
 *
 * Keyed per-document so opening a second `.sceneplay` doesn't jump to a tab
 * id that belongs to a different document. Falls back to the first embed
 * when the stored id is missing or no longer exists in this document (e.g.
 * that tab was deleted since, or this is a different document).
 */
export function useLastSelectedTab(
  embeds: PdfEmbed[],
): [string, (id: string) => void] {
  const docId = useProjectStore((s) => s.currentDocId)
  const key = `pdf-viewer:lastTab:${docId ?? 'unsaved'}`

  const [storedKey, setStoredKey] = useState(key)
  const [storedId, setStoredId] = useState(
    () => localStorage.getItem(key) ?? '',
  )

  // The stored id is per-document — re-read it when the active document
  // changes rather than carrying over whatever the previous document had.
  // Adjusting state during render (React's sanctioned pattern for "reset
  // state when a prop/derived key changes") rather than in an effect, which
  // would commit the stale value for one render before correcting itself.
  if (key !== storedKey) {
    setStoredKey(key)
    setStoredId(localStorage.getItem(key) ?? '')
  }

  const setActiveId = (id: string) => {
    setStoredId(id)
    localStorage.setItem(key, id)
  }

  const sorted = [...embeds].sort((a, b) => a.order - b.order)
  const activeId = sorted.some((e) => e.id === storedId)
    ? storedId
    : (sorted[0]?.id ?? '')

  return [activeId, setActiveId]
}
