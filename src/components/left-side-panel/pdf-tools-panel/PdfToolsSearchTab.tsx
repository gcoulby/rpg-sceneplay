import { useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { PdfPageText } from '@/components/screens/pdf-viewer/viewer/use-pdf-fulltext-index'

interface PdfToolsSearchTabProps {
  pages: PdfPageText[]
  loading: boolean
  onSelectPage: (page: number, highlightText?: string) => void
}

const SNIPPET_RADIUS = 60

/** Builds a `[start, end)` snippet around the first match range, so a hit
 *  buried on page 80 of a book doesn't require showing the whole page's
 *  text to see why it matched. */
function buildSnippet(text: string, matchStart: number, matchEnd: number) {
  const start = Math.max(0, matchStart - SNIPPET_RADIUS)
  const end = Math.min(text.length, matchEnd + SNIPPET_RADIUS)
  return {
    before: (start > 0 ? '…' : '') + text.slice(start, matchStart),
    match: text.slice(matchStart, matchEnd),
    after: text.slice(matchEnd, end) + (end < text.length ? '…' : ''),
  }
}

/** Full-document fuzzy search — distinct from the toolbar's "Find" (exact,
 *  in-page, pdfjs-native highlighting): this searches every page's
 *  extracted text at once and lists results with page numbers, since
 *  finding "which page had the encumbrance rules" is a different task than
 *  finding the next occurrence on the page you're already looking at. */
export default function PdfToolsSearchTab({
  pages,
  loading,
  onSelectPage,
}: PdfToolsSearchTabProps) {
  const [query, setQuery] = useState('')

  const fuse = useMemo(
    () =>
      new Fuse(pages, {
        keys: ['text'],
        includeMatches: true,
        ignoreLocation: true,
        threshold: 0.3,
        minMatchCharLength: 2,
      }),
    [pages],
  )

  const results = useMemo(() => {
    if (!query.trim()) return []
    return fuse.search(query).slice(0, 50)
  }, [fuse, query])

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="relative shrink-0">
        <Search className="top-1/2 left-2 absolute size-3.5 text-(--fd-text-muted) -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={loading ? 'Indexing pages…' : 'Search this PDF'}
          disabled={loading}
          className="pl-7 h-8 text-xs"
        />
      </div>

      {!loading && query.trim() && results.length === 0 && (
        <p className="py-4 text-(--fd-text-muted) text-xs text-center">
          No matches for &quot;{query}&quot;.
        </p>
      )}

      <div className="flex flex-col gap-1 overflow-y-auto">
        {results.map((result) => {
          const range = result.matches?.[0]?.indices?.[0]
          const snippet = range
            ? buildSnippet(result.item.text, range[0], range[1] + 1)
            : null
          return (
            <button
              key={result.item.page}
              type="button"
              onClick={() => onSelectPage(result.item.page, snippet?.match)}
              className="hover:bg-(--fd-overlay-subtle) px-2 py-1.5 border border-(--fd-border) rounded text-left"
            >
              <div className="mb-0.5 font-semibold text-(--fd-text-muted) text-[10px]">
                Page {result.item.page}
              </div>
              {snippet ? (
                <p className="text-xs leading-snug line-clamp-2">
                  {snippet.before}
                  <mark className="bg-(--fd-accent)/30 text-(--fd-text) rounded-xs">
                    {snippet.match}
                  </mark>
                  {snippet.after}
                </p>
              ) : (
                <p className="text-(--fd-text-muted) text-xs line-clamp-2">
                  {result.item.text.slice(0, 120)}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
