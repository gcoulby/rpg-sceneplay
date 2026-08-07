import { useMemo } from 'react'
import { newScreenplay } from '@/actions/new-screenplay'
import { useEditorStore } from '@/stores/editorStore'
import { type HeaderMenuBarModel } from '@/types'
import { handleImport, handleImportDocx } from '@/actions/file-import'
import {
  handleExportDocx,
  handleExportFDX,
  handleExportFountain,
  handleExportOdraft,
  handleExportPDF,
} from '@/actions/file-export'
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
import { getShortcutModifier } from '@/utils/shortcutModifier'
import { docXImportNotice } from '@/components/docx-import-notice'
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
import {
  toggleBold,
  setFormatType,
  toggleItalic,
  toggleUnderline,
  toggleStrikethrough,
  toggleSubscript,
  toggleSuperscript,
  setAlignment,
  toggleDualDialogue,
} from '@/actions/format-actions'

interface UseHeaderMenusArgs {
  onOpenPageSetup: () => void
  onOpenGoToPage: () => void
  onOpenGrammarPanel: () => void
  onOpenSetMoresAndContdsOpen: () => void
  onTitlePageEditorOpen: () => void
  onScriptFormatEditorOpen: () => void
  onTemplateSelectOpen: () => void
}

export function useHeaderMenus({
  onOpenPageSetup,
  onOpenGoToPage,
  onOpenGrammarPanel,
  onOpenSetMoresAndContdsOpen,
  onTitlePageEditorOpen,
  onTemplateSelectOpen,
}: UseHeaderMenusArgs): HeaderMenuBarModel[] {
  const editor = useEditorStore((s) => s.editor)
  const setSearchOpen = useEditorStore((s) => s.setSearchOpen)
  const {
    spellCheckEnabled,
    toggleSpellCheck,
    grammarCheckEnabled,
    toggleGrammarCheck,
    setSpellCheckOpen,
    setWritingSuggestionsOpen,
  } = useEditorStore()

  const mod = getShortcutModifier()
  const locked = getLockedFormattingOption(editor)
  const { rules: activeTemplateRules, name: activeTemplateName } =
    getActiveTemplate()

  const activeTemplateRulesMenuItems = useMemo(() => {
    return [
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
            action: () => setFormatType(editor, r.id),
          }
        }),
    ]
  }, [editor, activeTemplateRules, mod])

  return useMemo<HeaderMenuBarModel[]>(
    () => [
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
            action: onOpenPageSetup,
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
            action: onOpenGoToPage,
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
                action: onOpenGrammarPanel,
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
            items: activeTemplateRulesMenuItems,
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
                action: () => toggleBold(editor),
                disabled: locked.bold,
              },
              {
                icon: FaItalic,
                label: 'Italic',
                shortcut: `${mod}I`,
                action: () => toggleItalic,
                disabled: locked.italic,
              },
              {
                icon: FaUnderline,
                label: 'Underline',
                shortcut: `${mod}U`,
                action: () => toggleUnderline,
                disabled: locked.underline,
              },
              {
                icon: FaStrikethrough,
                label: 'Strikethrough',
                action: () => toggleStrikethrough,
                disabled: locked.strikethrough,
              },
              { separator: true, label: '' },
              {
                icon: FaSubscript,
                label: 'Subscript',
                action: () => toggleSubscript,
                disabled: locked.subscript,
              },
              {
                icon: FaSuperscript,
                label: 'Superscript',
                action: () => toggleSuperscript,
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
                action: () => setAlignment(editor, 'left'),
                disabled: locked.textAlign,
              },
              {
                icon: FaAlignCenter,
                label: 'Align Center',
                action: () => setAlignment(editor, 'center'),
                disabled: locked.textAlign,
              },
              {
                icon: FaAlignRight,
                label: 'Align Right',
                action: () => setAlignment(editor, 'right'),
                disabled: locked.textAlign,
              },
              {
                icon: FaAlignJustify,
                label: 'Justify',
                action: () => setAlignment(editor, 'justify'),
                disabled: locked.textAlign,
              },
            ],
          },
          { separator: true, label: '' },
          {
            icon: FaColumns,
            label: 'Dual Dialogue',
            shortcut: `${mod}D`,
            action: () => toggleDualDialogue(editor),
          },
          { separator: true, label: '' },
          {
            icon: FaCommentDots,
            label: 'Mores & Continueds...',
            action: onOpenSetMoresAndContdsOpen,
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
            action: onTitlePageEditorOpen,
          },
          {
            icon: FaFileAlt,
            label: `Formatting Template (${activeTemplateName})...`,
            action: onTemplateSelectOpen,
            //   action: () => setTemplateSelectOpen(true),
          },
          {
            icon: FaFileAlt,
            label: 'Script Format Preferences...',
            //   action: () =>            setFormatPrefsOpen({ firstRun: false, afterSave: null }),
          },
        ],
      },
    ],
    [
      mod,
      onOpenPageSetup,
      onOpenGoToPage,
      spellCheckEnabled,
      toggleSpellCheck,
      grammarCheckEnabled,
      toggleGrammarCheck,
      onOpenGrammarPanel,
      activeTemplateRulesMenuItems,
      locked.bold,
      locked.italic,
      locked.underline,
      locked.strikethrough,
      locked.subscript,
      locked.superscript,
      locked.textAlign,
      onOpenSetMoresAndContdsOpen,
      onTitlePageEditorOpen,
      activeTemplateName,
      onTemplateSelectOpen,
      editor,
      setSearchOpen,
      setSpellCheckOpen,
      setWritingSuggestionsOpen,
    ],
  )
}
