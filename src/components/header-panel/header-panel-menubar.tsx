import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from '../ui/menubar'
import { MenuItemRenderer } from './menu-item-renderer'
import type { HeaderMenuBarItem, HeaderMenuBarModel } from '@/types'

interface HeaderPanelMenuBarProps {
  menus: Array<HeaderMenuBarModel>
  runOrConfirm: (item: HeaderMenuBarItem) => void
}

export const HeaderPanelMenuBar = ({
  menus,
  runOrConfirm,
}: HeaderPanelMenuBarProps) => {
  return (
    <Menubar className="flex flex-row gap-4 rounded-none h-7 text-xs">
      {menus.map((menu, i) => (
        <MenubarMenu key={i}>
          <MenubarTrigger className="gap-2">
            <menu.icon size={10} /> {menu.title}
          </MenubarTrigger>
          <MenubarContent className="w-70">
            {menu.items.map((item, k) => (
              <MenuItemRenderer key={k} item={item} onSelect={runOrConfirm} />
            ))}
          </MenubarContent>
        </MenubarMenu>
      ))}
    </Menubar>
  )
}
