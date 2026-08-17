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
  Dices,
  Dice5,
  Lightbulb,
  Eye,
  FileStack,
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
  | 'oracles'
  | 'inspiration'
  | 'dice-roller'
  | 'rolls'
  | 'pdf-tools'

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
  { id: 'oracles', label: 'Oracles', icon: Eye },
  { id: 'inspiration', label: 'Inspiration', icon: Lightbulb },
  { id: 'dice-roller', label: 'Dice Roller', icon: Dices },
  { id: 'rolls', label: 'Rolls', icon: Dice5 },
  { id: 'pdf-tools', label: 'PDF Tools', icon: FileStack },
]

interface ActivityBarState {
  activeView: NavView
  setActiveView: (view: NavView) => void
}

export const useActivityBarStore = create<ActivityBarState>((set) => ({
  activeView: '',
  setActiveView: (view) => set({ activeView: view }),
}))
