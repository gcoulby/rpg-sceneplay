import { create } from 'zustand'
import type { OracleSource, OracleCollection, OracleCombo } from '@/oracles/types'
import {
  BUNDLED_ORACLE_SOURCES,
  BUNDLED_ORACLE_COLLECTIONS,
  BUNDLED_ORACLE_COMBOS,
} from '@/oracles/data'

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
}))
