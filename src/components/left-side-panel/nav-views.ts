import type { LucideIcon } from 'lucide-react'
import {
  Clapperboard,
  FileText,
  MapPin,
  ListTree,
  Tags,
  StickyNote,
} from 'lucide-react'

export type NavView =
  | ''
  | 'scenes'
  | 'pages'
  | 'locations'
  | 'structure'
  | 'tags'
  | 'notes'
  | 'characters'

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
]
