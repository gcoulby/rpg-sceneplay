import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'
import { modKey, shiftKey } from '../../constants'

interface EditActionsMenuProps {
  hasSelection: boolean
  onUndo: () => void
  onRedo: () => void
  onCut: () => void
  onCopy: () => void
  onPaste: () => void
  onPasteWithoutFormatting: () => void
  onSelectAll: () => void
  onDelete: () => void
}

export function EditActionsMenu({
  hasSelection,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onPasteWithoutFormatting,
  onSelectAll,
  onDelete,
}: EditActionsMenuProps) {
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>Edit</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem onClick={onUndo}>
          Undo
          <ContextMenuShortcut>{modKey}Z</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onRedo}>
          Redo
          <ContextMenuShortcut>
            {shiftKey}
            {modKey}Z
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={!hasSelection} onClick={onCut}>
          Cut
          <ContextMenuShortcut>{modKey}X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled={!hasSelection} onClick={onCopy}>
          Copy
          <ContextMenuShortcut>{modKey}C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onPaste}>
          Paste
          <ContextMenuShortcut>{modKey}V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onPasteWithoutFormatting}>
          Paste Without Formatting
          <ContextMenuShortcut>
            {shiftKey}
            {modKey}V
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onSelectAll}>
          Select All
          <ContextMenuShortcut>{modKey}A</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled={!hasSelection} onClick={onDelete}>
          Delete
        </ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}
