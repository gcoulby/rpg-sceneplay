import { uuid } from '@/utils/open-draft/uuid'
import type { CharacterSheet, SheetTemplate } from '../types'
import { applyCharacterName, cloneSheetLayout } from './cloneSheetLayout'
import { useSheetStore } from './useSheetStore'
import { linkSheetToCharacter } from './sheetLinking'

function newSheetShell(
  name: string,
  templateId: string | null,
  moduleLayout: CharacterSheet['moduleLayout'],
): CharacterSheet {
  const now = new Date().toISOString()
  return {
    id: uuid(),
    name,
    templateId,
    characterName: null,
    moduleLayout,
    options: { name, themeId: templateId, tabOrder: moduleLayout.tabs.map((t) => t.id) },
    createdAt: now,
    updatedAt: now,
  }
}

/** Creates a new sheet from a template's layout and links it to a character
 *  in one step — the record is only ever created via this "build a sheet"
 *  entry point, never silently on first open. */
export function createSheetFromTemplate(
  template: SheetTemplate,
  characterName: string,
): CharacterSheet {
  const sheet = newSheetShell(
    characterName,
    template.id,
    applyCharacterName(cloneSheetLayout(template), characterName),
  )
  useSheetStore.getState().addSheet(sheet)
  linkSheetToCharacter(sheet.id, characterName)
  return sheet
}

/** Creates an empty sheet (no tabs) and links it to a character. */
export function createBlankSheet(characterName: string): CharacterSheet {
  const sheet = newSheetShell(characterName, null, { tabs: [] })
  useSheetStore.getState().addSheet(sheet)
  linkSheetToCharacter(sheet.id, characterName)
  return sheet
}
