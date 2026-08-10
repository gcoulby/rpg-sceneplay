import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { Asset } from '@/stores/assetStore'
import {
  ELEMENT_LABELS,
  type NoteColor,
  type ElementType,
} from '@/stores/editorStore'
import NoteContentDisplay from './NoteContentDisplay'
import NoteColorPicker from './NoteColorPicker'
import AssetSuggestionList from './AssetSuggestionList'
import { getNoteColorHex, type ScriptNote } from './noteTypes'

interface ScriptNoteCardProps {
  note: ScriptNote
  sceneName: string | null
  isEditing: boolean
  assets: Asset[]
  projectId: string | null
  onStartEdit: () => void
  onStopEdit: () => void
  onContentChange: (content: string) => void
  onColorChange: (color: NoteColor) => void
  onDeleteRequest: () => void
  onNavigateToNote: () => void
  onFilterByContext: (contextLabel: string) => void
  formatDate: (iso: string) => string
}

const ScriptNoteCard: React.FC<ScriptNoteCardProps> = ({
  note,
  sceneName,
  isEditing,
  assets,
  projectId,
  onStartEdit,
  onStopEdit,
  onContentChange,
  onColorChange,
  onDeleteRequest,
  onNavigateToNote,
  onFilterByContext,
  formatDate,
}) => {
  const [assetQuery, setAssetQuery] = useState<string | null>(null)
  const [assetSuggestions, setAssetSuggestions] = useState<Asset[]>([])
  const [assetSugIdx, setAssetSugIdx] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTextareaChange = useCallback(
    (value: string) => {
      onContentChange(value)
      const textarea = textareaRef.current
      if (!textarea) return
      const cursor = textarea.selectionStart
      const before = value.slice(0, cursor)
      const atMatch = before.match(/@(\S*)$/)
      if (atMatch) {
        const query = atMatch[1].toLowerCase()
        setAssetQuery(query)
        const matches = assets
          .filter(
            (a) =>
              a.original_name.toLowerCase().includes(query) ||
              a.original_name
                .replace(/\s+/g, '_')
                .toLowerCase()
                .includes(query),
          )
          .slice(0, 8)
        setAssetSuggestions(matches)
        setAssetSugIdx(0)
      } else {
        setAssetQuery(null)
        setAssetSuggestions([])
      }
    },
    [onContentChange, assets],
  )

  const insertAssetRef = useCallback(
    (asset: Asset) => {
      const textarea = textareaRef.current
      if (!textarea) return
      const cursor = textarea.selectionStart
      const before = note.content.slice(0, cursor)
      const after = note.content.slice(cursor)
      const atMatch = before.match(/@(\S*)$/)
      if (!atMatch) return

      const prefix = before.slice(0, before.length - atMatch[0].length)
      const ref = `@${asset.original_name.replace(/\s+/g, '_')}`
      const newContent = prefix + ref + ' ' + after
      onContentChange(newContent)

      setAssetQuery(null)
      setAssetSuggestions([])

      requestAnimationFrame(() => {
        const pos = prefix.length + ref.length + 1
        textarea.setSelectionRange(pos, pos)
        textarea.focus()
      })
    },
    [note.content, onContentChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (assetSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setAssetSugIdx((i) => Math.min(i + 1, assetSuggestions.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setAssetSugIdx((i) => Math.max(i - 1, 0))
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          insertAssetRef(assetSuggestions[assetSugIdx])
        } else if (e.key === 'Escape') {
          setAssetQuery(null)
          setAssetSuggestions([])
        }
      }
    },
    [assetSuggestions, assetSugIdx, insertAssetRef],
  )

  const hex = getNoteColorHex(note.color)
  const elemLabel =
    ELEMENT_LABELS[note.elementType as ElementType] || note.elementType

  return (
    <div
      className="note-item bg-(--fd-dropdown-bg) border border-(--fd-border) border-l-3 border-l-(--fd-accent) rounded-md p-2.5 mb-2 flex flex-col gap-1.5 transition-colors hover:border-[#555]"
      style={{ borderLeftColor: hex }}
    >
      <div className="flex justify-between items-start gap-1.5">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] text-(--fd-accent) font-semibold uppercase tracking-[0.3px]">
            {elemLabel}
          </span>
          {note.contextLabel && (
            <span
              className="max-w-42.5 overflow-hidden font-medium text-[#e89b4f] text-[10px] hover:underline text-ellipsis whitespace-nowrap cursor-pointer"
              onClick={() => onFilterByContext(note.contextLabel!)}
              title={`Filter by "${note.contextLabel}"`}
            >
              {note.contextLabel}
            </span>
          )}
          {sceneName && (
            <span className="text-[10px] text-(--fd-text-muted) whitespace-nowrap overflow-hidden text-ellipsis max-w-42.5">
              {sceneName}
            </span>
          )}
        </div>
        <span className="text-[10px] text-(--fd-text-muted) whitespace-nowrap shrink-0">
          {formatDate(note.createdAt)}
        </span>
      </div>

      {note.anchorText && (
        <div
          className="text-[11px] text-(--fd-text-muted) italic py-1 px-2 bg-black/15 rounded-[3px] cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis transition-colors hover:text-(--fd-accent)"
          onClick={onNavigateToNote}
          title="Click to navigate to this text"
        >
          &ldquo;{note.anchorText}&rdquo;
        </div>
      )}

      {isEditing ? (
        <div className="relative">
          <Textarea
            ref={textareaRef}
            className="text-xs leading-[1.4]"
            value={note.content}
            onChange={(e) => handleTextareaChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setTimeout(() => {
                onStopEdit()
                setAssetQuery(null)
                setAssetSuggestions([])
              }, 200)
            }}
            placeholder="Write your note... (use @filename to reference assets, paste media URLs on their own line)"
            rows={3}
            autoFocus
          />
          {assetSuggestions.length > 0 && assetQuery !== null && (
            <AssetSuggestionList
              suggestions={assetSuggestions}
              activeIndex={assetSugIdx}
              onSelect={insertAssetRef}
            />
          )}
        </div>
      ) : (
        <div
          className="py-1 px-2 bg-black/12 border border-transparent rounded-[3px] cursor-pointer min-h-7 transition-colors hover:border-(--fd-border)"
          onClick={onStartEdit}
          title="Click to edit"
        >
          {note.content ? (
            <NoteContentDisplay
              content={note.content}
              assets={assets}
              projectId={projectId}
            />
          ) : (
            <span className="text-(--fd-text-muted) text-[11px] italic">
              Click to add note...
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

export default ScriptNoteCard
