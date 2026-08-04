import type { HeaderMenuBarItem } from '@/types'
import {
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
} from './ui/menubar'

export function MenuItemRenderer({
  item,
  onSelect,
}: {
  item: HeaderMenuBarItem
  onSelect: (item: HeaderMenuBarItem) => void
}) {
  if (item.separator) {
    return <MenubarSeparator />
  }

  if (item.items?.length) {
    return (
      <MenubarSub>
        <MenubarSubTrigger>
          {item.icon && <item.icon size={25} />} {item.label}
        </MenubarSubTrigger>
        <MenubarSubContent>
          {item.items.map((subItem, i) => (
            <MenuItemRenderer key={i} item={subItem} onSelect={onSelect} />
          ))}
        </MenubarSubContent>
      </MenubarSub>
    )
  }

  return (
    <MenubarItem onClick={() => onSelect(item)}>
      {item.icon && <item.icon size={25} />} {item.label}{' '}
      {item.shortcut && <MenubarShortcut>{item.shortcut}</MenubarShortcut>}
    </MenubarItem>
  )
}
