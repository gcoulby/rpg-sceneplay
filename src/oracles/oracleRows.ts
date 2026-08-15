import type { OracleCollection, OracleCombo, OracleTable } from './types'

export function flattenCollectionTables(collection: OracleCollection): OracleTable[] {
  const tables: OracleTable[] = []
  for (const child of collection.children) {
    if ('children' in child) tables.push(...flattenCollectionTables(child))
    else tables.push(child)
  }
  return tables
}

export type BrowserRow =
  | { kind: 'table'; table: OracleTable }
  | { kind: 'combo'; combo: OracleCombo }

/** Tables that belong to a combo (e.g. Action + Theme) collapse into one
 *  combo row instead of listing each part separately. */
export function buildBrowserRows(
  tables: OracleTable[],
  getComboForTable: (id: string) => OracleCombo | undefined,
): BrowserRow[] {
  const rows: BrowserRow[] = []
  const seenComboIds = new Set<string>()
  for (const table of tables) {
    const combo = getComboForTable(table.id)
    if (combo) {
      if (seenComboIds.has(combo.id)) continue
      seenComboIds.add(combo.id)
      rows.push({ kind: 'combo', combo })
    } else {
      rows.push({ kind: 'table', table })
    }
  }
  return rows
}
