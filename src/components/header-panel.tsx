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
import {
  type HeaderMenuBarItem,
  type HeaderMenuBarModel,
  type PendingAction,
} from '@/types'
import {
  FaCog,
  FaFileExport,
  FaFileImport,
  FaPlus,
  FaRegFileCode,
  FaRegFileWord,
} from 'react-icons/fa'
import ConfirmationDialog from './confirmation-dialog'
import { handleImport, handleImportDocx } from '@/actions/file-import'
import {
  handleExportDocx,
  handleExportFDX,
  handleExportFountain,
  handleExportOdraft,
  handleExportPDF,
} from '@/actions/file-export'
import PageSetupDialog from './page-setup-dialog'

const docXImportNotice = (
  <div className="flex flex-col gap-5">
    <p>
      OpenDraft will detect screenplay element types (scene heading, action,
      character, dialogue, parenthetical, transition, etc.) from the Word
      document's formatting.
    </p>
    <p>
      Detection is best-effort and depends on consistent formatting being
      applied throughout the document. Results will be accurate if you used:
    </p>
    <p>
      Final Draft, Fade In, Trelby, or Highland style names, OR Standard Final
      Draft indents (Action 1.5", Character 3.5", Dialogue 2.5", Parenthetical
      3.0"), OR Conventional text patterns (INT./EXT., ALL-CAPS character cues,
      "CUT TO:" transitions).
    </p>
  </div>
)

export default function AppShell() {
  const editor = useEditorStore((s) => s.editor)
  const [pageSetupOpen, setPageSetupOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const runOrConfirm = (item: HeaderMenuBarItem) => {
    if (!item.action) return
    if (item.confirmation) {
      setPendingAction({ run: item.action, config: item.confirmation })
    } else {
      item.action()
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
              confirmation: {},
              action: () => {
                newScreenplay(editor)
              },
            },
          ],
        },
        {
          items: [
            {
              text: 'Import',
              icon: FaFileImport,
              groups: [
                {
                  items: [
                    {
                      text: 'Final Draft / Open Draft / Fountain',
                      icon: FaRegFileCode,
                      action: () => {
                        handleImport(editor)
                      },
                    },
                    {
                      text: 'Microsoft Word',
                      icon: FaRegFileWord,
                      confirmation: {
                        title: 'Notice',
                        description: docXImportNotice,
                      },
                      action: () => {
                        handleImportDocx(editor)
                      },
                    },
                  ],
                },
              ],
            },
            {
              text: 'Export',
              icon: FaFileExport,
              groups: [
                {
                  items: [
                    {
                      text: 'Final Draft (.fdx)',
                      icon: FaRegFileCode,
                      action: () => {
                        handleExportFDX(editor)
                      },
                    },
                    {
                      text: 'Fountain (.fountain)',
                      icon: FaRegFileCode,
                      action: () => {
                        handleExportFountain(editor)
                      },
                    },
                    {
                      text: 'PDF',
                      icon: FaRegFileCode,
                      action: () => {
                        handleExportPDF(editor)
                      },
                    },
                    {
                      text: 'Microsoft Word',
                      icon: FaRegFileWord,
                      action: () => {
                        handleExportDocx(editor)
                      },
                    },
                    {
                      text: 'OpenDraft (.odraft)',
                      icon: FaRegFileCode,
                      action: () => {
                        handleExportOdraft(editor)
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          items: [
            {
              text: 'Page Setup…',
              icon: FaCog, // or whatever icon
              action: () => setPageSetupOpen(true),
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
        {...pendingAction?.config}
        onConfirm={() => {
          pendingAction?.run()
          setPendingAction(null)
        }}
        onCancel={() => setPendingAction(null)}
      />
      <PageSetupDialog open={pageSetupOpen} onOpenChange={setPageSetupOpen} />
    </header>
  )
}
