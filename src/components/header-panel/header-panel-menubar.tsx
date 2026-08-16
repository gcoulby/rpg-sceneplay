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
    <div className="overflow-x-auto overflow-y-hidden no-scrollbar shrink-0">
      <Menubar className="flex flex-row flex-nowrap gap-1 sm:gap-2 md:gap-4 rounded-none h-7 text-xs w-max min-w-full">
        {menus.map((menu, i) => (
          <MenubarMenu key={i}>
            <MenubarTrigger className="gap-2 whitespace-nowrap">
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
    </div>
  )
}
