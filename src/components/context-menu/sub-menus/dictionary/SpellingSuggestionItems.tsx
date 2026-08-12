import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'
import type { SpellInfo } from '../../types'

interface SpellingSuggestionItemsProps {
  spellInfo: SpellInfo
  onApply: (suggestion: string) => void
}

export function SpellingSuggestionItems({
  spellInfo,
  onApply,
}: SpellingSuggestionItemsProps) {
  return (
    <>
      {spellInfo.suggestions.length > 0 ? (
        spellInfo.suggestions.slice(0, 5).map((suggestion) => (
          <ContextMenuItem
            key={suggestion}
            className="font-semibold text-primary"
            onClick={() => onApply(suggestion)}
          >
            {suggestion}
          </ContextMenuItem>
        ))
      ) : (
        <ContextMenuItem disabled>No suggestions</ContextMenuItem>
      )}
      <ContextMenuSeparator />
    </>
  )
}
