import { create } from 'zustand'
import type {
  OracleSource,
  OracleCollection,
  OracleCombo,
  OracleTable,
} from '@/oracles/types'
import {
  BUNDLED_ORACLE_SOURCES,
  BUNDLED_ORACLE_COLLECTIONS,
  BUNDLED_ORACLE_COMBOS,
} from '@/oracles/data'

function flattenTables(collections: OracleCollection[]): OracleTable[] {
  const tables: OracleTable[] = []
  for (const collection of collections) {
    for (const child of collection.children) {
      if ('children' in child) tables.push(...flattenTables([child]))
      else tables.push(child)
    }
  }
  return tables
}

interface OracleState {
  userSources: OracleSource[]
  userCollections: OracleCollection[]
  userCombos: OracleCombo[]
  setUserSources: (sources: OracleSource[]) => void
  setUserCollections: (collections: OracleCollection[]) => void
  setUserCombos: (combos: OracleCombo[]) => void
  addUserSource: (source: OracleSource) => void
  addUserCollection: (collection: OracleCollection) => void
  getAllSources: () => OracleSource[]
  getAllCollections: () => OracleCollection[]
  getAllCombos: () => OracleCombo[]
  getAllTables: () => OracleTable[]
  getTableById: (id: string) => OracleTable | undefined
  /** The combo a table is a part of, if any — lets the Oracle table
   *  browser present Action+Theme (etc.) as one roll instead of two. */
  getComboForTable: (tableId: string) => OracleCombo | undefined
}

export const useOracleStore = create<OracleState>((set, get) => ({
  userSources: [],
  userCollections: [],
  userCombos: [],
  setUserSources: (userSources) => set({ userSources }),
  setUserCollections: (userCollections) => set({ userCollections }),
  setUserCombos: (userCombos) => set({ userCombos }),
  addUserSource: (source) =>
    set((s) => ({ userSources: [...s.userSources, source] })),
  addUserCollection: (collection) =>
    set((s) => ({ userCollections: [...s.userCollections, collection] })),
  getAllSources: () => [...BUNDLED_ORACLE_SOURCES, ...get().userSources],
  getAllCollections: () => [
    ...BUNDLED_ORACLE_COLLECTIONS,
    ...get().userCollections,
  ],
  getAllCombos: () => [...BUNDLED_ORACLE_COMBOS, ...get().userCombos],
  getAllTables: () => flattenTables(get().getAllCollections()),
  getTableById: (id) => get().getAllTables().find((t) => t.id === id),
  getComboForTable: (tableId) =>
    get().getAllCombos().find((c) => c.parts.includes(tableId)),
}))
