import type { SheetTemplate } from '../types'
import fantasyAdventurer from './fantasy-adventurer.json'
import pulpInvestigator from './pulp-investigator.json'
import sciFiOperative from './sci-fi-operative.json'
import minimalistUniversal from './minimalist-universal.json'
import dnd5e from './dnd-5e.json'
import ironsworn from './ironsworn.json'
import starforged from './starforged.json'
import astroprisma from './astroprisma.json'

export const SHEET_TEMPLATES: SheetTemplate[] = [
  fantasyAdventurer,
  dnd5e,
  pulpInvestigator,
  sciFiOperative,
  ironsworn,
  starforged,
  astroprisma,
  minimalistUniversal,
] as SheetTemplate[]

export function getTemplateById(id: string): SheetTemplate | undefined {
  return SHEET_TEMPLATES.find((t) => t.id === id)
}
