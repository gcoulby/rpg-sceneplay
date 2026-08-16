import type { DiceSpec, OracleTable, OracleRow, OracleCombo } from './types'

export interface TableRollResult {
  table: OracleTable
  rawRoll: number
  modifier: number
  lookupValue: number
  row: OracleRow | undefined
  isMatch: boolean
  cascaded?: TableRollResult
}

const MAX_CASCADE_DEPTH = 5

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

/** Rolls the dice for a spec and returns the individual die results in order. */
function rollDice(dice: DiceSpec): number[] {
  switch (dice.kind) {
    case 'single':
      return [rollDie(dice.sides)]
    case 'positional':
    case 'sum':
      return dice.dice.map(rollDie)
    case 'formula':
      throw new Error('formula dice cannot be used for table lookup')
  }
}

/** Combines rolled dice into the raw row-lookup value for a spec. */
function toRawRoll(dice: DiceSpec, rolls: number[]): number {
  switch (dice.kind) {
    case 'single':
      return rolls[0]
    case 'positional':
      return Number(rolls.join(''))
    case 'sum':
      return rolls.reduce((sum, r) => sum + r, 0)
    case 'formula':
      throw new Error('formula dice cannot be used for table lookup')
  }
}

/** Ironsworn-style "match" (doubles) detection, keyed off dice.kind. */
export function isMatch(dice: DiceSpec, rawRoll: number, rolls: number[]): boolean {
  switch (dice.kind) {
    case 'single': {
      const n = rawRoll - 1 // zero-index
      const tens = Math.floor(n / 10)
      const units = n % 10
      return tens === units
    }
    case 'positional':
      return rolls.every((r) => r === rolls[0])
    case 'sum':
    case 'formula':
      return false
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function rollTable(
  table: OracleTable,
  resolveRef: (id: string) => OracleTable | undefined,
  depth = 0,
  modifier = 0,
): TableRollResult {
  const rolls = rollDice(table.dice)
  const rawRoll = toRawRoll(table.dice, rolls)

  const modifierApplies =
    modifier !== 0 && (table.dice.kind === 'single' || table.dice.kind === 'sum')
  const lookupValue = modifierApplies
    ? clamp(
        rawRoll + modifier,
        table.rows[0]?.min ?? rawRoll,
        table.rows[table.rows.length - 1]?.max ?? rawRoll,
      )
    : rawRoll

  const row = table.rows.find((r) => lookupValue >= r.min && lookupValue <= r.max)

  const result: TableRollResult = {
    table,
    rawRoll,
    modifier,
    lookupValue,
    row,
    isMatch: isMatch(table.dice, rawRoll, rolls),
  }

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

/** Human-readable dice notation for a spec, e.g. "d100", "2d6", "d66". */
export function formatDiceSpec(dice: DiceSpec): string {
  switch (dice.kind) {
    case 'single':
      return `d${dice.sides}`
    case 'positional':
      return `d${dice.dice.join('')}`
    case 'sum':
      return dice.dice.map((s) => `d${s}`).join('+')
    case 'formula':
      return dice.expression
  }
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
