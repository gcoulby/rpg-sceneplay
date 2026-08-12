import {
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'
import { ELEMENT_LABELS, type ElementType } from '@/stores/editorStore'
import { ELEMENT_MENU_ITEMS } from '../../constants'
import type { ElementFormattingRule } from '../../types'

interface ElementTypeMenuProps {
  currentNodeType: ElementType
  activeTemplate: { rules: Partial<Record<ElementType, ElementFormattingRule>> }
  onSelect: (type: ElementType) => void
}

export function ElementTypeMenu({
  currentNodeType,
  activeTemplate,
  onSelect,
}: ElementTypeMenuProps) {
  const visibleItems = ELEMENT_MENU_ITEMS.filter(({ type }) => {
    const rule = activeTemplate.rules[type]
    return !rule || rule.enabled
  })

  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>Element</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        {visibleItems.map(({ type, shortcut }) => (
          <ContextMenuItem key={type} onClick={() => onSelect(type)}>
            {currentNodeType === type ? '✓ ' : ''}
            {ELEMENT_LABELS[type]}
            {shortcut && <ContextMenuShortcut>{shortcut}</ContextMenuShortcut>}
          </ContextMenuItem>
        ))}
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}
