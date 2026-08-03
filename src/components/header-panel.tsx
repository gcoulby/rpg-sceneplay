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
import { Fragment, useState } from 'react'
import { newScreenplay } from '@/actions/new-screenplay'
import { useEditorStore } from '@/stores/editorStore'
import { type HeaderMenuBarModel } from '@/types'
import {
  FaFileImport,
  FaPlus,
  FaRegFileCode,
  FaRegFileWord,
} from 'react-icons/fa'
import ConfirmationDialog from './confirmation-dialog'

export default function AppShell() {
  const editor = useEditorStore((s) => s.editor)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const runOrConfirm = (item: HeaderMenuBarModel['groups'][0]['items'][0]) => {
    if (item.requireConfirmation) {
      setPendingAction(() => item.action)
    } else {
      if (item.action) item.action()
    }
  }
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
              requireConfirmation: true,
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
                                            onClick={() =>
                                              runOrConfirm(subGroupItem)
                                            }
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
                            <MenubarItem onClick={() => runOrConfirm(item)}>
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
      <ConfirmationDialog
        open={pendingAction !== null}
        description="Any unsaved changes will be lost."
        onConfirm={() => {
          pendingAction?.()
          setPendingAction(null)
        }}
        onCancel={() => setPendingAction(null)}
      />
    </header>
  )
}
