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
  FaAlignCenter,
  FaAlignJustify,
  FaAlignLeft,
  FaAlignRight,
  FaBold,
  FaCog,
  FaColumns,
  FaCommentDots,
  FaCopy,
  FaCut,
  FaEdit,
  FaFile,
  FaFileAlt,
  FaFileExport,
  FaFileImport,
  FaHashtag,
  FaImage,
  FaItalic,
  FaListOl,
  FaMousePointer,
  FaPalette,
  FaPaste,
  FaPlus,
  FaRedo,
  FaRegFileCode,
  FaRegFileWord,
  FaSearch,
  FaSpellCheck,
  FaStrikethrough,
  FaSubscript,
  FaSuperscript,
  FaUnderline,
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
import PageSetupDialog from '@/components/plugins/page-setup/page-setup-dialog'
import { MenuItemRenderer } from './menu-item-renderer'
import SearchReplace from '@/components/plugins/search-replace/search-replace-comp'
import GoToPageDialog from '@/components/plugins/goto-page/goto-page-dialog'
import SpellCheckPopover from '@/components/plugins/spelling-and-grammar/spell-check-popover'
import WritingSuggestionsPopover from '@/components/plugins/spelling-and-grammar/writing-suggestions-popover'
import GrammarRulesPanel from '@/components/plugins/spelling-and-grammar/grammar-settings-dialog'
import {
  handleCopy,
  handleCut,
  handlePaste,
  handleRedo,
  handleSelectAll,
  handleUndo,
} from '@/actions/edit-actions'
import { getLockedFormattingOption } from '@/utils/lockedFormatting'
import { getActiveTemplate } from '@/utils/activeTemplate'

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
  const [grammarPanelOpen, setGrammarPanelOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [goToPageOpen, setGoToPageOpen] = useState(false)

  const goToPage = useEditorStore((s) => s.goToPage)
  const {
    spellCheckEnabled,
    toggleSpellCheck,
    grammarCheckEnabled,
    toggleGrammarCheck,
    setSpellCheckOpen,
    setWritingSuggestionsOpen,
  } = useEditorStore()

  const mod = /mac|iphone|ipad|ipod/i.test(
    navigator.platform || navigator.userAgent,
  )
    ? '⌘'
    : 'Ctrl+'

  const locked = getLockedFormattingOption(editor)
  const { rules: activeTemplateRules, name: activeTemplateName } =
    getActiveTemplate()

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
          action: () => handleUndo(editor),
        },
        {
          label: 'redo',
          icon: FaRedo,
          shortcut: `⇧${mod}Y`,
          action: () => handleRedo(editor),
        },
        { separator: true, label: '' },
        {
          icon: FaCut,
          label: 'Cut',
          shortcut: `${mod}X`,
          action: () => handleCut(editor),
        },
        {
          icon: FaCopy,
          label: 'Copy',
          shortcut: `${mod}C`,
          action: () => handleCopy(editor),
        },
        {
          icon: FaPaste,
          label: 'Paste',
          shortcut: `${mod}V`,
          action: () => handlePaste(editor),
        },
        {
          icon: FaMousePointer,
          label: 'Select All',
          shortcut: `${mod}A`,
          action: () => handleSelectAll(editor),
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
        { separator: true, label: '' },

        {
          icon: FaSpellCheck,
          label: 'Spelling & Grammar',
          items: [
            {
              icon: FaSpellCheck,
              label: spellCheckEnabled
                ? '\u2713 Auto Spell Check'
                : 'Auto Spell Check',
              action: toggleSpellCheck,
            },
            {
              icon: FaSpellCheck,
              label: 'Spell Check\u2026',
              shortcut: 'F7',
              action: () => setSpellCheckOpen(true),
            },
            { separator: true, label: '' },
            {
              icon: FaSpellCheck,
              label: grammarCheckEnabled
                ? '\u2713 Auto Writing Suggestions'
                : 'Auto Writing Suggestions',
              action: toggleGrammarCheck,
            },
            {
              icon: FaSpellCheck,
              label: 'Writing Suggestions\u2026',
              shortcut: '\u21e7F7',
              action: () => setWritingSuggestionsOpen(true),
            },
            {
              icon: FaSpellCheck,
              label: 'Grammar & Spelling Settings\u2026',
              action: () => setGrammarPanelOpen(true),
            },
          ],
        },
      ],
    },
    {
      title: 'Format',
      icon: FaPalette,
      items: [
        {
          icon: FaListOl,
          label: 'Element',
          items: [
            ...Object.values(activeTemplateRules)
              .filter((r) => r.enabled)
              .map((r) => {
                const shortcuts: Record<string, string> = {
                  sceneHeading: `${mod}1`,
                  action: `${mod}2`,
                  character: `${mod}3`,
                  dialogue: `${mod}4`,
                  parenthetical: `${mod}5`,
                  transition: `${mod}6`,
                  general: `${mod}7`,
                  shot: `${mod}8`,
                }
                return {
                  label: r.label,
                  shortcut: shortcuts[r.id],
                  action: () => editor?.chain().focus().setNode(r.id).run(),
                }
              }),
          ],
        },
        { separator: true, label: '' },
        {
          icon: FaBold,
          label: 'Style',
          items: [
            {
              icon: FaBold,
              label: 'Bold',
              shortcut: `${mod}B`,
              action: () =>
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleBold()
                  .run(),
              disabled: locked.bold,
            },
            {
              icon: FaItalic,
              label: 'Italic',
              shortcut: `${mod}I`,
              action: () =>
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleItalic()
                  .run(),
              disabled: locked.italic,
            },
            {
              icon: FaUnderline,
              label: 'Underline',
              shortcut: `${mod}U`,
              action: () =>
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleUnderline()
                  .run(),
              disabled: locked.underline,
            },
            {
              icon: FaStrikethrough,
              label: 'Strikethrough',
              action: () =>
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleStrike()
                  .run(),
              disabled: locked.strikethrough,
            },
            { separator: true, label: '' },
            {
              icon: FaSubscript,
              label: 'Subscript',
              action: () =>
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleSubscript()
                  .run(),
              disabled: locked.subscript,
            },
            {
              icon: FaSuperscript,
              label: 'Superscript',
              action: () =>
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .toggleSuperscript()
                  .run(),
              disabled: locked.superscript,
            },
          ],
        },
        {
          icon: FaAlignLeft,
          label: 'Alignment',
          items: [
            {
              icon: FaAlignLeft,
              label: 'Align Left',
              action: () =>
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .setTextAlign('left')
                  .run(),
              disabled: locked.textAlign,
            },
            {
              icon: FaAlignCenter,
              label: 'Align Center',
              action: () =>
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .setTextAlign('center')
                  .run(),
              disabled: locked.textAlign,
            },
            {
              icon: FaAlignRight,
              label: 'Align Right',
              action: () =>
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .setTextAlign('right')
                  .run(),
              disabled: locked.textAlign,
            },
            {
              icon: FaAlignJustify,
              label: 'Justify',
              action: () =>
                editor
                  ?.chain()
                  .focus(undefined, { scrollIntoView: false })
                  .setTextAlign('justify')
                  .run(),
              disabled: locked.textAlign,
            },
          ],
        },
        { separator: true, label: '' },
        {
          icon: FaColumns,
          label: 'Dual Dialogue',
          shortcut: `${mod}D`,
          action: () => editor?.commands?.toggleDualDialogue(),
        },
        { separator: true, label: '' },
        {
          icon: FaCommentDots,
          label: 'Mores & Continueds...',
          action: () => useEditorStore.getState().setMoresContdsOpen(true),
        },
        {
          icon: FaImage,
          label: 'Insert Image...',
          action: () => useEditorStore.getState().imageInsertHandler?.(),
        },
        { separator: true, label: '' },
        {
          icon: FaFileAlt,
          label: 'Title Page...',
          action: () => useEditorStore.getState().setTitlePageEditorOpen(true),
        },
        {
          icon: FaFileAlt,
          label: `Formatting Template (${activeTemplateName})...`,
          //   action: () => setTemplateSelectOpen(true),
        },
        {
          icon: FaFileAlt,
          label: 'Script Format Preferences...',
          //   action: () =>            setFormatPrefsOpen({ firstRun: false, afterSave: null }),
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
    </header>
  )
}
