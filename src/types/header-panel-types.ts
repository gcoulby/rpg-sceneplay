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
}

export interface PendingAction {
  run: () => void
  config: ConfirmationConfig
}
