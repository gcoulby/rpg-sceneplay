import {
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'
import { RETEXT_CATEGORY_META } from '@/editor/grammar/retextProvider'
import type { GrammarInfo } from '../../types'

interface GrammarSuggestionItemsProps {
  grammarInfo: GrammarInfo
  onApply: (suggestion: string) => void
  onIgnoreOnce: () => void
  onIgnoreRuleForDocument: () => void
  onDisableRule: () => void
}

export function GrammarSuggestionItems({
  grammarInfo,
  onApply,
  onIgnoreOnce,
  onIgnoreRuleForDocument,
  onDisableRule,
}: GrammarSuggestionItemsProps) {
  const categoryLabel =
    RETEXT_CATEGORY_META[
      grammarInfo.ruleId as keyof typeof RETEXT_CATEGORY_META
    ]?.label ?? grammarInfo.ruleId

  return (
    <>
      <ContextMenuLabel className="opacity-70 font-normal text-xs">
        {categoryLabel}: {grammarInfo.message}
      </ContextMenuLabel>
      {grammarInfo.suggestions.length > 0 ? (
        grammarInfo.suggestions.slice(0, 5).map((suggestion) => (
          <ContextMenuItem
            key={suggestion}
            className="font-semibold text-primary"
            onClick={() => onApply(suggestion)}
          >
            {suggestion}
          </ContextMenuItem>
        ))
      ) : (
        <ContextMenuItem disabled>No automatic replacement</ContextMenuItem>
      )}
      <ContextMenuItem onClick={onIgnoreOnce}>Ignore Once</ContextMenuItem>
      <ContextMenuItem onClick={onIgnoreRuleForDocument}>
        Ignore in Document
      </ContextMenuItem>
      <ContextMenuItem onClick={onDisableRule}>Disable Rule</ContextMenuItem>
      <ContextMenuSeparator />
    </>
  )
}
