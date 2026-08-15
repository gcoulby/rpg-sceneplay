import { create } from 'zustand'

/** Which top-level screen tab (editor/map/beat-board/statistics) is active.
 *  Lifted out of App.tsx so other panels (e.g. "Add to map" in the locations
 *  sidepanel) can switch to the Map tab programmatically. */
export type MainTab =
  | 'editor'
  | 'map'
  | 'beat-board'
  | 'statistics'
  | 'character-sheet'

interface MainTabState {
  activeTab: MainTab
  setActiveTab: (tab: MainTab) => void
}

export const useMainTabStore = create<MainTabState>((set) => ({
  activeTab: 'editor',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
