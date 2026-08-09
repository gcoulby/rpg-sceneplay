import { useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { type HeaderMenuBarItem, type PendingAction } from '@/types'
import ConfirmationDialog from '../confirmation-dialog'
import PageSetupDialog from '@/components/plugins/page-setup/page-setup-dialog'
import SearchReplace from '@/components/plugins/search-replace/search-replace-comp'
import GoToPageDialog from '@/components/plugins/goto-page/goto-page-dialog'
import SpellCheckPopover from '@/components/plugins/spelling-and-grammar/spell-check-popover'
import WritingSuggestionsPopover from '@/components/plugins/spelling-and-grammar/writing-suggestions-popover'
import GrammarRulesPanel from '@/components/plugins/spelling-and-grammar/grammar-settings-dialog'
import { useHeaderMenus } from '@/components/header-panel/use-header-menu'
import MoresContdsDialog from '../plugins/mores-continued/mores-continued-dialog'
import TitlePageEditor from '../plugins/title-page-setup-dialog/title-page-editor'
import TemplateSelectDialog from '../plugins/template-editor/template-editor'
import AboutDialog from '../plugins/about/about-dialog'
import DiagnosticsDialog from '../plugins/diagnostics/diagnostics-dialog'
import { HeaderPanelMenuBar } from './header-panel-menubar'
import { HeaderPanelToolbar } from './toolbar/header-panel-toolbar'

export default function AppShell() {
  const editor = useEditorStore((s) => s.editor)
  const [pageSetupOpen, setPageSetupOpen] = useState(false)
  const [grammarPanelOpen, setGrammarPanelOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [goToPageOpen, setGoToPageOpen] = useState(false)
  const [moresContdsOpen, setMoresContdsOpen] = useState(false)
  const [titlePageEditorOpen, setTitlePageEditorOpen] = useState(false)
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)

  const [templateSelectOpen, setTemplateSelectOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)

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
    onTitlePageEditorOpen: () => setTitlePageEditorOpen(true),
    onTemplateSelectOpen: () => setTemplateSelectOpen(true),
    onAboutOpen: () => setAboutOpen(true),
    onDiagnosticsOpen: () => setDiagnosticsOpen(true),
  })

  return (
    <header className="p-0">
      <div className="flex flex-col gap-0">
        <HeaderPanelMenuBar menus={menus} runOrConfirm={runOrConfirm} />

        <HeaderPanelToolbar onOpenGoToPage={() => setGoToPageOpen(true)} />
      </div>

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
      <TitlePageEditor
        editor={editor}
        open={titlePageEditorOpen}
        onOpenChange={setTitlePageEditorOpen}
      />
      <TemplateSelectDialog
        editor={editor}
        open={templateSelectOpen}
        onOpenChange={setTemplateSelectOpen}
      />
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
      <DiagnosticsDialog
        open={diagnosticsOpen}
        onOpenChange={setDiagnosticsOpen}
      />
    </header>
  )
}
