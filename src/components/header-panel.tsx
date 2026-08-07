import { Menubar } from '@base-ui/react/menubar'
import {
  MenubarContent,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { type HeaderMenuBarItem, type PendingAction } from '@/types'
import ConfirmationDialog from './confirmation-dialog'
import PageSetupDialog from '@/components/plugins/page-setup/page-setup-dialog'
import { MenuItemRenderer } from './menu-item-renderer'
import SearchReplace from '@/components/plugins/search-replace/search-replace-comp'
import GoToPageDialog from '@/components/plugins/goto-page/goto-page-dialog'
import SpellCheckPopover from '@/components/plugins/spelling-and-grammar/spell-check-popover'
import WritingSuggestionsPopover from '@/components/plugins/spelling-and-grammar/writing-suggestions-popover'
import GrammarRulesPanel from '@/components/plugins/spelling-and-grammar/grammar-settings-dialog'
import { useHeaderMenus } from '@/hooks/use-header-menu'
import MoresContdsDialog from './plugins/mores-continued/mores-continued-dialog'

export default function AppShell() {
  const editor = useEditorStore((s) => s.editor)
  const [pageSetupOpen, setPageSetupOpen] = useState(false)
  const [grammarPanelOpen, setGrammarPanelOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [goToPageOpen, setGoToPageOpen] = useState(false)
  const [moresContdsOpen, setMoresContdsOpen] = useState(false)

  const goToPage = useEditorStore((s) => s.goToPage)

  const runOrConfirm = (item: HeaderMenuBarItem) => {
    if (!item.action) return
    if (item.confirmation) {
      setPendingAction({ run: item.action, config: item.confirmation })
    } else {
      item.action()
    }
  }

  const menus = useHeaderMenus({
    onOpenPageSetup: () => setPageSetupOpen(true),
    onOpenGoToPage: () => setGoToPageOpen(true),
    onOpenGrammarPanel: () => setGrammarPanelOpen(true),
    onOpenSetMoresAndContdsOpen: () => setMoresContdsOpen(true),
  })

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
      <GrammarRulesPanel
        open={grammarPanelOpen}
        onOpenChange={setGrammarPanelOpen}
      />
      <SearchReplace editor={editor} />
      <GoToPageDialog
        open={goToPageOpen}
        onOpenChange={setGoToPageOpen}
        onGoToPage={(page) => {
          goToPage?.(page)
          setGoToPageOpen(false)
        }}
      />
      <SpellCheckPopover editor={editor} />
      <WritingSuggestionsPopover editor={editor} />
      <MoresContdsDialog
        open={moresContdsOpen}
        onOpenChange={setMoresContdsOpen}
      />
    </header>
  )
}
