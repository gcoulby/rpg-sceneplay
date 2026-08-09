import type { ReactNode } from 'react'
import type { LucideProps } from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import type { IconType } from 'react-icons/lib'
import type { ConfirmationConfig } from './dialog-types'

export type MenuIcon =
  | ForwardRefExoticComponent<
      Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
    >
  | IconType
export interface HeaderMenuBarModel {
  title: string
  icon: MenuIcon
  items: Array<HeaderMenuBarItem>
}

export interface HeaderMenuBarItem {
  label: string
  separator?: boolean
  icon?: MenuIcon
  shortcut?: string
  requireConfirmation?: boolean
  confirmation?: ConfirmationConfig
  action?: () => void
  items?: Array<HeaderMenuBarItem>
  disabled?: boolean
}

export interface PendingAction {
  run: () => void
  config: ConfirmationConfig
}

type ToolbarItemBase = {
  id: string
  label: string
  disabled?: boolean
}

export type ToolbarButtonItem = ToolbarItemBase & {
  kind: 'button'
  icon: IconType
  shortcut?: string
  action: () => void
  isActive?: boolean
}

export type ToolbarSelectItem = ToolbarItemBase & {
  kind: 'select'
  // null = mixed selection (multiple values under the current selection) —
  // renderer shows a disabled placeholder option, same as the old '—'.
  value: string | number | null
  options: Array<{ label: string; value: string | number }>
  onChange: (value: string | number) => void
}

export type ToolbarColorItem = ToolbarItemBase & {
  kind: 'color'
  icon: IconType
  value: string
  onChange: (color: string | null) => void
}

// Escape hatch for widgets that don't fit the shapes above (FontPicker's
// search+extraFonts UI, the editable-in-place zoom input). Deliberately
// narrow — reach for this only when button/select/color genuinely don't
// fit, not as a default.
export type ToolbarCustomItem = ToolbarItemBase & {
  kind: 'custom'
  render: () => ReactNode
}

export type ToolbarSeparatorItem = { id: string; kind: 'separator' }

export type ToolbarItem =
  | ToolbarButtonItem
  | ToolbarSelectItem
  | ToolbarColorItem
  | ToolbarCustomItem
  | ToolbarSeparatorItem
