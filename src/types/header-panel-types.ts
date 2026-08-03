import type { LucideProps } from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import type { IconType } from 'react-icons/lib'

export interface HeaderMenuBarModel {
  title: string
  groups: Array<HeaderMenuBarGroup>
}

export interface HeaderMenuBarGroup {
  items: Array<HeaderMenuBarItem>
}

export interface HeaderMenuBarItem {
  text: string
  icon:
    | ForwardRefExoticComponent<
        Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
      >
    | IconType
  shortcut?: string
  action?: () => void
  groups?: Array<HeaderMenuBarGroup>
}
