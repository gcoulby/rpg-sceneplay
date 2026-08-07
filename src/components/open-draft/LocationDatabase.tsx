import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { api, type LocationEntry } from '@/services/api'
import { showToast } from './Toast'
import { useDelayedUnmount, useSwipeDismiss } from '@/hooks/useTouch'
import { blockContentRange, singleLine } from '@/utils/open-draft/nodeText'

interface Props {
  editor: Editor | null
  style?: React.CSSProperties
}

const TYPE_LABEL: Record<string, string> = {
  interior: 'Interior',
  exterior: 'Exterior',
  both: 'Both',
}

/** Parse location name from a scene heading string. */
const PREFIX_RE = /^(INT\.?\/?EXT\.?|EXT\.?\/?INT\.?|INT\.?|EXT\.?|I\/E\.?)\s+/i
const TIME_WORDS =
  'DAY|NIGHT|DAWN|DUSK|MORNING|AFTERNOON|EVENING|SUNSET|SUNRISE|LATER|CONTINUOUS|SAME TIME|MOMENTS LATER|SAME|MAGIC HOUR'

function parseLocationFromHeading(heading: string): string {
  let rest = heading.trim()
  const prefix = rest.match(PREFIX_RE)
  if (prefix && prefix.index !== undefined)
    rest = rest.slice(prefix.index + prefix[0].length)
  const dashTime = rest.match(new RegExp(`\\s+-\\s+(${TIME_WORDS})\\.?$`, 'i'))
  if (dashTime) rest = rest.slice(0, -dashTime[0].length)
  else {
    const dotTime = rest.match(new RegExp(`\\.\\s*(${TIME_WORDS})\\.?$`, 'i'))
    if (dotTime) rest = rest.slice(0, -dotTime[0].length)
  }
  return rest.replace(/^[\s.]+|[\s.]+$/g, '').toUpperCase()
}

