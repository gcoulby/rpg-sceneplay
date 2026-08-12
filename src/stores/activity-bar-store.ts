import type { LucideIcon } from 'lucide-react'
import {
  Clapperboard,
  FileText,
  MapPin,
  ListTree,
  Tags,
  StickyNote,
  Users,
  NotebookTabs,
} from 'lucide-react'
import { create } from 'zustand'

export type NavView =
  | ''
  | 'scenes'
  | 'pages'
  | 'locations'
  | 'structure'
  | 'tags'
  | 'notes'
  | 'characters'
  | 'index-cards'

export interface NavViewConfig {
  id: NavView
  label: string
  icon: LucideIcon
}

export const NAV_VIEWS: NavViewConfig[] = [
  { id: 'scenes', label: 'Scenes', icon: Clapperboard },
  { id: 'pages', label: 'Pages', icon: FileText },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'structure', label: 'Structure', icon: ListTree },
  { id: 'tags', label: 'Tags', icon: Tags },
  { id: 'notes', label: 'Notes', icon: StickyNote },
  { id: 'characters', label: 'Characters', icon: Users },
  { id: 'index-cards', label: 'Index Cards', icon: NotebookTabs },
]

interface ActivityBarState {
  activeView: NavView
  setActiveView: (view: NavView) => void
}

export const useActivityBarStore = create<ActivityBarState>((set) => ({
  activeView: '',
  setActiveView: (view) => set({ activeView: view }),
}))
