import type { CharacterSheet } from '../types'
import type { CoreBlockConfig, CoreBlockValues } from '../modules/CoreBlockModule'
import type { CustomStatsConfig, CustomStatsValues } from '../modules/CustomStatsModule'
import type { TrackerValues } from '../modules/TrackerModule'
import type { ChargesValues } from '../modules/ChargesModule'
import type { SkillsValues } from '../modules/SkillsModule'

/**
 * Flattens every numeric value on a sheet into a single lookup used to
 * resolve `{Label}` formula references. Multi-row modules (custom stats,
 * skills) key each row by its own label rather than the module's label, so a
 * formula can reference an individual stat/skill directly.
 */
export function buildValueMap(sheet: CharacterSheet): Record<string, number> {
  const map: Record<string, number> = {}
  const set = (key: string, value: number) => {
    if (key.trim()) map[key.trim().toLowerCase()] = value
  }

  for (const tab of sheet.moduleLayout.tabs) {
    for (const mod of tab.modules) {
      switch (mod.type) {
        case 'core-block': {
          const config = mod.config as CoreBlockConfig
          const values = mod.values as CoreBlockValues
          set('hp', values.hpCurrent)
          set('hp.max', values.hpMax)
          for (const stat of config.statLabels) {
            set(stat.label, values.stats[stat.id] ?? 0)
          }
          break
        }
        case 'custom-stats': {
          const config = mod.config as CustomStatsConfig
          const values = mod.values as CustomStatsValues
          for (const row of config.rows) {
            set(row.label, values[row.id] ?? 0)
          }
          break
        }
        case 'tracker': {
          const values = mod.values as TrackerValues
          set(mod.label, values.current)
          set(`${mod.label}.max`, values.max)
          break
        }
        case 'charges': {
          const values = mod.values as ChargesValues
          set(mod.label, values.current)
          set(`${mod.label}.max`, values.max)
          break
        }
        case 'skills': {
          const values = mod.values as SkillsValues
          for (const row of values.rows) {
            set(row.name, row.modifier)
          }
          break
        }
        default:
          break
      }
    }
  }

  return map
}
