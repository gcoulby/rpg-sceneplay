import { ContextMenuItem } from '@/components/ui/context-menu'

interface RollAnchorMenuItemsProps {
  existingRollAnchorId: string | null
  onOpenRollDialog: () => void
  onDelete: () => void
}

export function RollAnchorMenuItems({
  existingRollAnchorId,
  onOpenRollDialog,
  onDelete,
}: RollAnchorMenuItemsProps) {
  if (existingRollAnchorId) {
    return <ContextMenuItem onClick={onDelete}>Delete Roll</ContextMenuItem>
  }

  return <ContextMenuItem onClick={onOpenRollDialog}>Roll...</ContextMenuItem>
}
