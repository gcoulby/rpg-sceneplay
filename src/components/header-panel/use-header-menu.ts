import { useMemo } from 'react'
import { newScreenplay } from '@/actions/new-screenplay'
import { insertStarterText } from '@/actions/insert-starter-text'
import { useEditorStore } from '@/stores/editorStore'
import { useBrowserStorageStatusStore } from '@/stores/browserStorageStatusStore'
import { type HeaderMenuBarModel } from '@/types'
import type { StorageMode } from '@/storage/types'
import { handleImport, handleImportDocx } from '@/actions/file-import'
import {
  handleExportDocx,
  handleExportFDX,
  handleExportFountain,
  handleExportOdraft,
  handleExportSceneplay,
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
  FaAdjust,
  FaAlignCenter,
  FaAlignJustify,
  FaAlignLeft,
  FaAlignRight,
  FaBold,
  FaBook,
  FaCog,
  FaColumns,
  FaCommentDots,
  FaCopy,
  FaCut,
  FaEdit,
  FaExchangeAlt,
  FaEye,
  FaFile,
  FaFileAlt,
  FaFileExport,
  FaFileImport,
  FaFilm,
  FaHashtag,
  FaHighlighter,
  FaImage,
  FaInfo,
  FaInfoCircle,
  FaItalic,
  FaKeyboard,
  FaListOl,
  FaListUl,
  FaLock,
  FaMousePointer,
  FaPalette,
  FaPaste,
  FaPlus,
  FaRedo,
  FaRegFileCode,
  FaRegFileWord,
  FaSearch,
  FaSearchMinus,
  FaSearchPlus,
  FaSpellCheck,
  FaStethoscope,
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
import type { HelpTab } from '../help/HelpDialog'

interface UseHeaderMenusArgs {
  onOpenStorageDialog: () => void
  onSwitchStorageMode: (mode: StorageMode) => void
  onOpenPageSetup: () => void
  onOpenGoToPage: () => void
  onOpenGrammarPanel: () => void
  onOpenSetMoresAndContdsOpen: () => void
  onTitlePageEditorOpen: () => void
  onTemplateSelectOpen: () => void
  onAboutOpen: () => void
  onDiagnosticsOpen: () => void
  onOpenMapSettings: () => void
  onHelpOpen: (tab: HelpTab) => void
}

export function useHeaderMenus({
  onOpenStorageDialog,
  onSwitchStorageMode,
  onOpenPageSetup,
  onOpenGoToPage,
  onOpenGrammarPanel,
  onOpenSetMoresAndContdsOpen,
  onTitlePageEditorOpen,
  onTemplateSelectOpen,
  onAboutOpen,
  onDiagnosticsOpen,
  onOpenMapSettings,
  onHelpOpen,
}: UseHeaderMenusArgs): HeaderMenuBarModel[] {
  const editor = useEditorStore((s) => s.editor)
  const activeStorageMode = useBrowserStorageStatusStore((s) => s.mode)

  const {
    setSpellCheckOpen,
    setWritingSuggestionsOpen,
    notesVisible,
    setNotesVisible,
    tagsVisible,
    setTagsVisible,
    setSearchOpen,
    spellCheckEnabled,
    toggleSpellCheck,
    grammarCheckEnabled,
    toggleGrammarCheck,
    theme,
    setTheme,
    zoomLevel,
    setZoomLevel,
    sceneNumbersVisible,
    setSceneNumbersVisible,
    sceneNumbersLocked,
    setSceneNumbersLocked,
    // revisionMode,
    // setRevisionMode,
    //   documentTitle,
    //   pageLayout,
    //   setGoToPageOpen,
    //   setSpellModalOpen,
    //   setGrammarModalOpen,
    //   setGrammarRulesPanelOpen,
    //   setOpenFileOpen,
    //   setPostSaveAction,
    //   setSaveAsOpen,
    //   navPanelWidth,
    //   trackChangesEnabled,
    //   setTrackChangesEnabled,
    //   setTrackChangesLabel,
    //   setCompareVersionOpen,
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
          {
            label: 'Add Starter Text',
            icon: FaFileAlt,
            action: () => {
              insertStarterText(editor)
            },
          },
          {
            label: 'Open…',
            icon: FaFile,
            action: onOpenStorageDialog,
          },
          {
            label: 'Switch Storage',
            icon: FaExchangeAlt,
            items: [
              {
                label: 'Browser',
                icon: FaFile,
                disabled: activeStorageMode === 'browser',
                action: () => onSwitchStorageMode('browser'),
              },
              {
                label: 'Disk Persistence',
                icon: FaFile,
                disabled: activeStorageMode === 'disk',
                action: () => onSwitchStorageMode('disk'),
              },
              {
                label: 'No Persistence',
                icon: FaFile,
                disabled: activeStorageMode === 'memory',
                action: () => onSwitchStorageMode('memory'),
              },
            ],
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
                label: 'Sceneplay (.sceneplay)',
                icon: FaRegFileCode,
                action: () => {
                  handleExportSceneplay(editor)
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
          {
            label: 'Map Settings…',
            icon: FaCog,
            action: onOpenMapSettings,
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
            disabled:
              !editor ||
              typeof editor.can().undo !== 'function' ||
              !editor.can().undo(),
          },
          {
            label: 'redo',
            icon: FaRedo,
            shortcut: `⇧${mod}Y`,
            action: () => handleRedo(editor),
            disabled:
              !editor ||
              typeof editor.can().redo !== 'function' ||
              !editor.can().redo(),
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
          },
        ],
      },
      {
        title: 'View',
        icon: FaEye,
        items: [
          {
            icon: FaHighlighter,
            label: 'Highlights',
            items: [
              {
                icon: FaHighlighter,
                label: notesVisible
                  ? '\u2713 Note Highlights'
                  : 'Note Highlights',
                action: () => setNotesVisible(!notesVisible),
              },
              {
                icon: FaHighlighter,
                label: tagsVisible ? '\u2713 Tag Highlights' : 'Tag Highlights',
                action: () => setTagsVisible(!tagsVisible),
              },
            ],
          },

          { separator: true, label: '' },
          {
            icon: FaFilm,
            label: 'Scene Numbers',
            items: [
              {
                icon: FaListUl,
                label: sceneNumbersVisible
                  ? '\u2713 Show Scene Numbers'
                  : 'Show Scene Numbers',
                action: () => setSceneNumbersVisible(!sceneNumbersVisible),
              },
              {
                icon: FaLock,
                label: sceneNumbersLocked
                  ? '\u2713 Lock Scene Numbers'
                  : 'Lock Scene Numbers',
                action: () => setSceneNumbersLocked(!sceneNumbersLocked),
                disabled: !sceneNumbersVisible,
              },
            ],
          },
          { separator: true, label: '' },
          {
            icon: FaAdjust,
            label: theme === 'light' ? '\u2713 Light Theme' : 'Light Theme',
            action: () => setTheme(theme === 'light' ? 'dark' : 'light'),
          },
          { separator: true, label: '' },

          {
            icon: FaSearchPlus,
            label: `Zoom (${zoomLevel}%)`,
            items: [
              {
                icon: FaSearchPlus,
                label: 'Zoom In',
                shortcut: `${mod}+`,
                action: () => setZoomLevel(Math.min(300, zoomLevel + 10)),
              },
              {
                icon: FaSearchMinus,
                label: 'Zoom Out',
                shortcut: `${mod}−`,
                action: () => setZoomLevel(Math.max(50, zoomLevel - 10)),
              },
              { separator: true, label: '' },
              {
                label: zoomLevel === 50 ? '\u2713 50%' : '50%',
                action: () => setZoomLevel(50),
              },
              {
                label: zoomLevel === 75 ? '\u2713 75%' : '75%',
                action: () => setZoomLevel(75),
              },
              {
                label: zoomLevel === 100 ? '\u2713 100%' : '100%',
                action: () => setZoomLevel(100),
              },
              {
                label: zoomLevel === 125 ? '\u2713 125%' : '125%',
                action: () => setZoomLevel(125),
              },
              {
                label: zoomLevel === 150 ? '\u2713 150%' : '150%',
                action: () => setZoomLevel(150),
              },
              {
                label: zoomLevel === 200 ? '\u2713 200%' : '200%',
                action: () => setZoomLevel(200),
              },
              {
                label: zoomLevel === 300 ? '\u2713 300%' : '300%',
                action: () => setZoomLevel(300),
              },
            ],
          },
        ],
      },
      {
        title: 'Help',
        icon: FaInfo,
        items: [
          {
            icon: FaInfoCircle,
            label: 'About RPG Sceneplay',
            action: onAboutOpen,
          },
          {
            icon: FaBook,
            label: 'Help Guide',
            action: () => onHelpOpen('overview'),
          },
          {
            icon: FaKeyboard,
            label: 'Keyboard Shortcuts',
            action: () => onHelpOpen('shortcuts'),
          },
          {
            icon: FaStethoscope,
            label: 'Diagnostics',
            action: onDiagnosticsOpen,
          },
        ],
      },
    ],
    [
      mod,
      onOpenStorageDialog,
      onSwitchStorageMode,
      activeStorageMode,
      onOpenPageSetup,
      editor,
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
      notesVisible,
      tagsVisible,
      sceneNumbersVisible,
      sceneNumbersLocked,
      theme,
      zoomLevel,
      onAboutOpen,
      onDiagnosticsOpen,
      onOpenMapSettings,
      onHelpOpen,
      setSearchOpen,
      setSpellCheckOpen,
      setWritingSuggestionsOpen,
      setNotesVisible,
      setTagsVisible,
      setSceneNumbersVisible,
      setSceneNumbersLocked,
      setTheme,
      setZoomLevel,
    ],
  )
}
