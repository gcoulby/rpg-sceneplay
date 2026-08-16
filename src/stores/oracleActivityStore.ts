import { create } from 'zustand'

export type OracleActivity = 'inspiration' | 'roller' | 'oracle'

interface OracleActivityState {
  activeActivity: OracleActivity
  setActiveActivity: (activity: OracleActivity) => void
  activeCollectionId: string | null
  setActiveCollectionId: (id: string | null) => void
}

const STORAGE_KEY_ACTIVITY = 'oracle:activeActivity'
const STORAGE_KEY_COLLECTION = 'oracle:activeCollectionId'

function loadActivity(): OracleActivity {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITY)
    if (raw === 'inspiration' || raw === 'roller' || raw === 'oracle') return raw
  } catch {
    /* ignore */
  }
  return 'inspiration'
}

function loadCollectionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_COLLECTION)
  } catch {
    return null
  }
}

export const useOracleActivityStore = create<OracleActivityState>((set) => ({
  activeActivity: loadActivity(),
  setActiveActivity: (activity) => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVITY, activity)
    } catch {
      /* ignore */
    }
    set({ activeActivity: activity })
  },

  activeCollectionId: loadCollectionId(),
  setActiveCollectionId: (id) => {
    try {
      if (id) localStorage.setItem(STORAGE_KEY_COLLECTION, id)
      else localStorage.removeItem(STORAGE_KEY_COLLECTION)
    } catch {
      /* ignore */
    }
    set({ activeCollectionId: id })
  },
}))
