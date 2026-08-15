import { ELEMENT_LABELS, type ElementType } from '@/stores/editorStore'
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

/**
 * Resolve the Element submenu's items for the active template. When the
 * template defines `elementMenuOrder` (a restricted, ordered type list —
 * e.g. RPG Sceneplay's S-T-A-R-T set), that list wins outright, with
 * shortcuts assigned positionally (1st -> Mod-1, ..., 9th+ -> no shortcut).
 * Otherwise falls back to the legacy static `ELEMENT_MENU_ITEMS` filtered by
 * `rule.enabled`, preserving existing behaviour for every other template.
 */
export function getElementMenuItems(activeTemplate: {
  rules: Record<string, { label?: string; enabled: boolean } | undefined>
  elementMenuOrder?: string[]
}): { type: ElementType; label: string; shortcut: string }[] {
  if (activeTemplate.elementMenuOrder) {
    return activeTemplate.elementMenuOrder.map((type, i) => ({
      type,
      label: activeTemplate.rules[type]?.label || ELEMENT_LABELS[type] || type,
      shortcut: i < 9 ? `${modKey}${i + 1}` : '',
    }))
  }
  return ELEMENT_MENU_ITEMS.filter(({ type }) => {
    const rule = activeTemplate.rules[type]
    return !rule || rule.enabled
  }).map(({ type, shortcut }) => ({
    type,
    label: ELEMENT_LABELS[type] || type,
    shortcut,
  }))
}

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
