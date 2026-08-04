import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaCloud, FaDesktop } from 'react-icons/fa'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api } from '@/services/api'
import { cloudApi } from '@/services/cloudApi'
import { projectApi } from '@/services/projectApi'
import type { ProjectInfo, ScriptMeta, VersionInfo } from '@/services/api'
import { parseFountain } from '@/utils/fountainParser'
import { parseFDXFull } from '@/utils/fdxParser'
import { downloadFDX } from '@/utils/fdxExporter'
import { downloadFountain } from '@/utils/fountainExporter'
import { exportPDF } from '@/utils/pdfExporter'
import { downloadOdraft, parseOdraft } from '@/utils/odraftFormat'
import { exportProjectAsZip } from '@/utils/zipExport'
import {
  DEFAULT_PAGE_LAYOUT,
  DEFAULT_TAG_CATEGORIES,
  useEditorStore,
} from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import AssetManager from './AssetManager'
import ProjectPropertiesDialog from './ProjectPropertiesDialog'

/** Dropdown button: "+ New Document" → Screenplay | Treatment. */
const NewDocumentButton: React.FC<{
  onCreateScreenplay: () => void
  onCreateTreatment: () => void
}> = ({ onCreateScreenplay, onCreateTreatment }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div className="inline-block relative" ref={ref}>
      <button
        className="h-8 px-4 bg-(--fd-dropdown-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs cursor-pointer transition-all duration-150 hover:border-(--fd-accent) hover:text-(--fd-accent)"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        + New Document ▾
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-1000 bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-md shadow-[0_6px_20px_rgba(0,0,0,0.35)] min-w-70 overflow-hidden [&_button]:flex [&_button]:flex-col [&_button]:items-start [&_button]:w-full [&_button]:px-3.5 [&_button]:py-2.5 [&_button]:bg-transparent [&_button]:border-none [&_button]:text-left [&_button]:cursor-pointer [&_button]:text-(--fd-text) [&_button]:gap-0.5 [&_button]:transition-colors [&_button:hover]:bg-(--fd-overlay-subtle) [&_button+button]:border-t [&_button+button]:border-(--fd-overlay-subtle) [&_strong]:text-[13px] [&_strong]:font-semibold [&_span]:text-[11px] [&_span]:text-(--fd-text-muted)"
          role="menu"
        >
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onCreateScreenplay()
            }}
          >
            <strong>Screenplay</strong>
            <span>Full-format script with scenes and dialogue</span>
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onCreateTreatment()
            }}
          >
            <strong>Treatment</strong>
            <span>Prose narrative (5–25 pages) of the story</span>
          </button>
        </div>
      )}
    </div>
  )
}
import { showToast } from './Toast'

const ITEM_COLORS = [
  '#e06060',
  '#e89b4f',
  '#f4d35e',
  '#6abf69',
  '#4a9eff',
  '#6fa8dc',
  '#b58ee0',
  '#9370DB',
  '#e06c9f',
  '#d4a373',
  '#95a5a6',
  '',
]

type TabKey = 'scripts' | 'assets' | 'versions'
type ScriptSortKey =
  | 'custom'
  | 'title'
  | 'created'
  | 'updated'
  | 'color'
  | 'size'
  | 'pages'

// ── Sortable script row ──────────────────────────────────────────────────

