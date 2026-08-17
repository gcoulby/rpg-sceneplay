/**
 * Some PDFs (character sheets, rulebooks) link roll callouts straight to a
 * Google search for the expression, e.g.
 * `https://www.google.com/search?q=roll+2d20&sca_esv=...`. Recognizing that
 * pattern lets the PDF link hijack open the app's own dice roller instead of
 * leaving the document to a web search.
 */
const GOOGLE_ROLL_PREFIX = 'https://www.google.com/search?q=roll+'

/** Returns the roll expression (e.g. `"2d20"`) if `href` is a Google-search
 *  roll link, otherwise null. */
export function extractGoogleRollFormula(href: string): string | null {
  if (!href.startsWith(GOOGLE_ROLL_PREFIX)) return null
  let query: string | null
  try {
    query = new URL(href).searchParams.get('q')
  } catch {
    return null
  }
  if (!query) return null
  const match = /^roll\s+(.+)$/i.exec(query.trim())
  return match ? match[1].trim() : null
}
