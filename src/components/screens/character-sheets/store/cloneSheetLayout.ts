import { uuid } from '@/utils/open-draft/uuid'
import type { CharacterSheet, SheetTab } from '../types'
import type { CoreBlockValues } from '../modules/CoreBlockModule'

/**
 * Deep-clones a moduleLayout with fresh tab/module ids. This is the single
 * "clone a sheet" path: starting a sheet from a template, duplicating a
 * user's own sheet, and resetting layout on a template change all go through
 * this function rather than each having their own copy logic.
 */
export function cloneSheetLayout(
  source: Pick<CharacterSheet, 'moduleLayout'>,
): CharacterSheet['moduleLayout'] {
  const tabs: SheetTab[] = source.moduleLayout.tabs.map((tab) => ({
    id: uuid(),
    label: tab.label,
    modules: tab.modules.map((mod) => ({
      ...mod,
      id: uuid(),
      config: structuredClone(mod.config),
      values: structuredClone(mod.values),
    })),
  }))
  return { tabs }
}

/** Pre-fills every Core Block module's "Character name" field with the
 *  linked character's name, so a freshly built (or template-swapped) sheet
 *  doesn't start with a blank name the user has to retype. */
export function applyCharacterName(
  moduleLayout: CharacterSheet['moduleLayout'],
  characterName: string,
): CharacterSheet['moduleLayout'] {
  return {
    tabs: moduleLayout.tabs.map((tab) => ({
      ...tab,
      modules: tab.modules.map((mod) =>
        mod.type === 'core-block'
          ? {
              ...mod,
              values: {
                ...(mod.values as CoreBlockValues),
                characterName,
              },
            }
          : mod,
      ),
    })),
  }
}
