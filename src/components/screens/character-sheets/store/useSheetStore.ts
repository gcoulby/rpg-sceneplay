import { create } from 'zustand'
import type { CharacterSheet } from '../types'
import type { GearItem } from '../modules/GearModule'

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

/** Every distinct gear item name across every character's every Gear
 *  module — the "known items" half of the script `[bracket]` ↔ inventory
 *  two-way link. No per-character scoping (sheets/scripts aren't linked
 *  that granularly), matching how the script side's own known-items list
 *  is also doc-wide rather than per-scene. */
export function getAllGearItemNames(sheets: CharacterSheet[]): string[] {
  const names = new Set<string>()
  for (const sheet of sheets) {
    for (const tab of sheet.moduleLayout.tabs) {
      for (const module of tab.modules) {
        if (module.type !== 'gear') continue
        const items = (module.values as { items?: GearItem[] }).items ?? []
        for (const item of items) {
          const name = item.name?.trim()
          if (name) names.add(name)
        }
      }
    }
  }
  return Array.from(names).sort()
}
