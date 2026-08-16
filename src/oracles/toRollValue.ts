import type { OracleCombo } from './types'
import type { TableRollResult } from './rollTable'
import { describeTableRoll } from './rollTable'
import type { RollValue } from './rollTypes'

export function tableResultToRollValue(result: TableRollResult): RollValue {
  return {
    kind: 'oracle-table',
    tableId: result.table.id,
    tableName: result.table.name,
    dice: result.table.dice,
    rawRoll: result.rawRoll,
    modifier: result.modifier,
    lookupValue: result.lookupValue,
    rowText: describeTableRoll(result),
    isMatch: result.isMatch,
  }
}

export function comboResultToRollValue(
  combo: OracleCombo,
  result: { text: string; rolls: TableRollResult[] },
): RollValue {
  return {
    kind: 'oracle-combo',
    comboId: combo.id,
    comboName: combo.name,
    parts: result.rolls.map((r) => ({
      tableId: r.table.id,
      tableName: r.table.name,
      rawRoll: r.rawRoll,
      rowText: describeTableRoll(r),
    })),
    renderedText: result.text,
  }
}
