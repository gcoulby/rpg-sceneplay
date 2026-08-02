import { Menubar } from '@base-ui/react/menubar'
import {
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { Fragment, useState } from 'react'
import { Plus } from 'lucide-react'
import { newScreenplay } from '@/actions/new-screenplay'
import { useEditorStore } from '@/stores/editorStore'

export default function AppShell() {
  const editor = useEditorStore((s) => s.editor)
  const [menus, setMenus] = useState([
    {
      title: 'File',
      groups: [
        {
          items: [
            {
              text: 'New Screenplay',
              icon: Plus,
              shortcut: '⌘N',
              action: () => newScreenplay(editor),
            },
          ],
        },
      ],
    },
  ])

  return (
    <Menubar className="text-xs">
      <MenubarMenu>
        {menus.map((menu, i) => (
          <Fragment key={i}>
            <MenubarTrigger>{menu.title}</MenubarTrigger>
            <MenubarContent>
              {menu.groups.map((group, j) => (
                <Fragment key={j}>
                  <MenubarGroup key={j}>
                    {group.items.map((item, k) => (
                      <MenubarItem key={k}>
                        <item.icon size={25} /> {item.text}{' '}
                        <MenubarShortcut>{item.shortcut}</MenubarShortcut>
                      </MenubarItem>
                    ))}
                  </MenubarGroup>
                  {j < menu.groups.length && <MenubarSeparator />}
                </Fragment>
              ))}
            </MenubarContent>
          </Fragment>
        ))}
      </MenubarMenu>
    </Menubar>
  )
}
