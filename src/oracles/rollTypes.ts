import type { DiceSpec } from './types'

export type RollCategory = 'fate' | 'oracle' | 'dice' | 'storycubes' | 'manual'

export type RollValue =
  | {
      kind: 'fate'
      result: 'Yes' | 'No' | 'Extreme Yes' | 'Extreme No'
      roll: number
      target: number
      chaosRank: number
      exceptional: boolean
    }
  | {
      kind: 'oracle-table'
      tableId: string
      tableName: string
      dice: DiceSpec
      rawRoll: number
      modifier: number
      lookupValue: number
      rowText: string
      isMatch?: boolean
    }
  | {
      kind: 'oracle-combo'
      comboId: string
      comboName: string
      parts: {
        tableId: string
        tableName: string
        rawRoll: number
        rowText: string
      }[]
      renderedText: string
    }
  | {
      kind: 'dice'
      expression: string
      rolls: number[]
      total: number
      label?: string
    }
  | { kind: 'storycubes'; icons: string[] }
  | { kind: 'manual'; label: string; value: string }

export interface RollNote {
  id: string
  anchorId: string
  category: RollCategory
  value: RollValue
  timestamp: string
}
