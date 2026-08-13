import { create } from 'zustand'
import { uuid } from '@/utils/open-draft/uuid'
import { coordKey } from './coordKey'
import type { MapBackground, MapCoord, MapRef, MapType, ProjectMap } from './types'

const ZOOM_MIN = 50
const ZOOM_MAX = 300
const ZOOM_STEP = 10

interface MapState {
  /** Single map for the current project. Null until the user picks hex/grid. */
  map: ProjectMap | null
  setMap: (map: ProjectMap | null) => void
  createMap: (type: MapType) => void
  /** Destructive: drops the current map and every location's link to it. */
  resetMap: () => void
  updateMapSize: (
    updates: Partial<Pick<ProjectMap, 'gridColumns' | 'gridRows' | 'hexRadius'>>,
  ) => void
  setMapBackground: (background: MapBackground | null) => void
  setAmbientBackground: (background: MapBackground | null) => void
  /** Hex only — border color for a ring of hexes. Empty string clears it back
   *  to the default border. */
  setRingColor: (ring: number, color: string) => void

  /** Location mapRefs keyed by uppercased location name — locations are derived
   *  from scene headings, not stored entities, so the name is the only stable key. */
  locationMapRefs: Record<string, MapRef>
  setLocationMapRefs: (refs: Record<string, MapRef>) => void
  setLocationMapRef: (locationName: string, ref: MapRef) => void
  removeLocationMapRef: (locationName: string) => void
  /** Links a location to a cell and, when that cell has no feature yet, fills
   *  it in with the location's name so "Add to Map" produces a real map
   *  feature instead of just a marker dot. */
  linkLocationToCell: (locationName: string, coord: MapCoord) => void

  /** When set, the map canvas is in "pick a cell" mode for this location name
   *  instead of opening the feature editor on click. */
  pendingLocationLink: string | null
  setPendingLocationLink: (locationName: string | null) => void

  settingsOpen: boolean
  setSettingsOpen: (open: boolean) => void

  zoom: number
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  resetZoom: () => void

  upsertCellFeature: (
    coord: MapCoord,
    updates: {
      label: string
      notes: string
      imageAssetId?: string
      icon?: string
    },
  ) => void
  deleteCellFeature: (coord: MapCoord) => void
}

export const useMapStore = create<MapState>((set, get) => ({
  map: null,
  setMap: (map) => set({ map }),
  createMap: (type) => set({ map: { id: uuid(), type, cells: [] } }),
  resetMap: () => set({ map: null, locationMapRefs: {} }),
  updateMapSize: (updates) =>
    set((s) => (s.map ? { map: { ...s.map, ...updates } } : s)),
  setMapBackground: (background) =>
    set((s) =>
      s.map ? { map: { ...s.map, background: background ?? undefined } } : s,
    ),
  setAmbientBackground: (background) =>
    set((s) =>
      s.map
        ? { map: { ...s.map, ambientBackground: background ?? undefined } }
        : s,
    ),
  setRingColor: (ring, color) =>
    set((s) => {
      if (!s.map) return s
      const next = [...(s.map.ringColors ?? [])]
      next[ring] = color
      return { map: { ...s.map, ringColors: next } }
    }),

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
  linkLocationToCell: (locationName, coord) => {
    const map = get().map
    if (!map) return
    set((s) => ({
      locationMapRefs: {
        ...s.locationMapRefs,
        [locationName.toUpperCase()]: { mapId: map.id, coord },
      },
    }))
    const key = coordKey(map.type, coord)
    const hasFeature = map.cells.some((c) => coordKey(map.type, c.coord) === key)
    if (!hasFeature) {
      get().upsertCellFeature(coord, { label: locationName, notes: '' })
    }
  },

  pendingLocationLink: null,
  setPendingLocationLink: (locationName) =>
    set({ pendingLocationLink: locationName }),

  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  zoom: 100,
  setZoom: (zoom) =>
    set({ zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)) }),
  zoomIn: () =>
    set((s) => ({ zoom: Math.min(ZOOM_MAX, s.zoom + ZOOM_STEP) })),
  zoomOut: () =>
    set((s) => ({ zoom: Math.max(ZOOM_MIN, s.zoom - ZOOM_STEP) })),
  resetZoom: () => set({ zoom: 100 }),

  upsertCellFeature: (coord, updates) => {
    const map = get().map
    if (!map) return
    const key = coordKey(map.type, coord)
    const idx = map.cells.findIndex((c) => coordKey(map.type, c.coord) === key)
    const cells = [...map.cells]
    const nextCell = {
      id: key,
      coord,
      label: updates.label,
      notes: updates.notes,
      imageAssetId: updates.imageAssetId,
      icon: updates.icon,
    }
    if (idx >= 0) cells[idx] = { ...cells[idx], ...nextCell }
    else cells.push(nextCell)
    set({ map: { ...map, cells } })
  },
  deleteCellFeature: (coord) => {
    const map = get().map
    if (!map) return
    const key = coordKey(map.type, coord)
    set((s) => {
      const locationMapRefs = { ...s.locationMapRefs }
      for (const [name, ref] of Object.entries(locationMapRefs)) {
        if (ref.mapId === map.id && coordKey(map.type, ref.coord) === key) {
          delete locationMapRefs[name]
        }
      }
      return {
        map: {
          ...map,
          cells: map.cells.filter((c) => coordKey(map.type, c.coord) !== key),
        },
        locationMapRefs,
      }
    })
  },
}))
