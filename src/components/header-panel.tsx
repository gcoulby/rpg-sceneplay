import { Menubar } from '@base-ui/react/menubar'
import {
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { Fragment } from 'react'
import { newScreenplay } from '@/actions/new-screenplay'
import { useEditorStore } from '@/stores/editorStore'
import { type HeaderMenuBarModel } from '@/types'
import {
  FaFileImport,
  FaPlus,
  FaRegFileCode,
  FaRegFileWord,
} from 'react-icons/fa'

export default function AppShell() {
  const editor = useEditorStore((s) => s.editor)
  const menus: Array<HeaderMenuBarModel> = [
    {
      title: 'File',
      groups: [
        {
          items: [
            {
              text: 'New Screenplay',
              icon: FaPlus,
              shortcut: '⌘N',
              action: () => {
                newScreenplay(editor)
              },
            },
            {
              text: 'Import',
              icon: FaFileImport,
              groups: [
                {
                  items: [
                    {
                      text: 'Final Draft / Open Draft / Fountain',
                      icon: FaRegFileCode,
                      action: () => {},
                    },
                    {
                      text: 'Microsoft Word',
                      icon: FaRegFileWord,
                      action: () => {},
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  return (
    <header className="px-4">
      <Menubar className="text-xs">
        <MenubarMenu>
          {menus.map((menu, i) => (
            <Fragment key={i}>
              <MenubarTrigger>{menu.title}</MenubarTrigger>
              <MenubarContent className="w-70">
                {menu.groups.map((group, j) => (
                  <Fragment key={j}>
                    <MenubarGroup key={j} className="w-full">
                      {group.items.map((item, k) => (
                        <Fragment key={k}>
                          {item.groups?.length && item.groups.length > 0 ? (
                            <MenubarSub>
                              <MenubarSubTrigger>
                                <item.icon size={25} /> {item.text}
                              </MenubarSubTrigger>
                              <MenubarSubContent>
                                {item.groups?.map((subGroup, l) => (
                                  <Fragment key={l}>
                                    <MenubarGroup key={l} className="w-full">
                                      {subGroup.items.map((subGroupItem, m) => (
                                        <Fragment key={m}>
                                          <MenubarItem
                                            onClick={subGroupItem.action}
                                          >
                                            <subGroupItem.icon size={25} />{' '}
                                            {subGroupItem.text}{' '}
                                            {subGroupItem.shortcut && (
                                              <MenubarShortcut>
                                                {subGroupItem.shortcut}
                                              </MenubarShortcut>
                                            )}
                                          </MenubarItem>
                                        </Fragment>
                                      ))}
                                    </MenubarGroup>
                                    {j < menu.groups.length - 1 && (
                                      <MenubarSeparator />
                                    )}
                                  </Fragment>
                                ))}
                              </MenubarSubContent>
                            </MenubarSub>
                          ) : (
                            <MenubarItem onClick={item.action}>
                              <item.icon size={25} /> {item.text}{' '}
                              {item.shortcut && (
                                <MenubarShortcut>
                                  {item.shortcut}
                                </MenubarShortcut>
                              )}
                            </MenubarItem>
                          )}
                        </Fragment>
                      ))}
                    </MenubarGroup>
                    {j < menu.groups.length - 1 && <MenubarSeparator />}
                  </Fragment>
                ))}
              </MenubarContent>
            </Fragment>
          ))}
        </MenubarMenu>
      </Menubar>
    </header>
  )
}
