import {
  Dices,
  LayoutGrid,
  Orbit,
  Rocket,
  Scroll,
  Search,
  Sparkles,
  Swords,
  Telescope,
  type LucideIcon,
} from 'lucide-react'

/** Per-template icon, keyed by template id. Falls back to a generic sparkle
 *  for any template that doesn't have a specific one mapped. */
export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  'fantasy-adventurer': Swords,
  'dnd-5e': Dices,
  'pulp-investigator': Search,
  'sci-fi-operative': Rocket,
  ironsworn: Scroll,
  starforged: Orbit,
  astroprisma: Telescope,
  'minimalist-universal': LayoutGrid,
}

export const DEFAULT_TEMPLATE_ICON = Sparkles
