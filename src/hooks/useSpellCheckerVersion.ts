import { useEffect, useState } from 'react'
import { spellChecker } from '@/editor/spellchecker'

/** Subscribe to spellChecker.onChange so React re-renders when its state changes. */
export function useSpellCheckerVersion(): number {
  const [v, setV] = useState(0)
  useEffect(() => spellChecker.onChange(() => setV((x) => x + 1)), [])
  return v
}
