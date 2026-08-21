import type { EntityKind } from '@/stores/editorStore'
import { REL_TYPES } from '@/components/left-side-panel/character-panel/characterConstants'

export const ENTITY_KIND_LABELS: Record<EntityKind, string> = {
  character: 'Character',
  item: 'Item',
  location: 'Location',
  other: 'Other',
}

export const ENTITY_KIND_ORDER: EntityKind[] = [
  'character',
  'item',
  'location',
  'other',
]

export const ENTITY_KIND_COLORS: Record<EntityKind, string> = {
  character: '#8b5cf6',
  item: '#f97316',
  location: '#059669',
  other: '#64748b',
}

/** Which relationship types make sense for a given unordered pair of entity
 *  kinds — a character can be "allies" with another character, but not with
 *  a rock. Keyed by the two kinds sorted alphabetically and joined with
 *  `|`, so lookups don't care about argument order.
 *
 *  Each pairing gets its own vocabulary, not a shared generic subset — a
 *  character's relationship to a place ("lives in", "rules") reads
 *  differently from an item's ("hidden in", "made in") or a faction's
 *  ("territory of"), even though all three could loosely be described as
 *  "located-in". `related-to` alone is the deliberate exception, kept as a
 *  catch-all in every list for the rare edge that doesn't fit anything more
 *  specific.
 *
 *  `other` has no fixed real-world semantics (it's a freeform bucket for
 *  factions, events, concepts, whatever doesn't fit the other three kinds),
 *  but that doesn't mean anything goes with it — it's treated here mostly
 *  as "faction/organization" since that's its most common use in worldbuilding. */
const CHARACTER_CHARACTER = REL_TYPES
const CHARACTER_ITEM = ['owns', 'seeks', 'wields', 'created', 'destroyed', 'guards', 'related-to']
const CHARACTER_LOCATION = ['lives-in', 'born-in', 'rules', 'exiled-from', 'visited', 'related-to']
const CHARACTER_OTHER = ['allies', 'rivals', 'member-of', 'leads', 'founded', 'related-to']
const ITEM_ITEM = ['contains', 'part-of', 'crafted-from', 'paired-with', 'related-to']
const ITEM_LOCATION = ['located-in', 'originates-from', 'hidden-in', 'related-to']
const ITEM_OTHER = ['owns', 'created', 'symbol-of', 'related-to']
const LOCATION_LOCATION = ['contains', 'adjacent-to', 'connected-to', 'rules-over', 'related-to']
const LOCATION_OTHER = ['territory-of', 'headquarters-of', 'contested-by', 'related-to']
const OTHER_OTHER = ['allies', 'rivals', 'at-war-with', 'absorbed-by', 'related-to']

export const REL_TYPES_BY_KIND_PAIR: Record<string, string[]> = {
  'character|character': CHARACTER_CHARACTER,
  'character|item': CHARACTER_ITEM,
  'character|location': CHARACTER_LOCATION,
  'character|other': CHARACTER_OTHER,
  'item|item': ITEM_ITEM,
  'item|location': ITEM_LOCATION,
  'item|other': ITEM_OTHER,
  'location|location': LOCATION_LOCATION,
  'location|other': LOCATION_OTHER,
  'other|other': OTHER_OTHER,
}

/** Every relationship type that exists anywhere in the table above, for
 *  contexts (like an edge whose two endpoints aren't both selected yet)
 *  that need a full list rather than a pair-specific one. */
export const ALL_REL_TYPES = Array.from(
  new Set(Object.values(REL_TYPES_BY_KIND_PAIR).flat()),
)

export function relTypesForPair(a: EntityKind, b: EntityKind): string[] {
  const key = [a, b].sort().join('|')
  return REL_TYPES_BY_KIND_PAIR[key] ?? ALL_REL_TYPES
}
