import type { Editor } from '@tiptap/react'

export interface SpellInfo {
  word: string
  from: number
  to: number
  suggestions: string[]
}

export interface GrammarInfo {
  from: number
  to: number
  ruleId: string
  message: string
  severity: 'style' | 'grammar'
  suggestions: string[]
}

export interface SelectionRange {
  from: number
  to: number
}

export interface SavedSelection extends SelectionRange {
  empty: boolean
}

export interface ScriptContextMenuProps {
  editor: Editor
  position: { x: number; y: number }
  spellInfo: SpellInfo | null
  grammarInfo: GrammarInfo | null
  onClose: () => void
  overrideSelection?: SelectionRange
}

export interface LockedFormatting {
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  subscript: boolean
  superscript: boolean
  textTransform: boolean
}

export interface ActiveStyleStates {
  bold: boolean
  italic: boolean
  underline: boolean
  strike: boolean
  subscript: boolean
  superscript: boolean
}

export interface ContextMenuState {
  visible: boolean
  position: { x: number; y: number }
  spellInfo: SpellInfo | null
  grammarInfo: GrammarInfo | null
  savedSelection?: SelectionRange
}

export interface ElementFormattingRule {
  enabled: boolean
  label?: string
}
