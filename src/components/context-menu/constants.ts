import type { ElementType } from '@/stores/editorStore'
import type { ContextMenuState } from './types'

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

export const modKey = isMac ? '⌘' : 'Ctrl+'
export const shiftKey = isMac ? '⇧' : 'Shift+'

export const ELEMENT_MENU_ITEMS: { type: ElementType; shortcut: string }[] = [
  { type: 'sceneHeading', shortcut: `${modKey}1` },
  { type: 'action', shortcut: `${modKey}2` },
  { type: 'character', shortcut: `${modKey}3` },
  { type: 'dialogue', shortcut: `${modKey}4` },
  { type: 'parenthetical', shortcut: `${modKey}5` },
  { type: 'transition', shortcut: `${modKey}6` },
  { type: 'general', shortcut: `${modKey}7` },
  { type: 'shot', shortcut: `${modKey}8` },
  { type: 'newAct', shortcut: '' },
  { type: 'endOfAct', shortcut: '' },
  { type: 'lyrics', shortcut: '' },
  { type: 'showEpisode', shortcut: '' },
  { type: 'castList', shortcut: '' },
]

export const CLOSED_STATE: ContextMenuState = {
  visible: false,
  position: { x: 0, y: 0 },
  spellInfo: null,
  grammarInfo: null,
}

export const DUAL_DIALOGUE_TYPES = new Set([
  'character',
  'dialogue',
  'parenthetical',
])
