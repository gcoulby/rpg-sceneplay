import {
  ContextMenuItem,
  ContextMenuShortcut,
} from '@/components/ui/context-menu'
import { modKey, shiftKey } from '../../constants'

interface ScriptNoteMenuItemsProps {
  existingNoteId: string | null
  onAdd: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ScriptNoteMenuItems({
  existingNoteId,
  onAdd,
  onEdit,
  onDelete,
}: ScriptNoteMenuItemsProps) {
  if (existingNoteId) {
    return (
      <>
        <ContextMenuItem onClick={onEdit}>Edit Script Note</ContextMenuItem>
        <ContextMenuItem onClick={onDelete}>Delete Script Note</ContextMenuItem>
      </>
    )
  }

  return (
    <ContextMenuItem onClick={onAdd}>
      Add Script Note
      <ContextMenuShortcut>
        {shiftKey}
        {modKey}N
      </ContextMenuShortcut>
    </ContextMenuItem>
  )
}
