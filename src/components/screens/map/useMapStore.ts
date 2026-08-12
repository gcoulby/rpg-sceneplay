import { create } from 'zustand'
import { uuid } from '@/utils/open-draft/uuid'
import { coordKey } from './coordKey'
import type { MapCoord, MapRef, MapType, ProjectMap } from './types'

interface MapState {
  /** Single map for the current project. Null until the user picks hex/grid. */
  map: ProjectMap | null
  setMap: (map: ProjectMap | null) => void
  createMap: (type: MapType) => void

  /** Location mapRefs keyed by uppercased location name — locations are derived
   *  from scene headings, not stored entities, so the name is the only stable key. */
  locationMapRefs: Record<string, MapRef>
  setLocationMapRefs: (refs: Record<string, MapRef>) => void
  setLocationMapRef: (locationName: string, ref: MapRef) => void
  removeLocationMapRef: (locationName: string) => void

  /** When set, the map canvas is in "pick a cell" mode for this location name
   *  instead of opening the feature editor on click. */
  pendingLocationLink: string | null
  setPendingLocationLink: (locationName: string | null) => void

  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  upsertCellFeature: (
    coord: MapCoord,
    updates: { label: string; notes: string },
  ) => void
  deleteCellFeature: (coord: MapCoord) => void
}

export const useMapStore = create<MapState>((set, get) => ({
  map: null,
  setMap: (map) => set({ map }),
  createMap: (type) => set({ map: { id: uuid(), type, cells: [] } }),

  locationMapRefs: {},
  setLocationMapRefs: (refs) => set({ locationMapRefs: refs }),
  setLocationMapRef: (locationName, ref) =>
    set((s) => ({
      locationMapRefs: {
        ...s.locationMapRefs,
        [locationName.toUpperCase()]: ref,
      },
    })),
  removeLocationMapRef: (locationName) =>
    set((s) => {
      const next = { ...s.locationMapRefs }
      delete next[locationName.toUpperCase()]
      return { locationMapRefs: next }
    }),

  pendingLocationLink: null,
  setPendingLocationLink: (locationName) =>
    set({ pendingLocationLink: locationName }),

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  upsertCellFeature: (coord, updates) => {
    const map = get().map
    if (!map) return
    const key = coordKey(map.type, coord)
    const idx = map.cells.findIndex((c) => coordKey(map.type, c.coord) === key)
    const cells = [...map.cells]
    if (idx >= 0) {
      cells[idx] = {
        ...cells[idx],
        label: updates.label,
        notes: updates.notes,
      }
    } else {
      cells.push({ id: key, coord, label: updates.label, notes: updates.notes })
    }
    set({ map: { ...map, cells } })
  },
  deleteCellFeature: (coord) => {
    const map = get().map
    if (!map) return
    const key = coordKey(map.type, coord)
    set({
      map: {
        ...map,
        cells: map.cells.filter((c) => coordKey(map.type, c.coord) !== key),
      },
    })
  },
}))