const LocationDatabase: React.FC<Props> = ({ editor, style }) => {
  const { locationDatabaseOpen, toggleLocationDatabase, scenes } =
    useEditorStore()
  const { currentProject } = useProjectStore()
  const [locations, setLocations] = useState<LocationEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<LocationEntry>>({})
  const [search, setSearch] = useState('')

  const panelRef = useRef<HTMLDivElement>(null)

  const { shouldRender, animationState } = useDelayedUnmount(
    locationDatabaseOpen,
    250,
  )
  useSwipeDismiss(panelRef, {
    direction: 'right',
    onDismiss: toggleLocationDatabase,
    enabled: shouldRender,
  })

  // Load locations when panel opens or project changes
  useEffect(() => {
    if (!locationDatabaseOpen || !currentProject) return
    let cancelled = false
    setLoading(true)
    api
      .listLocations(currentProject.id)
      .then((list) => {
        if (!cancelled) setLocations(list)
      })
      .catch((err) => {
        if (!cancelled)
          showToast(
            err instanceof Error ? err.message : 'Failed to load locations',
            'error',
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [locationDatabaseOpen, currentProject])

  // Map location name → scenes referencing it, derived from current scenes store
  const locationSceneCounts = useMemo(() => {
    const counts = new Map<string, number[]>()
    scenes.forEach((scene, i) => {
      const name = parseLocationFromHeading(scene.heading)
      if (!name) return
      if (!counts.has(name)) counts.set(name, [])
      counts.get(name)!.push(i)
    })
    return counts
  }, [scenes])

  const getSceneCount = useCallback(
    (loc: LocationEntry): number => {
      const fromName = locationSceneCounts.get(loc.name)?.length || 0
      const fromAliases = loc.aliases.reduce(
        (sum, a) => sum + (locationSceneCounts.get(a)?.length || 0),
        0,
      )
      return fromName + fromAliases
    },
    [locationSceneCounts],
  )

  const discovered = useCallback(async () => {
    if (!currentProject) return
    setLoading(true)
    try {
      const result = await api.discoverLocations(currentProject.id)
      setLocations(result.locations)
      if (result.discovered > 0) {
        showToast(
          `Discovered ${result.discovered} new location${result.discovered === 1 ? '' : 's'}`,
          'success',
        )
      } else {
        showToast('No new locations found', 'success')
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Discovery failed',
        'error',
      )
    } finally {
      setLoading(false)
    }
  }, [currentProject])

  const startEdit = useCallback((loc: LocationEntry) => {
    setEditingId(loc.id)
    setDraft({ ...loc })
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setDraft({})
  }, [])

  const saveEdit = useCallback(async () => {
    if (!currentProject || !editingId) return
    try {
      const updated = await api.updateLocation(
        currentProject.id,
        editingId,
        draft,
      )
      setLocations((prev) =>
        prev.map((l) => (l.id === editingId ? updated : l)),
      )
      setEditingId(null)
      setDraft({})
      showToast('Location updated', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error')
    }
  }, [currentProject, editingId, draft])

  const handleDelete = useCallback(
    async (loc: LocationEntry) => {
      if (!currentProject) return
      if (
        !window.confirm(
          `Delete location "${loc.name}"? Scene headings will not be changed.`,
        )
      )
        return
      try {
        await api.deleteLocation(currentProject.id, loc.id)
        setLocations((prev) => prev.filter((l) => l.id !== loc.id))
        if (selectedId === loc.id) setSelectedId(null)
        showToast('Location deleted', 'success')
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Delete failed', 'error')
      }
    },
    [currentProject, selectedId],
  )

  const handleRenameInHeadings = useCallback(
    (loc: LocationEntry, newName: string) => {
      if (!editor) return
      const oldName = loc.name
      const canonical = newName.trim().toUpperCase()
      if (!canonical || canonical === oldName) return
      const { state } = editor
      const { tr } = state
      let changed = 0
      let skippedBroken = 0
      state.doc.descendants((node, pos) => {
        if (node.type.name !== 'sceneHeading') return true
        const text = node.textContent
        // A heading containing a hard break can't be rewritten: insertText over
        // the inline range would flatten the break into plain text. Skip it and
        // report, rather than silently reformatting the writer's content.
        if (text.includes('\n')) {
          if (parseLocationFromHeading(singleLine(text)) === oldName)
            skippedBroken++
          return true
        }
        const parsed = parseLocationFromHeading(text)
        if (parsed !== oldName) return true
        // Replace the location portion in the heading
        const newText = text.replace(
          new RegExp(oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
          canonical,
        )
        if (newText === text) return true
        // Derive the range from nodeSize, never `pos + 1 + text.length` — the
        // latter is short by one per inline atom, leaving the heading's tail
        // behind and duplicating it.
        const { from, to } = blockContentRange(node, pos)
        tr.insertText(newText, from, to)
        changed++
        return true
      })
      if (changed > 0) editor.view.dispatch(tr)
      if (skippedBroken > 0) {
        showToast(
          `Skipped ${skippedBroken} scene heading${skippedBroken === 1 ? '' : 's'} containing a line break`,
          'info',
        )
      }
      return changed
    },
    [editor],
  )

  const goToScene = useCallback(
    (sceneIndex: number) => {
      if (!editor) return
      const { doc } = editor.state
      let currentScene = -1
      let targetPos = 0
      doc.descendants((node, pos) => {
        if (node.type.name === 'sceneHeading') {
          currentScene++
          if (currentScene === sceneIndex) {
            targetPos = pos
            return false
          }
        }
        return true
      })
      editor
        .chain()
        .focus()
        .setTextSelection(targetPos + 1)
        .run()
    },
    [editor],
  )

  const filteredLocations = useMemo(() => {
    const q = search.trim().toUpperCase()
    if (!q) return locations
    return locations.filter(
      (l) =>
        l.name.includes(q) ||
        l.fullName.toUpperCase().includes(q) ||
        l.aliases.some((a) => a.includes(q)) ||
        l.address.toUpperCase().includes(q),
    )
  }, [locations, search])

  const selected = selectedId
    ? locations.find((l) => l.id === selectedId)
    : null

  if (!shouldRender) return null

  const panelClass =
    animationState === 'entered'
      ? 'panel-open'
      : animationState === 'exiting'
        ? 'panel-closing'
        : ''

  return (
    <div
      ref={panelRef}
      className={`location-database w-105 min-w-80 max-w-[50vw] bg-(--fd-navigator-bg) border-l border-(--fd-border) flex flex-col overflow-hidden ${panelClass}`}
      style={style}
    >
      <div className="flex items-center gap-[10px] py-[10px] px-[14px] border-b border-(--fd-border) shrink-0">
        <span className="font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text) flex-1">
          Locations
        </span>
        <button
          className="bg-transparent border border-(--fd-border) text-(--fd-text-muted) py-1 px-2.5 rounded text-[11px] cursor-pointer transition-all duration-150 enabled:hover:bg-(--fd-overlay-subtle) enabled:hover:text-(--fd-text)"
          onClick={discovered}
          disabled={loading}
          title="Scan scripts and auto-create location entries"
        >
          {loading ? 'Scanning…' : '⟳ Discover'}
        </button>
        <button
          className="bg-transparent border border-(--fd-border) text-(--fd-text-muted) px-2 rounded text-lg leading-normal cursor-pointer transition-all duration-150 hover:bg-(--fd-overlay-subtle) hover:text-(--fd-text)"
          onClick={toggleLocationDatabase}
          title="Close"
        >
          ×
        </button>
      </div>

      <div className="py-2 px-[14px] border-b border-(--fd-border)">
        <input
          className="w-full py-1.5 px-2.5 bg-(--fd-overlay-subtle) border border-(--fd-border) rounded text-(--fd-text) text-xs"
          type="text"
          placeholder="Search locations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[180px] border-r border-(--fd-border) overflow-y-auto py-1">
          {loading && locations.length === 0 ? (
            <div className="py-6 px-4 text-(--fd-text-muted) text-xs italic text-center">
              Loading…
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="py-6 px-4 text-(--fd-text-muted) text-xs italic text-center">
              {locations.length === 0
                ? 'No locations yet. Click Discover to auto-create from scene headings.'
                : 'No locations match your search.'}
            </div>
          ) : (
            filteredLocations.map((loc) => (
              <div
                key={loc.id}
                className={`py-2.5 pr-3 border-b border-(--fd-overlay-subtle) cursor-pointer transition-[background] duration-100 hover:bg-(--fd-overlay-subtle) ${selectedId === loc.id ? 'bg-(--fd-overlay-light) border-l-[3px] border-(--fd-accent) pl-2.25' : 'pl-3'}`}
                onClick={() => setSelectedId(loc.id)}
              >
                <div className="flex items-center gap-[6px]">
                  <span className="flex-1 text-xs font-semibold text-(--fd-text) whitespace-nowrap overflow-hidden text-ellipsis">
                    {loc.name}
                  </span>
                  <span className="text-[10px] text-(--fd-text-muted) bg-(--fd-overlay-light) py-[1px] px-[6px] rounded-full shrink-0">
                    {getSceneCount(loc)}
                  </span>
                </div>
                <div className="flex items-center gap-[6px] mt-1 text-[10px] text-(--fd-text-muted)">
                  <span
                    className={`py-px px-1.5 rounded-[3px] bg-(--fd-overlay-subtle) uppercase tracking-[0.03em] ${loc.type === 'interior' ? 'text-[#3b82f6]' : loc.type === 'exterior' ? 'text-[#f59e0b]' : 'text-[#8b5cf6]'}`}
                  >
                    {TYPE_LABEL[loc.type] || loc.type}
                  </span>
                  {loc.address && (
                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {loc.address}
                    </span>
                  )}
                </div>
                {loc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-[3px] mt-1">
                    {loc.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] py-px px-1.25 bg-(--fd-overlay-light) text-(--fd-text-muted) rounded-[3px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {selected && (
          <div className="flex-1 px-[18px] py-[14px] overflow-y-auto">
            {editingId === selected.id ? (
              <LocationEditor
                draft={draft}
                setDraft={setDraft}
                onSave={saveEdit}
                onCancel={cancelEdit}
                originalName={selected.name}
                onRenameHeadings={(newName) => {
                  const n = handleRenameInHeadings(selected, newName)
                  if (n && n > 0)
                    showToast(
                      `Renamed ${n} scene heading${n === 1 ? '' : 's'}`,
                      'success',
                    )
                }}
              />
            ) : (
              <LocationDetailView
                loc={selected}
                sceneIndices={(
                  locationSceneCounts.get(selected.name) || []
                ).concat(
                  ...selected.aliases.map(
                    (a) => locationSceneCounts.get(a) || [],
                  ),
                )}
                scenes={scenes}
                onEdit={() => startEdit(selected)}
                onDelete={() => handleDelete(selected)}
                onGoToScene={goToScene}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface DetailViewProps {
  loc: LocationEntry
  sceneIndices: number[]
  scenes: Array<{
    id: string
    heading: string
    synopsis: string
    color: string
    sceneNumber?: number | null
  }>
  onEdit: () => void
  onDelete: () => void
  onGoToScene: (sceneIndex: number) => void
}

const LocationDetailView: React.FC<DetailViewProps> = ({
  loc,
  sceneIndices,
  scenes,
  onEdit,
  onDelete,
  onGoToScene,
}) => (
  <>
    <div className="flex items-center gap-[10px] mb-3 pb-[10px] border-b border-(--fd-border)">
      <h3 className="m-0 flex-1 text-base text-(--fd-text)">{loc.name}</h3>
      <div className="flex gap-[6px]">
        <button
          onClick={onEdit}
          className="py-1 px-2.5 text-[11px] bg-(--fd-overlay-subtle) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer hover:bg-(--fd-overlay-light)"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="py-1 px-2.5 text-[11px] bg-(--fd-overlay-subtle) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer hover:bg-(--fd-overlay-light) text-[#ef4444]!"
        >
          Delete
        </button>
      </div>
    </div>
    {loc.fullName && (
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Full Name
        </label>
        <div className="text-[13px] text-(--fd-text)">{loc.fullName}</div>
      </div>
    )}
    <div className="mb-3">
      <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
        Type
      </label>
      <div className="text-[13px] text-(--fd-text)">{TYPE_LABEL[loc.type]}</div>
    </div>
    {loc.address && (
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Address
        </label>
        <div className="text-[13px] text-(--fd-text)">{loc.address}</div>
      </div>
    )}
    {loc.contact && (
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Contact
        </label>
        <div className="text-[13px] text-(--fd-text)">{loc.contact}</div>
      </div>
    )}
    {loc.availability && (
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Availability
        </label>
        <div className="text-[13px] text-(--fd-text)">{loc.availability}</div>
      </div>
    )}
    {loc.notes && (
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Notes
        </label>
        <div
          className="text-[13px] text-(--fd-text)"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {loc.notes}
        </div>
      </div>
    )}
    {loc.aliases.length > 0 && (
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Aliases
        </label>
        <div className="text-[13px] text-(--fd-text)">
          {loc.aliases.join(', ')}
        </div>
      </div>
    )}
    {loc.tags.length > 0 && (
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Tags
        </label>
        <div className="flex flex-wrap gap-[3px] mt-1">
          {loc.tags.map((t) => (
            <span
              key={t}
              className="text-[9px] py-px px-1.25 bg-(--fd-overlay-light) text-(--fd-text-muted) rounded-[3px]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    )}
    <div className="mb-3">
      <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
        Scenes ({sceneIndices.length})
      </label>
      <div className="max-h-[300px] overflow-y-auto">
        {sceneIndices.length === 0 ? (
          <em>No scenes reference this location.</em>
        ) : (
          sceneIndices.map((sceneIdx) => {
            const scene = scenes[sceneIdx]
            if (!scene) return null
            return (
              <div
                key={sceneIdx}
                className="flex items-center gap-2 py-[5px] px-2 cursor-pointer rounded-[3px] hover:bg-(--fd-overlay-subtle)"
                onClick={() => onGoToScene(sceneIdx)}
              >
                <span className="text-[10px] text-(--fd-text-muted) min-w-[22px]">
                  {sceneIdx + 1}
                </span>
                <span className="text-xs text-(--fd-text) whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                  {scene.heading}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  </>
)

interface EditorProps {
  draft: Partial<LocationEntry>
  setDraft: React.Dispatch<React.SetStateAction<Partial<LocationEntry>>>
  onSave: () => void
  onCancel: () => void
  originalName: string
  onRenameHeadings: (newName: string) => void
}

const LocationEditor: React.FC<EditorProps> = ({
  draft,
  setDraft,
  onSave,
  onCancel,
  originalName,
  onRenameHeadings,
}) => {
  const set = (patch: Partial<LocationEntry>) =>
    setDraft((d) => ({ ...d, ...patch }))
  const currentName = (draft.name || '').toUpperCase()
  const nameChanged = currentName !== originalName && currentName.length > 0

  return (
    <>
      <div className="flex items-center gap-[10px] mb-3 pb-[10px] border-b border-(--fd-border)">
        <h3 className="m-0 flex-1 text-base text-(--fd-text)">Edit Location</h3>
        <div className="flex gap-[6px]">
          <button
            onClick={onCancel}
            className="py-1 px-2.5 text-[11px] bg-(--fd-overlay-subtle) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer hover:bg-(--fd-overlay-light)"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="py-1 px-2.5 text-[11px] bg-(--fd-overlay-subtle) border border-(--fd-border) text-(--fd-text) rounded cursor-pointer hover:bg-(--fd-overlay-light) bg-(--fd-accent)! text-white! border-(--fd-accent)!"
          >
            Save
          </button>
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Name
        </label>
        <input
          className="w-full py-1.5 px-2.5 bg-(--fd-overlay-subtle) border border-(--fd-border) rounded text-(--fd-text) text-xs font-[inherit]"
          value={draft.name || ''}
          onChange={(e) => set({ name: e.target.value.toUpperCase() })}
        />
        {nameChanged && (
          <button
            className="bg-(--fd-overlay-subtle) border border-(--fd-border) text-(--fd-text-muted) rounded-[3px] py-0.75 px-2 text-[10px] cursor-pointer"
            style={{ marginTop: 4 }}
            onClick={() => onRenameHeadings(currentName)}
          >
            Rename in all scene headings →
          </button>
        )}
      </div>
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Full Name
        </label>
        <input
          className="w-full py-1.5 px-2.5 bg-(--fd-overlay-subtle) border border-(--fd-border) rounded text-(--fd-text) text-xs font-[inherit]"
          value={draft.fullName || ''}
          onChange={(e) => set({ fullName: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Type
        </label>
        <select
          className="w-full py-1.5 px-2.5 bg-(--fd-overlay-subtle) border border-(--fd-border) rounded text-(--fd-text) text-xs font-[inherit]"
          value={draft.type || 'interior'}
          onChange={(e) =>
            set({ type: e.target.value as LocationEntry['type'] })
          }
        >
          <option value="interior">Interior</option>
          <option value="exterior">Exterior</option>
          <option value="both">Both</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Address
        </label>
        <input
          className="w-full py-1.5 px-2.5 bg-(--fd-overlay-subtle) border border-(--fd-border) rounded text-(--fd-text) text-xs font-[inherit]"
          value={draft.address || ''}
          onChange={(e) => set({ address: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Contact
        </label>
        <input
          className="w-full py-1.5 px-2.5 bg-(--fd-overlay-subtle) border border-(--fd-border) rounded text-(--fd-text) text-xs font-[inherit]"
          value={draft.contact || ''}
          onChange={(e) => set({ contact: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Availability
        </label>
        <input
          className="w-full py-1.5 px-2.5 bg-(--fd-overlay-subtle) border border-(--fd-border) rounded text-(--fd-text) text-xs font-[inherit]"
          value={draft.availability || ''}
          onChange={(e) => set({ availability: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Notes
        </label>
        <textarea
          className="w-full py-1.5 px-2.5 bg-(--fd-overlay-subtle) border border-(--fd-border) rounded text-(--fd-text) text-xs font-[inherit] resize-y"
          value={draft.notes || ''}
          onChange={(e) => set({ notes: e.target.value })}
          rows={4}
        />
      </div>
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Aliases (comma-separated)
        </label>
        <input
          className="w-full py-1.5 px-2.5 bg-(--fd-overlay-subtle) border border-(--fd-border) rounded text-(--fd-text) text-xs font-[inherit]"
          value={(draft.aliases || []).join(', ')}
          onChange={(e) =>
            set({
              aliases: e.target.value
                .split(',')
                .map((s) => s.trim().toUpperCase())
                .filter(Boolean),
            })
          }
        />
      </div>
      <div className="mb-3">
        <label className="block text-[10px] uppercase tracking-[0.05em] text-(--fd-text-muted) mb-1 font-semibold">
          Tags (comma-separated)
        </label>
        <input
          className="w-full py-1.5 px-2.5 bg-(--fd-overlay-subtle) border border-(--fd-border) rounded text-(--fd-text) text-xs font-[inherit]"
          value={(draft.tags || []).join(', ')}
          onChange={(e) =>
            set({
              tags: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
    </>
  )
}

export default LocationDatabase
