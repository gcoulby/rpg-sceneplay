import type { OracleTable, OracleRow, OracleCombo } from './types'

export interface TableRollResult {
  table: OracleTable
  roll: number
  row: OracleRow | undefined
  cascaded?: TableRollResult
}

const MAX_CASCADE_DEPTH = 5

function diceMax(diceType: string): number {
  const match = /d(\d+)$/i.exec(diceType)
  return match ? parseInt(match[1], 10) : 100
}

export function rollTable(
  table: OracleTable,
  resolveRef: (id: string) => OracleTable | undefined,
  depth = 0,
): TableRollResult {
  const roll = Math.floor(Math.random() * diceMax(table.diceType)) + 1
  const row = table.rows.find((r) => roll >= r.min && roll <= r.max)

  const result: TableRollResult = { table, roll, row }

  if (row?.tableRef && depth < MAX_CASCADE_DEPTH) {
    const nextTable = resolveRef(row.tableRef)
    if (nextTable) {
      result.cascaded = rollTable(nextTable, resolveRef, depth + 1)
    }
  }

  return result
}

/** The final display text for a rolled table, following any cascade chain. */
export function describeTableRoll(result: TableRollResult): string {
  const text = result.row?.text ?? ''
  return result.cascaded ? `${text} — ${describeTableRoll(result.cascaded)}` : text
}

export function rollCombo(
  combo: OracleCombo,
  resolveRef: (id: string) => OracleTable | undefined,
): { text: string; rolls: TableRollResult[] } {
  const rolls = combo.parts
    .map((id) => resolveRef(id))
    .filter((t): t is OracleTable => t !== undefined)
    .map((table) => rollTable(table, resolveRef))

  const text = combo.template.replace(
    /\{(\d+)\}/g,
    (_, index) => describeTableRoll(rolls[Number(index)]) || '',
  )

  return { text, rolls }
}
