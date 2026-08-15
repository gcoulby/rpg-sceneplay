import {
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'
import type { ElementType } from '@/stores/editorStore'
import { getElementMenuItems } from '../../constants'
import type { ElementFormattingRule } from '../../types'

interface ElementTypeMenuProps {
  currentNodeType: ElementType
  activeTemplate: {
    rules: Partial<Record<ElementType, ElementFormattingRule>>
    elementMenuOrder?: string[]
  }
  onSelect: (type: ElementType) => void
}

export function ElementTypeMenu({
  currentNodeType,
  activeTemplate,
  onSelect,
}: ElementTypeMenuProps) {
  const visibleItems = getElementMenuItems(activeTemplate)

  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>Element</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        {visibleItems.map(({ type, label, shortcut }) => (
          <ContextMenuItem key={type} onClick={() => onSelect(type)}>
            {currentNodeType === type ? '✓ ' : ''}
            {label}
            {shortcut && <ContextMenuShortcut>{shortcut}</ContextMenuShortcut>}
          </ContextMenuItem>
        ))}
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}
