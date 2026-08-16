import { useCallback, useEffect, useMemo, useState } from 'react'
import { useEditorStore } from '@/stores/editorStore'
import { useFormattingTemplateStore } from '@/stores/formattingTemplateStore'
import { BUILT_IN_ELEMENT_IDS } from '@/stores/formattingTypes'
import { getElementMenuItems } from '@/components/context-menu/constants'
import { handleUndo, handleRedo } from '@/actions/edit-actions'
import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrikethrough,
  toggleSubscript,
  toggleSuperscript,
  setAlignment,
} from '@/actions/format-actions'
import { getLockedFormattingOption } from '@/utils/lockedFormatting'
import { getShortcutModifier } from '@/utils/shortcutModifier'
import { FONT_REGISTRY, loadFont } from '@/utils/open-draft/fonts'
import { useCursorFormatting } from './use-cursor-formatting'

const AV_CELL_ELEMENT_IDS = ['avPara', 'avShot', 'avDirection']
const DEFAULT_FONTS = [
  'Courier Final Draft',
  'Courier Prime',
  'Courier New',
  'Courier',
]
const FONT_SIZES = [
  8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96,
]

interface UseToolbarArgs {
  onOpenGoToPage: () => void
}

export function useToolbar({ onOpenGoToPage }: UseToolbarArgs) {
  const editor = useEditorStore((s) => s.editor)
  const setSearchOpen = useEditorStore((s) => s.setSearchOpen)
  const activeElement = useEditorStore((s) => s.activeElement)
  const setActiveElement = useEditorStore((s) => s.setActiveElement)
  const fontFamily = useEditorStore((s) => s.fontFamily)
  const setFontFamily = useEditorStore((s) => s.setFontFamily)
  const fontSize = useEditorStore((s) => s.fontSize)
  const setFontSize = useEditorStore((s) => s.setFontSize)

  const theme = useEditorStore((s) => s.theme)
  const setTheme = useEditorStore((s) => s.setTheme)

  const viewMode = useEditorStore((s) => s.viewMode)
  const setViewMode = useEditorStore((s) => s.setViewMode)

  const mod = getShortcutModifier()
  const locked = getLockedFormattingOption(editor)
  const activeTemplate = useFormattingTemplateStore((s) =>
    s.getActiveTemplate(),
  )
  const { cursorFont, cursorSize, extraFonts } = useCursorFormatting(
    editor,
    fontFamily,
    fontSize,
  )

  // Re-render on selection/transaction so isActive/disabled values below
  // stay current — everything else in this hook is either derived per
  // render or delegated to useCursorFormatting above.
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    if (!editor) return
    const rerender = () => forceUpdate((n) => n + 1)
    editor.on('selectionUpdate', rerender)
    editor.on('transaction', rerender)
    return () => {
      editor.off('selectionUpdate', rerender)
      editor.off('transaction', rerender)
    }
  }, [editor])

  const [currentTextColor, setCurrentTextColor] = useState('#000000')
  const [currentBgColor, setCurrentBgColor] = useState('#ffff00')

  const isInsideAvCell = useMemo(() => {
    if (!editor) return false
    try {
      const { $from } = editor.state.selection
      for (let d = $from.depth; d >= 0; d--) {
        if ($from.node(d).type.name === 'avCell') return true
      }
    } catch {
      /* ignore */
    }
    return false
  }, [editor, activeElement])

  const elementOptions = useMemo(() => {
    // Same source of truth as the right-click Element submenu, so the
    // toolbar's order and shortcut hints stay in sync with it.
    const canonical = getElementMenuItems(activeTemplate)
    const orderIndex = new Map(canonical.map((c, i) => [c.type, i]))
    const shortcutByType = new Map(canonical.map((c) => [c.type, c.shortcut]))

    return Object.values(activeTemplate.rules)
      .filter((r) => r.enabled)
      .filter((r) =>
        isInsideAvCell
          ? AV_CELL_ELEMENT_IDS.includes(r.id)
          : !AV_CELL_ELEMENT_IDS.includes(r.id),
      )
      .map((r) => ({
        id: r.id,
        label: r.label,
        shortcut: shortcutByType.get(r.id) || '',
      }))
      .sort((a, b) => {
        const ai = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER
        const bi = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER
        return ai - bi
      })
  }, [activeTemplate, isInsideAvCell])

  const handleElementChange = useCallback(
    (type: string) => {
      if (!editor) return
      setActiveElement(type)
      if (BUILT_IN_ELEMENT_IDS.includes(type) || editor.schema.nodes[type]) {
        editor.chain().focus().setNode(type).run()
        return
      }
      const rule = activeTemplate.rules[type]
      if (rule) {
        editor
          .chain()
          .focus()
          .setNode('customElement', {
            customTypeId: type,
            customLabel: rule.label,
          })
          .run()
      }
    },
    [editor, activeTemplate, setActiveElement],
  )

  const handleFontFamilyChange = useCallback(
    (value: string) => {
      setFontFamily(value)
      const entry = FONT_REGISTRY.find((f) => f.name === value)
      if (entry) loadFont(entry)
      const attrs = DEFAULT_FONTS.includes(value) ? null : value
      editor
        ?.chain()
        .focus(undefined, { scrollIntoView: false })
        .setMark('textStyle', { fontFamily: attrs })
        .run()
    },
    [editor, setFontFamily],
  )

  const handleFontSizeChange = useCallback(
    (value: number) => {
      setFontSize(value)
      if (value === 12) {
        editor
          ?.chain()
          .focus(undefined, { scrollIntoView: false })
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      } else {
        editor
          ?.chain()
          .focus(undefined, { scrollIntoView: false })
          .setFontSize(`${value}pt`)
          .run()
      }
    },
    [editor, setFontSize],
  )

  const fontSizeOptions = useMemo(
    () =>
      cursorSize !== null && !FONT_SIZES.includes(cursorSize)
        ? [...FONT_SIZES, cursorSize].sort((a, b) => a - b)
        : FONT_SIZES,
    [cursorSize],
  )

  const currentAlign = useMemo(() => {
    if (!editor) return 'left'
    if (editor.isActive({ textAlign: 'center' })) return 'center'
    if (editor.isActive({ textAlign: 'right' })) return 'right'
    if (editor.isActive({ textAlign: 'justify' })) return 'justify'
    return 'left'
  }, [editor])

  return {
    mod,
    undo: {
      action: () => handleUndo(editor),
      disabled: !editor || !editor.can().undo(),
    },
    redo: {
      action: () => handleRedo(editor),
      disabled: !editor || !editor.can().redo(),
    },

    element: {
      value: activeElement,
      options: elementOptions,
      onChange: handleElementChange,
    },

    fontFamily: {
      value: cursorFont,
      extraFonts,
      onChange: handleFontFamilyChange,
      disabled: locked.fontFamily,
    },
    fontSize: {
      value: cursorSize,
      options: fontSizeOptions,
      onChange: handleFontSizeChange,
      disabled: locked.fontSize,
    },

    style: {
      bold: {
        active: editor?.isActive('bold') ?? false,
        toggle: () => toggleBold(editor),
        disabled: locked.bold,
      },
      italic: {
        active: editor?.isActive('italic') ?? false,
        toggle: () => toggleItalic(editor),
        disabled: locked.italic,
      },
      underline: {
        active: editor?.isActive('underline') ?? false,
        toggle: () => toggleUnderline(editor),
        disabled: locked.underline,
      },
      strikethrough: {
        active: editor?.isActive('strike') ?? false,
        toggle: () => toggleStrikethrough(editor),
        disabled: locked.strikethrough,
      },
      subscript: {
        active: editor?.isActive('subscript') ?? false,
        toggle: () => toggleSubscript(editor),
        disabled: locked.subscript,
      },
      superscript: {
        active: editor?.isActive('superscript') ?? false,
        toggle: () => toggleSuperscript(editor),
        disabled: locked.superscript,
      },
    },

    alignment: {
      value: currentAlign,
      onChange: (v: string) =>
        setAlignment(editor, v as 'left' | 'center' | 'right' | 'justify'),
      disabled: locked.textAlign,
    },

    colors: {
      text: {
        value: currentTextColor,
        onChange: (color: string) => {
          setCurrentTextColor(color)
          editor
            ?.chain()
            .focus(undefined, { scrollIntoView: false })
            .setColor(color)
            .run()
        },
        disabled: locked.textColor,
      },
      background: {
        value: currentBgColor,
        onChange: (color: string) => {
          setCurrentBgColor(color)
          editor
            ?.chain()
            .focus(undefined, { scrollIntoView: false })
            .toggleHighlight({ color })
            .run()
        },
        disabled: locked.backgroundColor,
      },
    },

    search: { action: () => setSearchOpen(true) },
    goto: { action: onOpenGoToPage },
    theme: {
      active: theme,
      toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    viewMode: {
      active: viewMode,
      toggle: () =>
        setViewMode(viewMode === 'continuous' ? 'paginated' : 'continuous'),
    },
  }
}
