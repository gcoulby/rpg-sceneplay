import { create } from 'zustand'
import type { CharacterSheet } from '../types'

interface SheetState {
  sheets: CharacterSheet[]
  setSheets: (sheets: CharacterSheet[]) => void
  addSheet: (sheet: CharacterSheet) => void
  updateSheet: (id: string, updates: Partial<CharacterSheet>) => void
  removeSheet: (id: string) => void
  /** Which character's sheet the Character Sheet screen is showing. Kept
   *  separate from editorStore's `selectedCharacter`, which the Characters
   *  panel clears ~50ms after set to drive its own scroll-into-view effect
   *  and would otherwise stomp this immediately. */
  activeCharacterName: string | null
  setActiveCharacterName: (name: string | null) => void
}

export const useSheetStore = create<SheetState>((set) => ({
  sheets: [],
  setSheets: (sheets) => set({ sheets }),
  activeCharacterName: null,
  setActiveCharacterName: (name) => set({ activeCharacterName: name }),
  addSheet: (sheet) => set((s) => ({ sheets: [...s.sheets, sheet] })),
  updateSheet: (id, updates) =>
    set((s) => ({
      sheets: s.sheets.map((sheet) =>
        sheet.id === id
          ? { ...sheet, ...updates, updatedAt: new Date().toISOString() }
          : sheet,
      ),
    })),
  removeSheet: (id) =>
    set((s) => ({ sheets: s.sheets.filter((sheet) => sheet.id !== id) })),
}))
