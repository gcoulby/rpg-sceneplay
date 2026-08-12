import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu'
import { modKey } from '../../constants'
import type { ActiveStyleStates, LockedFormatting } from '../../types'

export interface TextStyleMenuProps {
  activeStates: ActiveStyleStates
  locked: LockedFormatting
  onToggleBold: () => void
  onToggleItalic: () => void
  onToggleUnderline: () => void
  onToggleStrike: () => void
  onToggleSubscript: () => void
  onToggleSuperscript: () => void
  onToggleAllCaps: () => void
}

export function TextStyleMenu({
  activeStates,
  locked,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onToggleStrike,
  onToggleSubscript,
  onToggleSuperscript,
  onToggleAllCaps,
}: TextStyleMenuProps) {
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>Style</ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem disabled={locked.bold} onClick={onToggleBold}>
          {activeStates.bold ? '✓ ' : ''}Bold
          <ContextMenuShortcut>{modKey}B</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled={locked.italic} onClick={onToggleItalic}>
          {activeStates.italic ? '✓ ' : ''}Italic
          <ContextMenuShortcut>{modKey}I</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={locked.underline}
          onClick={onToggleUnderline}
        >
          {activeStates.underline ? '✓ ' : ''}Underline
          <ContextMenuShortcut>{modKey}U</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={locked.strikethrough}
          onClick={onToggleStrike}
        >
          {activeStates.strike ? '✓ ' : ''}Strikethrough
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={locked.subscript}
          onClick={onToggleSubscript}
        >
          {activeStates.subscript ? '✓ ' : ''}Subscript
        </ContextMenuItem>
        <ContextMenuItem
          disabled={locked.superscript}
          onClick={onToggleSuperscript}
        >
          {activeStates.superscript ? '✓ ' : ''}Superscript
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={locked.textTransform}
          onClick={onToggleAllCaps}
        >
          ALL CAPS
        </ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}
