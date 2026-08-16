export interface OracleSource {
  id: string
  name: string
  author: string
  license: string
  url?: string
  note?: string
}

export interface OracleRow {
  min: number
  max: number
  text?: string
  tableRef?: string
}

export type DiceSpec =
  | { kind: 'single'; sides: number }
  // d100, d20, d10, d6, etc. One die (or one percentile roll), value 1..sides
  // used directly as the row-lookup value. Covers the large majority of
  // Ironsworn/Starforged/Delve tables.
  | { kind: 'positional'; dice: number[] }
  // e.g. [6, 6] for d66. Roll each die 1..sides in order, concatenate as
  // digits for the lookup value (16, 23, 65...). Not used for d100, d100 is
  // `single` with sides: 100.
  | { kind: 'sum'; dice: number[] }
  // e.g. [6, 6] for 2d6 bell-curve tables. Roll each die, sum them, use the
  // total as the lookup value.
  | { kind: 'formula'; expression: string }
// Freeform dice notation ("2d6+2d4,1d8"), used by the standalone Dice
// Roller tool only. Never used for oracle row lookup.

export interface OracleTable {
  id: string
  name: string
  sourceId: string
  dice: DiceSpec
  rows: OracleRow[]
  matchTable?: OracleTable
  modifierAllowed?: boolean // only meaningful for "single" | "sum"
  // Odd/Even mechanic: deferred, no confirmed example table yet.
  parityTables?: { odd: OracleRow[]; even: OracleRow[] }
}

export interface OracleCollection {
  id: string
  name: string
  sourceId: string
  parentId?: string
  children: (OracleCollection | OracleTable)[]
}

export interface OracleCombo {
  id: string
  name: string
  sourceId: string
  parts: string[]
  template: string
}

export interface BundledPackage {
  source: OracleSource
  collections: OracleCollection[]
  combos: OracleCombo[]
}