interface SortableScriptRowProps {
  script: ScriptMeta
  projectId: string
  source: 'local' | 'cloud'
  sortKey: ScriptSortKey
  onNavigate: (id: string) => void
  onPin: (id: string, pinned: boolean) => void
  onColor: (id: string, color: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onDuplicate: (id: string) => void
  onExport: (id: string, format: string) => void
  formatDate: (iso: string) => string
  formatSize: (bytes: number) => string
}

const SortableScriptRow: React.FC<SortableScriptRowProps> = ({
  script,
  source,
  sortKey,
  onNavigate,
  onPin,
  onColor,
  onDelete,
  onRename,
  onDuplicate,
  onExport,
  formatDate,
  formatSize,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: script.id, disabled: sortKey !== 'custom' })

  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(script.title)
  const rowRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!showActions) return
    const handleClickOutside = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setShowActions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showActions])

  const handleRenameSubmit = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== script.title) {
      onRename(script.id, trimmed)
    } else {
      setEditTitle(script.title)
    }
    setEditing(false)
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined,
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        ;(rowRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node
      }}
      style={style}
      className={`flex items-center gap-3 bg-(--fd-navigator-bg) border rounded-md px-5 py-4 transition-colors relative hover:border-(--fd-accent) ${script.pinned ? 'border-[rgba(244,211,94,0.3)]' : 'border-(--fd-border)'}`}
    >
      {/* Color indicator */}
      {script.color && (
        <div
          className="self-stretch rounded-sm w-1 shrink-0"
          style={{ backgroundColor: script.color }}
        />
      )}

      {/* Drag handle */}
      {sortKey === 'custom' && (
        <div
          className="cursor-grab text-(--fd-text-muted) text-sm px-1.5 py-0.5 rounded-sm select-none shrink-0 active:cursor-grabbing hover:text-(--fd-text) hover:bg-(--fd-overlay-subtle)"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          &#x2630;
        </div>
      )}

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => {
          if (showActions) {
            setShowActions(false)
            return
          }
          if (!editing) onNavigate(script.id)
        }}
      >
        {editing ? (
          <input
            className="bg-transparent border border-(--fd-accent) rounded-sm text-(--fd-text) text-[length:inherit] [font-weight:inherit] font-[inherit] px-1 py-0.5 w-full outline-none box-border"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit()
              if (e.key === 'Escape') {
                setEditTitle(script.title)
                setEditing(false)
              }
            }}
            onBlur={handleRenameSubmit}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div
            className="text-base font-medium text-(--fd-text) mb-1 leading-[1.4]"
            onDoubleClick={(e) => {
              e.stopPropagation()
              setEditing(true)
              setEditTitle(script.title)
            }}
            title="Double-click to rename"
          >
            {script.title}
          </div>
        )}
        <div className="text-[13px] text-(--fd-text-muted)">
          <span>Created {formatDate(script.created_at)}</span>
          <span className="text-(--fd-text-muted)">&middot;</span>
          <span>Modified {formatDate(script.updated_at)}</span>
          {script.page_count > 0 && (
            <>
              <span className="text-(--fd-text-muted)">&middot;</span>
              <span>{script.page_count} pg</span>
            </>
          )}
          <span className="text-(--fd-text-muted)">&middot;</span>
          <span>{formatSize(script.size_bytes)}</span>
          <span className="text-(--fd-text-muted)">&middot;</span>
          <span
            className={`inline-flex items-center gap-1 py-0.5 px-1.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-[0.4px] border ${source === 'cloud' ? 'text-[#5aa9ff] border-[rgba(90,169,255,0.4)] bg-[rgba(90,169,255,0.08)]' : 'text-(--fd-text-muted) border-(--fd-border) bg-(--fd-bg)'}`}
            title={
              source === 'cloud'
                ? 'Stored on OpenDraft Cloud'
                : 'Stored on this device'
            }
          >
            {source === 'cloud' ? <FaCloud /> : <FaDesktop />}
            {source === 'cloud' ? 'Cloud' : 'Local'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          className={`bg-transparent border-none text-sm px-1.5 py-[3px] rounded-[3px] cursor-pointer transition-all hover:text-(--fd-text) hover:bg-(--fd-overlay-light) ${script.pinned ? 'text-[#f4d35e]' : 'text-(--fd-text-muted)'}`}
          onClick={() => onPin(script.id, !script.pinned)}
          title={script.pinned ? 'Unpin' : 'Pin to top'}
        >
          &#x1F4CC;
        </button>
        <button
          className="bg-transparent border-none text-(--fd-text-muted) text-sm px-1.5 py-[3px] rounded-[3px] cursor-pointer transition-all hover:text-(--fd-text) hover:bg-(--fd-overlay-light)"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Set color"
        >
          <span
            className="inline-block border border-white/15 rounded-full w-3 h-3"
            style={{ backgroundColor: script.color || '#666' }}
          />
        </button>
        <button
          className="bg-transparent border-none text-(--fd-text-muted) text-base font-bold leading-none px-1.5 py-[3px] rounded-[3px] cursor-pointer transition-all hover:text-(--fd-text) hover:bg-(--fd-overlay-light)"
          onClick={() => setShowActions(!showActions)}
          title="More actions"
        >
          &#x22EE;
        </button>
      </div>

      {/* Actions dropdown */}
      {showActions && (
        <div
          className="absolute right-2.5 top-full mt-1 bg-(--fd-toolbar-bg) border border-(--fd-border) rounded-md py-1 z-200 min-w-[180px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              setEditing(true)
              setEditTitle(script.title)
              setShowActions(false)
            }}
          >
            Rename
          </div>
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              onDuplicate(script.id)
              setShowActions(false)
            }}
          >
            Duplicate
          </div>
          <div className="h-px bg-(--fd-border) my-1" />
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              onExport(script.id, 'fdx')
              setShowActions(false)
            }}
          >
            Export as FDX
          </div>
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              onExport(script.id, 'fountain')
              setShowActions(false)
            }}
          >
            Export as Fountain
          </div>
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              onExport(script.id, 'pdf')
              setShowActions(false)
            }}
          >
            Export as PDF
          </div>
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              onExport(script.id, 'odraft')
              setShowActions(false)
            }}
          >
            Export as .odraft
          </div>
          <div className="h-px bg-(--fd-border) my-1" />
          <div
            className="hover:bg-[rgba(255,107,107,0.1)] px-3.5 py-2 text-[#ff6b6b] text-[13px] transition-colors cursor-pointer"
            onClick={() => {
              onDelete(script.id)
              setShowActions(false)
            }}
          >
            Delete
          </div>
        </div>
      )}

      {showColorPicker && (
        <div
          className="absolute right-2.5 bottom-2.5 flex flex-wrap gap-1 bg-(--fd-toolbar-bg) border border-(--fd-border) rounded-md p-1.5 z-100 w-[140px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          {ITEM_COLORS.map((c) => (
            <button
              key={c || 'none'}
              className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform relative hover:scale-[1.2] ${script.color === c ? 'border-white shadow-[0_0_0_1px_var(--fd-accent)]' : 'border-transparent'}`}
              style={{ backgroundColor: c || '#555' }}
              onClick={() => {
                onColor(script.id, c)
                setShowColorPicker(false)
              }}
              title={c || 'No color'}
            >
              {!c && (
                <span className="absolute inset-0 flex justify-center items-center text-[#aaa] text-[10px]">
                  &#x2715;
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Script card (card view) ──────────────────────────────────────────────

interface ScriptCardProps {
  script: ScriptMeta
  source: 'local' | 'cloud'
  sortKey: ScriptSortKey
  onNavigate: (id: string) => void
  onPin: (id: string, pinned: boolean) => void
  onRename: (id: string, title: string) => void
  onDuplicate: (id: string) => void
  onExport: (id: string, format: string) => void
  onDelete: (id: string) => void
  formatDate: (iso: string) => string
}

const ScriptCard: React.FC<ScriptCardProps> = ({
  script,
  source,
  sortKey,
  onNavigate,
  onPin,
  onRename,
  onDuplicate,
  onExport,
  onDelete,
  formatDate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: script.id, disabled: sortKey !== 'custom' })

  const [showActions, setShowActions] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(script.title)
  const cardRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!showActions) return
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowActions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showActions])

  const handleRenameSubmit = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== script.title) {
      onRename(script.id, trimmed)
    } else {
      setEditTitle(script.title)
    }
    setEditing(false)
  }

  const handleCardClick = () => {
    // Don't navigate if menu is open, editing, or dragging
    if (showActions) {
      setShowActions(false)
      return
    }
    if (editing) return
    onNavigate(script.id)
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined,
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        ;(cardRef as React.MutableRefObject<HTMLDivElement | null>).current =
          node
      }}
      style={style}
      className={`bg-(--fd-navigator-bg) border rounded-lg p-4 cursor-pointer transition-colors relative overflow-visible min-h-[160px] flex flex-col hover:border-(--fd-accent) hover:shadow-[0_4px_12px_rgba(74,158,255,0.1)] ${script.pinned ? 'border-[rgba(244,211,94,0.4)]' : 'border-(--fd-border)'}`}
      onClick={handleCardClick}
    >
      {script.color && (
        <div
          className="top-0 right-0 left-0 absolute rounded-t-lg h-1"
          style={{ backgroundColor: script.color }}
        />
      )}
      <div className="flex justify-between items-start gap-1 mb-2">
        {/* Drag handle — only in custom sort */}
        {sortKey === 'custom' && (
          <div
            className="cursor-grab text-sm text-(--fd-text-muted) px-1 py-0.5 rounded-sm select-none shrink-0 opacity-50 transition-opacity active:cursor-grabbing hover:opacity-100 hover:bg-(--fd-overlay-light)"
            {...attributes}
            {...listeners}
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            &#x2630;
          </div>
        )}
        {editing ? (
          <input
            className="bg-transparent border border-(--fd-accent) rounded-sm text-(--fd-text) text-[length:inherit] [font-weight:inherit] font-[inherit] px-1 py-0.5 w-full outline-none box-border"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit()
              if (e.key === 'Escape') {
                setEditTitle(script.title)
                setEditing(false)
              }
            }}
            onBlur={handleRenameSubmit}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div
            className="text-[15px] font-semibold text-(--fd-text) flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
            onDoubleClick={(e) => {
              e.stopPropagation()
              setEditing(true)
              setEditTitle(script.title)
            }}
            title="Double-click to rename"
          >
            {script.title}
          </div>
        )}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            className={`bg-transparent border-none text-sm px-1.5 py-[3px] rounded-[3px] cursor-pointer transition-all hover:text-(--fd-text) hover:bg-(--fd-overlay-light) ${script.pinned ? 'text-[#f4d35e]' : 'text-(--fd-text-muted)'}`}
            onClick={(e) => {
              e.stopPropagation()
              onPin(script.id, !script.pinned)
            }}
            title={script.pinned ? 'Unpin' : 'Pin to top'}
          >
            &#x1F4CC;
          </button>
          <button
            className="bg-transparent border-none text-(--fd-text-muted) text-base font-bold leading-none px-1.5 py-[3px] rounded-[3px] cursor-pointer transition-all hover:text-(--fd-text) hover:bg-(--fd-overlay-light)"
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(!showActions)
            }}
            title="More actions"
          >
            &#x22EE;
          </button>
        </div>
      </div>
      <div className="text-[11px] text-(--fd-text-muted) leading-[1.5] flex-1 overflow-hidden line-clamp-5 font-[family-name:'Courier_Prime','Courier_New',monospace] whitespace-pre-line">
        {script.preview || 'Empty screenplay'}
      </div>
      <div className="text-[10px] text-(--fd-text-muted) mt-2 flex gap-2">
        {script.page_count > 0 && <span>{script.page_count} pg</span>}
        <span>{formatDate(script.updated_at)}</span>
        <span
          className={`inline-flex items-center gap-1 py-0.5 px-1.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-[0.4px] border ${source === 'cloud' ? 'text-[#5aa9ff] border-[rgba(90,169,255,0.4)] bg-[rgba(90,169,255,0.08)]' : 'text-(--fd-text-muted) border-(--fd-border) bg-(--fd-bg)'}`}
          title={
            source === 'cloud'
              ? 'Stored on OpenDraft Cloud'
              : 'Stored on this device'
          }
        >
          {source === 'cloud' ? <FaCloud /> : <FaDesktop />}
          {source === 'cloud' ? 'Cloud' : 'Local'}
        </span>
      </div>

      {/* Actions dropdown */}
      {showActions && (
        <div
          className="absolute right-2 top-full mt-0 bottom-auto bg-(--fd-toolbar-bg) border border-(--fd-border) rounded-md py-1 z-200 min-w-[180px] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              setEditing(true)
              setEditTitle(script.title)
              setShowActions(false)
            }}
          >
            Rename
          </div>
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              onDuplicate(script.id)
              setShowActions(false)
            }}
          >
            Duplicate
          </div>
          <div className="h-px bg-(--fd-border) my-1" />
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              onExport(script.id, 'fdx')
              setShowActions(false)
            }}
          >
            Export as FDX
          </div>
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              onExport(script.id, 'fountain')
              setShowActions(false)
            }}
          >
            Export as Fountain
          </div>
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              onExport(script.id, 'pdf')
              setShowActions(false)
            }}
          >
            Export as PDF
          </div>
          <div
            className="px-3.5 py-2 text-[13px] text-(--fd-text) cursor-pointer transition-colors hover:bg-(--fd-overlay-light)"
            onClick={() => {
              onExport(script.id, 'odraft')
              setShowActions(false)
            }}
          >
            Export as .odraft
          </div>
          <div className="h-px bg-(--fd-border) my-1" />
          <div
            className="hover:bg-[rgba(255,107,107,0.1)] px-3.5 py-2 text-[#ff6b6b] text-[13px] transition-colors cursor-pointer"
            onClick={() => {
              onDelete(script.id)
              setShowActions(false)
            }}
          >
            Delete
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────

const ProjectView: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  // Project's storage source — drives both the routing dispatchers (already
  // handled by projectApi) and the visual badges on individual scripts.
  const isCloud = useProjectStore((s) =>
    projectId ? Boolean(s.cloudProjects[projectId]) : false,
  )
  const projectSource: 'local' | 'cloud' = isCloud ? 'cloud' : 'local'
  // All script-level reads/writes (rename, pin, color, delete, duplicate)
  // need to go to the same backend that owns the project. Without this,
  // renaming or deleting a script inside a cloud project would hit local
  // SQLite, find nothing, and silently no-op (or 404).
  const client = isCloud ? cloudApi : api
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [scripts, setScripts] = useState<ScriptMeta[]>([])
  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [activeTab, setActiveTab] = useState<TabKey>('scripts')
  const [loading, setLoading] = useState(true)

  const [showProperties, setShowProperties] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [editingProjectName, setEditingProjectName] = useState(false)
  const [editProjectName, setEditProjectName] = useState('')
  const [scriptSortKey, setScriptSortKey] = useState<ScriptSortKey>(() => {
    return (
      (localStorage.getItem('opendraft:scriptSort') as ScriptSortKey) ||
      'custom'
    )
  })
  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => {
    return (
      (localStorage.getItem('opendraft:scriptViewMode') as 'list' | 'card') ||
      'list'
    )
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const fetchProject = useCallback(async () => {
    if (!projectId) return
    try {
      const p = await projectApi.getProject(projectId)
      setProject(p)
    } catch {
      navigate('/')
    }
  }, [projectId, navigate])

  const fetchScripts = useCallback(async () => {
    if (!projectId) return
    try {
      const s = await projectApi.listScripts(projectId)
      setScripts(s)
    } catch {
      // silently fail
    }
  }, [projectId])

  const fetchVersions = useCallback(async () => {
    if (!projectId) return
    try {
      const v = await api.getVersions(projectId)
      setVersions(Array.isArray(v) ? v : [])
    } catch {
      // silently fail
    }
  }, [projectId])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchProject(), fetchScripts(), fetchVersions()]).finally(() =>
      setLoading(false),
    )
  }, [fetchProject, fetchScripts, fetchVersions])

  useEffect(() => {
    localStorage.setItem('opendraft:scriptSort', scriptSortKey)
  }, [scriptSortKey])

  useEffect(() => {
    localStorage.setItem('opendraft:scriptViewMode', viewMode)
    // Re-fetch with previews when switching to card view
    if (viewMode === 'card' && projectId) {
      projectApi
        .listScripts(projectId, true)
        .then(setScripts)
        .catch(() => {})
    }
  }, [viewMode, projectId])

  // ── Sorting ──

  const { pinnedScripts, unpinnedScripts } = React.useMemo(() => {
    const list = [...scripts]
    const compareFn = (a: ScriptMeta, b: ScriptMeta): number => {
      switch (scriptSortKey) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created':
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        case 'updated':
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
        case 'color':
          return (a.color || 'zzz').localeCompare(b.color || 'zzz')
        case 'size':
          return b.size_bytes - a.size_bytes
        case 'pages':
          return b.page_count - a.page_count
        case 'custom':
        default:
          return a.sort_order - b.sort_order
      }
    }
    // Pinned items sorted by sort_order only, unpinned by user-selected sort
    const pinned = list
      .filter((s) => s.pinned)
      .sort((a, b) => a.sort_order - b.sort_order)
    const unpinned = list.filter((s) => !s.pinned).sort(compareFn)
    return { pinnedScripts: pinned, unpinnedScripts: unpinned }
  }, [scripts, scriptSortKey])

  const allSortedScripts = React.useMemo(
    () => [...pinnedScripts, ...unpinnedScripts],
    [pinnedScripts, unpinnedScripts],
  )

  // ── Handlers ──

  const handleCreateScript = () => {
    if (!projectId || !project) return
    // Set project context but no script — Save will trigger Save As dialog
    const projStore = useProjectStore.getState()
    projStore.setCurrentProject(project)
    projStore.setCurrentScriptId(null)
    projStore.setScripts([])
    const edStore = useEditorStore.getState()
    edStore.setDocumentTitle('Untitled Screenplay')
    edStore.setBeats([])
    edStore.setBeatColumns([])
    edStore.setBeatArrangeMode('auto')
    edStore.setNotes([])
    edStore.setTags([])
    edStore.setTagCategories([...DEFAULT_TAG_CATEGORIES])
    edStore.setCharacterProfiles([])
    edStore.setScenes([])
    // Tell MenuBar (which mounts inside ScreenplayEditor on '/') to prompt
    // for a script format. The flag is consumed by MenuBar's mount effect.
    edStore.setPendingFormatPromptInProject(true)
    navigate('/')
  }

  const [treatmentNamePrompt, setTreatmentNamePrompt] = useState<string | null>(
    null,
  )

  const handleCreateTreatment = () => {
    if (!projectId || !project) return
    setTreatmentNamePrompt('')
  }

  const confirmCreateTreatment = async (rawName: string) => {
    if (!projectId || !project) return
    const name = rawName.trim() || 'Untitled Treatment'
    setTreatmentNamePrompt(null)
    try {
      const resp = await client.createScript(projectId, {
        title: name,
        format: 'treatment',
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
      })
      await fetchScripts()
      navigate(`/project/${projectId}/treatment/${resp.meta.id}`)
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to create treatment',
        'error',
      )
    }
  }

  /** Navigate to the appropriate editor based on the script's format. */
  const navigateToScript = useCallback(
    (scriptId: string) => {
      if (!projectId) return
      const script = scripts.find((s) => s.id === scriptId)
      if (script?.format === 'treatment') {
        navigate(`/project/${projectId}/treatment/${scriptId}`)
      } else {
        navigate(`/project/${projectId}/edit/${scriptId}`)
      }
    },
    [projectId, scripts, navigate],
  )

  const handleDeleteScript = (scriptId: string) => {
    setPendingDeleteId(scriptId)
  }

  const confirmDeleteScript = async () => {
    if (!projectId || !pendingDeleteId) return
    try {
      await client.deleteScript(projectId, pendingDeleteId)
      await fetchScripts()
    } catch (err) {
      showToast(
        `Delete failed: ${err instanceof Error ? err.message : String(err)}`,
        'error',
      )
    }
    setPendingDeleteId(null)
  }

  const handlePinScript = useCallback(
    async (id: string, pinned: boolean) => {
      if (!projectId) return
      setScripts((prev) =>
        prev.map((s) => (s.id === id ? { ...s, pinned } : s)),
      )
      try {
        await client.saveScript(projectId, id, { pinned })
      } catch {
        setScripts((prev) =>
          prev.map((s) => (s.id === id ? { ...s, pinned: !pinned } : s)),
        )
      }
    },
    [projectId, client],
  )

  const handleColorScript = useCallback(
    async (id: string, color: string) => {
      if (!projectId) return
      setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)))
      try {
        await client.saveScript(projectId, id, { color })
      } catch {
        // silently fail
      }
    },
    [projectId, client],
  )

  const handleRenameScript = useCallback(
    async (id: string, title: string) => {
      if (!projectId) return
      const prev = scripts.find((s) => s.id === id)
      setScripts((list) => list.map((s) => (s.id === id ? { ...s, title } : s)))
      try {
        await client.saveScript(projectId, id, { title })
      } catch (err) {
        // Roll back on failure and surface the reason — silently swallowing
        // here is what made "rename doesn't work" so confusing in the cloud
        // case.
        if (prev) {
          setScripts((list) =>
            list.map((s) => (s.id === id ? { ...s, title: prev.title } : s)),
          )
        }
        showToast(
          `Rename failed: ${err instanceof Error ? err.message : String(err)}`,
          'error',
        )
      }
    },
    [projectId, scripts, client],
  )

  const handleDuplicateScript = useCallback(
    async (id: string) => {
      if (!projectId) return
      try {
        if (isCloud) {
          // cloudApi has no native duplicate endpoint yet; fall back to
          // get + re-create so users still get a working duplicate from
          // a cloud project.
          const orig = await cloudApi.getScript(projectId, id)
          await cloudApi.createScript(projectId, {
            title: `${orig.meta.title} (copy)`,
            content: orig.content,
            format: 'json',
          })
        } else {
          await api.duplicateScript(projectId, id)
        }
        await fetchScripts()
        showToast('Script duplicated', 'success')
      } catch (err) {
        showToast(
          `Duplicate failed: ${err instanceof Error ? err.message : String(err)}`,
          'error',
        )
      }
    },
    [projectId, fetchScripts, isCloud],
  )

  const handleExportScript = useCallback(
    async (id: string, format: string) => {
      if (!projectId) return
      try {
        const resp = await client.getScript(projectId, id)
        const content = resp.content as Record<string, unknown>
        const title = resp.meta.title || 'Untitled'

        // Extract embedded metadata from content if present
        const profiles = (content as any)?._characterProfiles
        const cats = (content as any)?._tagCategories
        const tags = (content as any)?._tags

        switch (format) {
          case 'fdx':
            await downloadFDX(content as any, title, profiles, cats, tags)
            break
          case 'fountain':
            await downloadFountain(content as any, title)
            break
          case 'pdf':
            await exportPDF(content as any, title, DEFAULT_PAGE_LAYOUT)
            break
          case 'odraft':
            await downloadOdraft(resp.meta, content)
            break
        }
        showToast(`Exported as ${format.toUpperCase()}`, 'success')
      } catch (err) {
        showToast(
          `Export failed: ${err instanceof Error ? err.message : String(err)}`,
          'error',
        )
      }
    },
    [projectId],
  )

  const handleScriptDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!projectId) return
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = allSortedScripts.findIndex((s) => s.id === active.id)
      const newIndex = allSortedScripts.findIndex((s) => s.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return

      const reordered = [...allSortedScripts]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      const updated = reordered.map((s, i) => ({ ...s, sort_order: i }))
      setScripts(updated)

      client
        .reorderScripts(
          projectId,
          updated.map((s) => ({ id: s.id, sort_order: s.sort_order })),
        )
        .catch(() => {})
    },
    [projectId, allSortedScripts, client],
  )

  const handleImportScript = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.fountain,.fdx,.txt,.odraft'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !projectId) return
      let title = file.name.replace(/\.\w+$/, '') || 'Untitled'
      const reader = new FileReader()
      reader.onload = async () => {
        const text = reader.result as string
        const ext = file.name.split('.').pop()?.toLowerCase()
        let doc
        if (ext === 'odraft') {
          const parsed = parseOdraft(text)
          title = parsed.meta.title || title
          doc = parsed.content
        } else if (ext === 'fdx') {
          const result = parseFDXFull(text)
          doc = result.doc
        } else {
          doc = parseFountain(text)
        }
        try {
          const resp = await client.createScript(projectId, {
            title,
            content: doc,
          })
          await fetchScripts()
          navigate(`/project/${projectId}/edit/${resp.meta.id}`)
        } catch (err) {
          console.error('Failed to import script:', err)
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (iso: string): string => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  if (loading) {
    return (
      <div className="h-full bg-(--fd-bg) text-(--fd-text) flex flex-col overflow-y-auto">
        <div className="px-10 py-20 text-center text-(--fd-text-muted) text-sm">
          Loading project...
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-(--fd-bg) text-(--fd-text) flex flex-col overflow-y-auto">
      <div className="flex items-center gap-4 px-10 py-5 border-b border-(--fd-border) bg-(--fd-navigator-bg) shrink-0">
        <button
          className="bg-transparent border border-(--fd-border) text-(--fd-text-muted) px-3 py-1.5 rounded text-[13px] cursor-pointer transition-all whitespace-nowrap hover:border-(--fd-accent) hover:text-(--fd-accent)"
          onClick={() => navigate('/projects')}
        >
          &#x2190; Projects
        </button>
        <div>
          {editingProjectName ? (
            <input
              className="bg-transparent border border-(--fd-accent) rounded-sm text-(--fd-text) w-full outline-none box-border text-xl font-bold py-1 px-2"
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = editProjectName.trim()
                  if (trimmed && project && trimmed !== project.name) {
                    projectApi
                      .updateProject(project.id, { name: trimmed })
                      .then((updated) => setProject(updated))
                      .catch(() => {})
                  }
                  setEditingProjectName(false)
                }
                if (e.key === 'Escape') setEditingProjectName(false)
              }}
              onBlur={() => {
                const trimmed = editProjectName.trim()
                if (trimmed && project && trimmed !== project.name) {
                  projectApi
                    .updateProject(project.id, { name: trimmed })
                    .then((updated) => setProject(updated))
                    .catch(() => {})
                }
                setEditingProjectName(false)
              }}
              autoFocus
            />
          ) : (
            <h1
              className="m-0 font-semibold text-xl"
              onDoubleClick={() => {
                setEditProjectName(project?.name || '')
                setEditingProjectName(true)
              }}
              title="Double-click to rename"
            >
              {project?.name || projectId}
            </h1>
          )}
          {project && (
            <div className="text-xs text-(--fd-text-muted) mt-1 flex items-center gap-1.5">
              <span>
                {scripts.length} script{scripts.length !== 1 ? 's' : ''}
              </span>
              <span className="text-(--fd-text-muted)">&middot;</span>
              <span>Created {formatDate(project.created_at)}</span>
              <span className="text-(--fd-text-muted)">&middot;</span>
              <span>Modified {formatDate(project.updated_at)}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="h-8 px-4 bg-(--fd-dropdown-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs cursor-pointer transition-all hover:border-(--fd-accent) hover:text-(--fd-accent)"
            onClick={() => {
              if (!projectId) return
              exportProjectAsZip(projectId)
                .then(() => showToast('Project exported as zip', 'success'))
                .catch((err) =>
                  showToast(
                    `Export failed: ${err instanceof Error ? err.message : String(err)}`,
                    'error',
                  ),
                )
            }}
          >
            Export Project
          </button>
          <button
            className="h-8 px-4 bg-(--fd-dropdown-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs cursor-pointer transition-all hover:border-(--fd-accent) hover:text-(--fd-accent)"
            onClick={() => setShowProperties(true)}
          >
            Properties
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 px-10 border-b border-(--fd-border) bg-(--fd-navigator-bg) shrink-0">
        {(['scripts', 'assets', 'versions'] as TabKey[]).map((tab) => (
          <button
            key={tab}
            className={`px-5 py-2.5 bg-transparent border-none border-b-2 text-[13px] font-medium cursor-pointer transition-all ${activeTab === tab ? 'text-(--fd-accent) border-b-(--fd-accent)' : 'text-(--fd-text-muted) border-b-transparent hover:text-(--fd-text)'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 mx-auto px-10 py-6 w-full max-w-300">
        {activeTab === 'scripts' && (
          <div>
            <div className="flex gap-2 mb-5">
              <NewDocumentButton
                onCreateScreenplay={handleCreateScript}
                onCreateTreatment={handleCreateTreatment}
              />
              <button
                className="h-8 px-4 bg-(--fd-dropdown-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs cursor-pointer transition-all hover:border-(--fd-accent) hover:text-(--fd-accent)"
                onClick={handleImportScript}
              >
                Import
              </button>
              <select
                className="h-8 px-2.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs cursor-pointer"
                value={scriptSortKey}
                onChange={(e) =>
                  setScriptSortKey(e.target.value as ScriptSortKey)
                }
              >
                <option value="custom">Custom Order</option>
                <option value="title">Title</option>
                <option value="created">Created</option>
                <option value="updated">Last Modified</option>
                <option value="color">Color</option>
                <option value="size">Size</option>
                <option value="pages">Pages</option>
              </select>
              <div className="flex gap-0.5 ml-1">
                <button
                  className={`bg-(--fd-dropdown-bg) border border-(--fd-border) px-2 py-1 rounded text-sm leading-none transition-all cursor-pointer ${viewMode === 'list' ? 'text-(--fd-accent) border-(--fd-accent)' : 'text-(--fd-text-muted) hover:text-(--fd-text)'}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  &#x2630;
                </button>
                <button
                  className={`bg-(--fd-dropdown-bg) border border-(--fd-border) px-2 py-1 rounded text-sm leading-none transition-all cursor-pointer ${viewMode === 'card' ? 'text-(--fd-accent) border-(--fd-accent)' : 'text-(--fd-text-muted) hover:text-(--fd-text)'}`}
                  onClick={() => setViewMode('card')}
                  title="Card view"
                >
                  &#x25A6;
                </button>
              </div>
            </div>
            {scripts.length === 0 ? (
              <div className="py-10 px-5 text-center text-(--fd-text-muted) text-[13px] italic">
                No scripts yet. Create or import one to get started.
              </div>
            ) : viewMode === 'card' ? (
              /* ── Card view ── */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleScriptDragEnd}
              >
                {pinnedScripts.length > 0 && (
                  <>
                    <div className="mt-4 first:mt-0 mb-1 py-2 font-semibold text-[#f4d35e] text-[11px] uppercase tracking-[0.8px]">
                      Pinned
                    </div>
                    <SortableContext
                      items={pinnedScripts.map((s) => s.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="gap-4 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
                        {pinnedScripts.map((script) => (
                          <ScriptCard
                            key={script.id}
                            script={script}
                            source={projectSource}
                            sortKey={scriptSortKey}
                            onNavigate={navigateToScript}
                            onPin={handlePinScript}
                            onRename={handleRenameScript}
                            onDuplicate={handleDuplicateScript}
                            onExport={handleExportScript}
                            onDelete={handleDeleteScript}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </>
                )}
                {unpinnedScripts.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.8px] py-2 mt-4 mb-1 first:mt-0 text-(--fd-text-muted)">
                      All Screenplays
                    </div>
                    <SortableContext
                      items={unpinnedScripts.map((s) => s.id)}
                      strategy={rectSortingStrategy}
                    >
                      <div className="gap-4 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
                        {unpinnedScripts.map((script) => (
                          <ScriptCard
                            key={script.id}
                            script={script}
                            source={projectSource}
                            sortKey={scriptSortKey}
                            onNavigate={navigateToScript}
                            onPin={handlePinScript}
                            onRename={handleRenameScript}
                            onDuplicate={handleDuplicateScript}
                            onExport={handleExportScript}
                            onDelete={handleDeleteScript}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </>
                )}
              </DndContext>
            ) : (
              /* ── List view ── */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleScriptDragEnd}
              >
                {pinnedScripts.length > 0 && (
                  <>
                    <div className="mt-4 first:mt-0 mb-1 py-2 font-semibold text-[#f4d35e] text-[11px] uppercase tracking-[0.8px]">
                      Pinned
                    </div>
                    <SortableContext
                      items={pinnedScripts.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-2.5">
                        {pinnedScripts.map((script) => (
                          <SortableScriptRow
                            key={script.id}
                            script={script}
                            projectId={projectId!}
                            source={projectSource}
                            sortKey={scriptSortKey}
                            onNavigate={navigateToScript}
                            onPin={handlePinScript}
                            onColor={handleColorScript}
                            onDelete={handleDeleteScript}
                            onRename={handleRenameScript}
                            onDuplicate={handleDuplicateScript}
                            onExport={handleExportScript}
                            formatDate={formatDate}
                            formatSize={formatSize}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </>
                )}
                {unpinnedScripts.length > 0 && (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.8px] py-2 mt-4 mb-1 first:mt-0 text-(--fd-text-muted)">
                      All Screenplays
                    </div>
                    <SortableContext
                      items={unpinnedScripts.map((s) => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-2.5">
                        {unpinnedScripts.map((script) => (
                          <SortableScriptRow
                            key={script.id}
                            script={script}
                            projectId={projectId!}
                            source={projectSource}
                            sortKey={scriptSortKey}
                            onNavigate={navigateToScript}
                            onPin={handlePinScript}
                            onColor={handleColorScript}
                            onDelete={handleDeleteScript}
                            onRename={handleRenameScript}
                            onDuplicate={handleDuplicateScript}
                            onExport={handleExportScript}
                            formatDate={formatDate}
                            formatSize={formatSize}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </>
                )}
              </DndContext>
            )}
          </div>
        )}

        {activeTab === 'assets' && projectId && (
          <AssetManager projectId={projectId} embedded />
        )}

        {activeTab === 'versions' && (
          <div>
            {versions.length === 0 ? (
              <div className="py-10 px-5 text-center text-(--fd-text-muted) text-[13px] italic">
                No version history available.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {versions.map((v) => (
                  <div
                    key={v.hash}
                    className="flex justify-between items-center bg-(--fd-navigator-bg) border border-(--fd-border) rounded-md px-4 py-3"
                  >
                    <div className="text-[13px] text-(--fd-text)">
                      {v.message}
                    </div>
                    <div className="text-[11px] text-(--fd-text-muted) whitespace-nowrap ml-4">
                      {formatDate(v.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Treatment — name prompt */}
      {treatmentNamePrompt !== null && (
        <div
          className="dialog-overlay fixed left-0 top-0 right-0 bg-black/50 z-3000 flex items-start justify-center h-(--vv-height,100dvh) px-4 pt-[5vh] pb-4 overflow-y-auto"
          onClick={() => setTreatmentNamePrompt(null)}
        >
          <div
            className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[320px] max-w-100 max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base shrink-0">
              New Treatment
            </div>
            <div className="flex-1 p-5 overflow-y-auto dialog-body">
              <p className="m-0 mb-2.5">Name this treatment:</p>
              <input
                autoFocus
                type="text"
                className="w-full py-2 px-2.5 text-sm bg-(--fd-overlay-subtle) border border-(--fd-border) rounded text-(--fd-text) box-border"
                value={treatmentNamePrompt}
                onChange={(e) => setTreatmentNamePrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')
                    confirmCreateTreatment(treatmentNamePrompt)
                  if (e.key === 'Escape') setTreatmentNamePrompt(null)
                }}
                placeholder="e.g. First Treatment, Producer Draft…"
              />
            </div>
            <div className="dialog-actions flex justify-end gap-2 px-5 py-3.5 border-t border-(--fd-border) shrink-0 [&_button]:h-8.5 [&_button]:px-4.5 [&_button]:bg-(--fd-toolbar-bg) [&_button]:text-(--fd-text) [&_button]:border [&_button]:border-(--fd-border) [&_button]:rounded [&_button]:cursor-pointer [&_button]:text-sm [&_button:hover]:bg-(--fd-menu-hover)">
              <button onClick={() => setTreatmentNamePrompt(null)}>
                Cancel
              </button>
              <button
                className="dialog-primary bg-(--fd-accent)! border-(--fd-accent)! text-white! hover:opacity-90"
                onClick={() => confirmCreateTreatment(treatmentNamePrompt)}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {pendingDeleteId && (
        <div
          className="dialog-overlay fixed left-0 top-0 right-0 bg-black/50 z-3000 flex items-start justify-center h-(--vv-height,100dvh) px-4 pt-[5vh] pb-4 overflow-y-auto"
          onClick={() => setPendingDeleteId(null)}
        >
          <div
            className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[320px] max-w-100 max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-header px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base shrink-0">
              Delete Script
            </div>
            <div className="dialog-body">
              <p>
                Are you sure you want to delete this script? This cannot be
                undone.
              </p>
            </div>
            <div className="dialog-actions">
              <button onClick={() => setPendingDeleteId(null)}>Cancel</button>
              <button
                className="dialog-primary"
                style={{ background: '#c0392b' }}
                onClick={confirmDeleteScript}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Properties Dialog */}
      {showProperties && project && (
        <ProjectPropertiesDialog
          project={project}
          onClose={() => setShowProperties(false)}
          onSaved={(updated) => setProject(updated)}
        />
      )}
    </div>
  )
}

export default ProjectView
