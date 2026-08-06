import { Menubar } from '@base-ui/react/menubar'
import {
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { useState } from 'react'
import { newScreenplay } from '@/actions/new-screenplay'
import { useEditorStore } from '@/stores/editorStore'
import {
  type HeaderMenuBarItem,
  type HeaderMenuBarModel,
  type PendingAction,
} from '@/types'
import {
  FaCog,
  FaCopy,
  FaCut,
  FaEdit,
  FaFile,
  FaFileExport,
  FaFileImport,
  FaHashtag,
  FaMousePointer,
  FaPaste,
  FaPlus,
  FaRedo,
  FaRegFileCode,
  FaRegFileWord,
  FaSearch,
  FaUndo,
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
import PageSetupDialog from './plugins/page-setup/page-setup-dialog'
import { MenuItemRenderer } from './menu-item-renderer'
import SearchReplace from './plugins/search-replace/search-replace-comp'
import GoToPageDialog from './plugins/goto-page/goto-page-dialog'

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
  const setSearchOpen = useEditorStore((s) => s.setSearchOpen)
  const [pageSetupOpen, setPageSetupOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [goToPageOpen, setGoToPageOpen] = useState(false)
  const goToPage = useEditorStore((s) => s.goToPage)

  const mod = /mac|iphone|ipad|ipod/i.test(
    navigator.platform || navigator.userAgent,
  )
    ? '⌘'
    : 'Ctrl+'

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
      icon: FaFile,
      items: [
        {
          label: 'New Screenplay',
          icon: FaPlus,
          shortcut: `${mod}N`,
          confirmation: {},
          action: () => {
            newScreenplay(editor)
          },
        },
        { separator: true, label: '' },
        {
          label: 'Import',
          icon: FaFileImport,
          items: [
            {
              label: 'Final Draft / Open Draft / Fountain',
              icon: FaRegFileCode,
              action: () => {
                handleImport(editor)
              },
            },
            {
              label: 'Microsoft Word',
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
        {
          label: 'Export',
          icon: FaFileExport,

          items: [
            {
              label: 'Final Draft (.fdx)',
              icon: FaRegFileCode,
              action: () => {
                handleExportFDX(editor)
              },
            },
            {
              label: 'Fountain (.fountain)',
              icon: FaRegFileCode,
              action: () => {
                handleExportFountain(editor)
              },
            },
            {
              label: 'PDF',
              icon: FaRegFileCode,
              action: () => {
                handleExportPDF(editor)
              },
            },
            {
              label: 'Microsoft Word',
              icon: FaRegFileWord,
              action: () => {
                handleExportDocx(editor)
              },
            },
            {
              label: 'OpenDraft (.odraft)',
              icon: FaRegFileCode,
              action: () => {
                handleExportOdraft(editor)
              },
            },
          ],
        },

        { separator: true, label: '' },
        {
          label: 'Page Setup…',
          icon: FaCog, // or whatever icon
          action: () => setPageSetupOpen(true),
        },
      ],
    },
    {
      title: 'Edit',
      icon: FaEdit,
      items: [
        {
          label: 'undo',
          icon: FaUndo,
          shortcut: `${mod}Z`,
          action: () => {
            editor?.chain().focus().undo().run()
          },
        },
        {
          label: 'redo',
          icon: FaRedo,
          shortcut: `⇧${mod}Y`,
          action: () => {
            editor?.chain().focus().redo().run()
          },
        },
        { separator: true, label: '' },
        {
          icon: FaCut,
          label: 'Cut',
          shortcut: `${mod}X`,
          action: async () => {
            const selection = editor?.state.selection
            if (!selection) return
            const { from, to } = selection
            if (from === to) return // nothing selected

            const text = editor?.state.doc.textBetween(from, to, '\n')
            await navigator.clipboard.writeText(text)

            editor?.chain().focus().deleteRange({ from, to }).run()
          },
        },
        {
          icon: FaCopy,
          label: 'Copy',
          shortcut: `${mod}C`,
          action: async () => {
            const selection = editor?.state.selection
            if (!selection) return
            const { from, to } = selection
            const text = editor?.state.doc.textBetween(from, to, '\n')
            await navigator.clipboard.writeText(text)
          },
        },
        {
          icon: FaPaste,
          label: 'Paste',
          shortcut: `${mod}V`,
          action: async () => {
            if (!editor) return
            const text = await navigator.clipboard.readText()
            editor.chain().focus().insertContent(text).run()
          },
        },
        {
          icon: FaMousePointer,
          label: 'Select All',
          shortcut: `${mod}A`,
          action: () => editor?.chain().focus().selectAll().run(),
        },
        { separator: true, label: '' },
        {
          icon: FaSearch,
          label: 'Find & Replace',
          shortcut: `${mod}F`,
          action: () => setSearchOpen(true),
        },
        {
          icon: FaHashtag,
          label: 'Go to Page',
          shortcut: `${mod}G`,
          action: () => setGoToPageOpen(true),
        },
      ],
    },
  ]

  return (
    <header className="px-4">
      <Menubar className="flex flex-row gap-4 text-xs">
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
      <SearchReplace editor={editor} />
      <GoToPageDialog
        open={goToPageOpen}
        onOpenChange={setGoToPageOpen}
        onGoToPage={(page) => {
          goToPage?.(page)
          setGoToPageOpen(false)
        }}
      />
    </header>
  )
}
