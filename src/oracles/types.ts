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

export interface OracleTable {
  id: string
  name: string
  sourceId: string
  diceType: string
  rows: OracleRow[]
  matchTable?: OracleTable
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
