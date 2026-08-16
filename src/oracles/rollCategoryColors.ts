import type { RollCategory } from './rollTypes'

/** Fixed, non-user-pickable colour per roll category (glyph + sidebar chip). */
export const ROLL_CATEGORY_COLORS: Record<RollCategory, string> = {
  fate: '#6fa8dc',
  oracle: '#b58ee0',
  dice: '#e89b4f',
  storycubes: '#6abf69',
  manual: '#9aa0a6',
}

export const ROLL_CATEGORY_LABELS: Record<RollCategory, string> = {
  fate: 'Fate',
  oracle: 'Oracle',
  dice: 'Dice',
  storycubes: 'Story Cubes',
  manual: 'Manual',
}
