import type { SheetTemplate } from '../types'
import fantasyAdventurer from './fantasy-adventurer.json'
import pulpInvestigator from './pulp-investigator.json'
import sciFiOperative from './sci-fi-operative.json'
import minimalistUniversal from './minimalist-universal.json'

export const SHEET_TEMPLATES: SheetTemplate[] = [
  fantasyAdventurer,
  pulpInvestigator,
  sciFiOperative,
  minimalistUniversal,
] as SheetTemplate[]

export function getTemplateById(id: string): SheetTemplate | undefined {
  return SHEET_TEMPLATES.find((t) => t.id === id)
}
