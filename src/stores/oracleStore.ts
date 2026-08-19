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

/** Home for every user-authored table — one lazily created source +
 *  collection, rather than a full user-collection-management UI. */
export const USER_ORACLE_SOURCE_ID = 'user-oracles'

/** Ensures the "My Oracles" user source exists, returning the (possibly
 *  unchanged) `userSources` array — shared by table and combo creation, both
 *  of which need this source to exist before they can be attributed to it. */
function withUserSource(userSources: OracleSource[]): OracleSource[] {
  if (userSources.some((src) => src.id === USER_ORACLE_SOURCE_ID)) {
    return userSources
  }
  return [
    ...userSources,
    {
      id: USER_ORACLE_SOURCE_ID,
      name: 'My Oracles',
      author: '',
      license: 'Custom',
    },
  ]
}

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
  /** Add a table to the default "My Oracles" user collection, creating it
   *  first if this is the first user-authored table. */
  addUserTable: (table: OracleTable) => void
  /** Replace a table (matched by id) in the default user collection. */
  updateUserTable: (table: OracleTable) => void
  /** Remove a table (matched by id) from the default user collection. */
  removeUserTable: (id: string) => void
  /** Add a combo, creating the "My Oracles" source first if needed —
   *  combos aren't nested in a collection, so this is just an array push. */
  addUserCombo: (combo: OracleCombo) => void
  /** Replace a combo (matched by id). */
  updateUserCombo: (combo: OracleCombo) => void
  /** Remove a combo (matched by id). */
  removeUserCombo: (id: string) => void
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

  addUserTable: (table) =>
    set((s) => {
      const hasCollection = s.userCollections.some(
        (c) => c.id === USER_ORACLE_SOURCE_ID,
      )
      const userSources = withUserSource(s.userSources)
      const userCollections = hasCollection
        ? s.userCollections.map((c) =>
            c.id === USER_ORACLE_SOURCE_ID
              ? { ...c, children: [...c.children, table] }
              : c,
          )
        : [
            ...s.userCollections,
            {
              id: USER_ORACLE_SOURCE_ID,
              name: 'Custom Tables',
              sourceId: USER_ORACLE_SOURCE_ID,
              children: [table],
            },
          ]
      return { userSources, userCollections }
    }),

  updateUserTable: (table) =>
    set((s) => ({
      userCollections: s.userCollections.map((c) =>
        c.id === USER_ORACLE_SOURCE_ID
          ? {
              ...c,
              children: c.children.map((child) =>
                'rows' in child && child.id === table.id ? table : child,
              ),
            }
          : c,
      ),
    })),

  removeUserTable: (id) =>
    set((s) => ({
      userCollections: s.userCollections.map((c) =>
        c.id === USER_ORACLE_SOURCE_ID
          ? {
              ...c,
              children: c.children.filter(
                (child) => !('rows' in child) || child.id !== id,
              ),
            }
          : c,
      ),
    })),

  addUserCombo: (combo) =>
    set((s) => ({
      userSources: withUserSource(s.userSources),
      userCombos: [...s.userCombos, combo],
    })),
  updateUserCombo: (combo) =>
    set((s) => ({
      userCombos: s.userCombos.map((c) => (c.id === combo.id ? combo : c)),
    })),
  removeUserCombo: (id) =>
    set((s) => ({ userCombos: s.userCombos.filter((c) => c.id !== id) })),

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
