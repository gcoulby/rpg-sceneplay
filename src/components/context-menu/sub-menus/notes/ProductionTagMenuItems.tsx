import { ContextMenuItem } from '@/components/ui/context-menu'

interface ProductionTagMenuItemsProps {
  hasExistingTag: boolean
  onEdit: () => void
  onRemove: () => void
  onTagAs: () => void
}

export function ProductionTagMenuItems({ hasExistingTag, onEdit, onRemove, onTagAs }: ProductionTagMenuItemsProps) {
  if (hasExistingTag) {
    return (
      <>
        <ContextMenuItem onClick={onEdit}>Edit Tag...</ContextMenuItem>
        <ContextMenuItem onClick={onRemove}>Remove Tag</ContextMenuItem>
      </>
    )
  }

  return <ContextMenuItem onClick={onTagAs}>Tag as...</ContextMenuItem>
}
