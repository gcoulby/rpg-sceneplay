import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Asset } from '@/stores/assetStore'
import type { NoteColor } from '@/stores/editorStore'
import NoteContentDisplay from './NoteContentDisplay'
import NoteColorPicker from './NoteColorPicker'
import { getNoteColorHex, type GeneralNote } from './noteTypes'

interface GeneralNoteCardProps {
  note: GeneralNote
  isEditing: boolean
  assets: Asset[]
  onStartEdit: () => void
  onStopEdit: () => void
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onColorChange: (color: NoteColor) => void
  onDeleteRequest: () => void
  formatDate: (iso: string) => string
}

const GeneralNoteCard: React.FC<GeneralNoteCardProps> = ({
  note,
  isEditing,
  assets,
  onStartEdit,
  onStopEdit,
  onTitleChange,
  onContentChange,
  onColorChange,
  onDeleteRequest,
  formatDate,
}) => {
  const hex = getNoteColorHex(note.color)

  return (
    <div
      className="note-item bg-(--fd-dropdown-bg) border border-(--fd-border) border-l-3 border-l-(--fd-accent) rounded-md p-2.5 mb-2 flex flex-col gap-1.5 transition-colors hover:border-[#555]"
      style={{ borderLeftColor: hex }}
    >
      <div className="flex justify-between items-start gap-1.5">
        <span className="text-[10px] text-(--fd-text-muted) whitespace-nowrap shrink-0">
          {formatDate(note.createdAt)}
        </span>
      </div>
      {isEditing ? (
        <>
          <Input
            className="border-none border-b border-(--fd-border) rounded-none font-semibold text-[13px] px-0 mb-1.5 focus-visible:ring-0 focus-visible:border-(--fd-accent)"
            value={note.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Note title..."
            autoFocus
          />
          <Textarea
            className="text-xs leading-[1.4]"
            value={note.content}
            onChange={(e) => onContentChange(e.target.value)}
            onBlur={() => setTimeout(onStopEdit, 200)}
            placeholder="Write your note..."
            rows={4}
          />
        </>
      ) : (
        <div
          className="py-1 px-2 bg-black/12 border border-transparent rounded-[3px] cursor-pointer min-h-7 transition-colors hover:border-(--fd-border)"
          onClick={onStartEdit}
          title="Click to edit"
        >
          {note.title && (
            <div className="font-semibold text-[13px] text-(--fd-text) mb-1">
              {note.title}
            </div>
          )}
          {note.content ? (
            <NoteContentDisplay content={note.content} assets={assets} />
          ) : (
            <span className="text-(--fd-text-muted) text-[11px] italic">
              {note.title ? '' : 'Click to add note...'}
            </span>
          )}
        </div>
      )}
      <div className="flex justify-between items-center">
        <NoteColorPicker value={note.color} onChange={onColorChange} />
        <Button
          variant="ghost"
          size="sm"
          className="h-auto text-(--fd-text-muted) text-[11px] py-0.5 px-1.5 hover:text-[#ff6b6b]"
          onClick={onDeleteRequest}
          title="Delete note"
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

export default GeneralNoteCard
