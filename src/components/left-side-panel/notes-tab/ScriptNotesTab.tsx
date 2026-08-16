import React, { useCallback, useMemo, useState } from 'react'
import ScriptNotesFilterBar from './ScriptNotesFilterBar'
import ScriptNoteCard from './ScriptNoteCard'
import DeleteNoteDialog from './DeleteNoteDialog'
import type { NoteColor, NoteFilter } from '@/stores/editorStore'
import type { Asset } from '@/stores/assetStore'
import type { ScriptNote } from './noteTypes'

interface ScriptNotesTabProps {
  notes: ScriptNote[]
  noteFilter: NoteFilter
  onFilterChange: (filter: NoteFilter) => void
  getSceneName: (sceneId: string | null) => string | null
  assets: Asset[]
  onContentChange: (id: string, content: string) => void
  onColorChange: (id: string, color: NoteColor) => void
  onDelete: (id: string) => void
  onNavigateToNote: (id: string) => void
  formatDate: (iso: string) => string
}

const ScriptNotesTab: React.FC<ScriptNotesTabProps> = ({
  notes,
  noteFilter,
  onFilterChange,
  getSceneName,
  assets,
  onContentChange,
  onColorChange,
  onDelete,
  onNavigateToNote,
  formatDate,
}) => {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const [localFilter, setLocalFilter] = useState<NoteFilter>(noteFilter)
  const [prevNoteFilter, setPrevNoteFilter] = useState(noteFilter)
  if (noteFilter !== prevNoteFilter) {
    setPrevNoteFilter(noteFilter)
    setLocalFilter(noteFilter)
  }

  const filterOptions = useMemo(() => {
    const types = new Set<string>()
    const contexts = new Set<string>()
    for (const n of notes) {
      types.add(n.elementType)
      if (n.contextLabel) contexts.add(n.contextLabel)
    }
    return {
      types: Array.from(types).sort(),
      contexts: Array.from(contexts).sort(),
    }
  }, [notes])

  const colorCounts = useMemo(() => {
    const map = new Map<NoteColor, number>()
    for (const n of notes) map.set(n.color, (map.get(n.color) || 0) + 1)
    return map
  }, [notes])

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (localFilter.noteId) return n.id === localFilter.noteId
      if (localFilter.elementType && n.elementType !== localFilter.elementType)
        return false
      if (
        localFilter.contextLabel &&
        n.contextLabel !== localFilter.contextLabel
      )
        return false
      if (localFilter.color && n.color !== localFilter.color) return false
      return true
    })
  }, [notes, localFilter])

  const isFiltered = !!(
    localFilter.elementType ||
    localFilter.contextLabel ||
    localFilter.color ||
    localFilter.noteId
  )

  const updateFilter = useCallback(
    (next: NoteFilter) => {
      setLocalFilter(next)
      onFilterChange(next)
    },
    [onFilterChange],
  )

  const handleClearFilter = useCallback(() => {
    updateFilter({
      elementType: null,
      contextLabel: null,
      color: null,
      noteId: null,
    })
  }, [updateFilter])

  const handleElementTypeChange = useCallback(
    (type: string) =>
      updateFilter({ ...localFilter, elementType: type || null }),
    [localFilter, updateFilter],
  )
  const handleContextLabelChange = useCallback(
    (label: string) =>
      updateFilter({ ...localFilter, contextLabel: label || null }),
    [localFilter, updateFilter],
  )
  const handleToggleColor = useCallback(
    (color: NoteColor) =>
      updateFilter({
        ...localFilter,
        color: localFilter.color === color ? null : color,
      }),
    [localFilter, updateFilter],
  )

  return (
    <>
      <ScriptNotesFilterBar
        filter={localFilter}
        types={filterOptions.types}
        contexts={filterOptions.contexts}
        colorCounts={colorCounts}
        isFiltered={isFiltered}
        onElementTypeChange={handleElementTypeChange}
        onContextLabelChange={handleContextLabelChange}
        onToggleColor={handleToggleColor}
        onClearFilter={handleClearFilter}
      />

      <div className="flex-1 p-2 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="py-5 px-3 text-(--fd-text-muted) text-xs italic text-center leading-normal">
            {notes.length === 0
              ? 'No notes yet. Select text in the editor, right-click, and choose "Add Script Note".'
              : 'No notes match this filter.'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <ScriptNoteCard
              key={note.id}
              note={note}
              sceneName={getSceneName(note.sceneId)}
              isEditing={editingNoteId === note.id}
              assets={assets}
              onStartEdit={() => setEditingNoteId(note.id)}
              onStopEdit={() =>
                setEditingNoteId((cur) => (cur === note.id ? null : cur))
              }
              onContentChange={(content) => onContentChange(note.id, content)}
              onColorChange={(color) => onColorChange(note.id, color)}
              onDeleteRequest={() => setPendingDeleteId(note.id)}
              onNavigateToNote={() => onNavigateToNote(note.id)}
              onFilterByContext={handleContextLabelChange}
              formatDate={formatDate}
            />
          ))
        )}
      </div>

      <DeleteNoteDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        description="Delete this note? The highlight will also be removed from the script."
        onConfirm={() => {
          if (!pendingDeleteId) return
          onDelete(pendingDeleteId)
          setPendingDeleteId(null)
        }}
      />
    </>
  )
}

export default ScriptNotesTab
