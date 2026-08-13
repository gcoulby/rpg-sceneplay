import { useMainTabStore } from '@/stores/mainTabStore'
import { useSheetStore } from './useSheetStore'

/** Navigates to the Character Sheet screen for a given character. Single
 *  entry point so every "open sheet" affordance (character card, detail
 *  dialog, etc.) behaves identically. */
export function openCharacterSheet(characterName: string): void {
  useSheetStore.getState().setActiveCharacterName(characterName)
  useMainTabStore.getState().setActiveTab('character-sheet')
}
