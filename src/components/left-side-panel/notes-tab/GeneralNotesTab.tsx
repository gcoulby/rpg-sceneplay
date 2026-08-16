import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import GeneralNoteCard from './GeneralNoteCard'
import DeleteNoteDialog from './DeleteNoteDialog'
import type { Asset } from '@/stores/assetStore'
import type { NoteColor } from '@/stores/editorStore'
import type { GeneralNote } from './noteTypes'

interface GeneralNotesTabProps {
  generalNotes: GeneralNote[]
  assets: Asset[]
  onAdd: () => string
  onUpdateTitle: (id: string, title: string) => void
  onUpdateContent: (id: string, content: string) => void
  onUpdateColor: (id: string, color: NoteColor) => void
  onDelete: (id: string) => void
  formatDate: (iso: string) => string
}

const GeneralNotesTab: React.FC<GeneralNotesTabProps> = ({
  generalNotes,
  assets,
  onAdd,
  onUpdateTitle,
  onUpdateContent,
  onUpdateColor,
  onDelete,
  formatDate,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  return (
    <>
      <div className="flex items-center py-2 px-3 border-b border-(--fd-border) shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="text-xs text-(--fd-text-muted) hover:text-(--fd-accent) hover:border-(--fd-accent)"
          onClick={() => setEditingId(onAdd())}
        >
          + Add Note
        </Button>
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        {generalNotes.length === 0 ? (
          <div className="py-5 px-3 text-(--fd-text-muted) text-xs italic text-center leading-normal">
            No general notes yet. Click &ldquo;+ Add Note&rdquo; to create one.
          </div>
        ) : (
          generalNotes.map((gn) => (
            <GeneralNoteCard
              key={gn.id}
              note={gn}
              isEditing={editingId === gn.id}
              assets={assets}
              onStartEdit={() => setEditingId(gn.id)}
              onStopEdit={() =>
                setEditingId((cur) => (cur === gn.id ? null : cur))
              }
              onTitleChange={(title) => onUpdateTitle(gn.id, title)}
              onContentChange={(content) => onUpdateContent(gn.id, content)}
              onColorChange={(color) => onUpdateColor(gn.id, color)}
              onDeleteRequest={() => setPendingDeleteId(gn.id)}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
      <DeleteNoteDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        description="Delete this general note?"
        onConfirm={() => {
          if (!pendingDeleteId) return
          onDelete(pendingDeleteId)
          if (editingId === pendingDeleteId) setEditingId(null)
          setPendingDeleteId(null)
        }}
      />
    </>
  )
}

export default GeneralNotesTab
