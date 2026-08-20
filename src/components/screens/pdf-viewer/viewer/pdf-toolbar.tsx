import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FormInput,
  Pencil,
  Type,
  Highlighter,
  Stamp,
  Search,
  Maximize,
  Minimize,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnnotationEditorType } from 'pdfjs-dist'
import EditableStat from './editable-stat'

export type PdfMode = 'fill' | 'markup'

const MARKUP_TOOLS = [
  { type: AnnotationEditorType.FREETEXT, label: 'Text', icon: Type },
  { type: AnnotationEditorType.INK, label: 'Ink', icon: Pencil },
  { type: AnnotationEditorType.HIGHLIGHT, label: 'Highlight', icon: Highlighter },
  { type: AnnotationEditorType.STAMP, label: 'Stamp', icon: Stamp },
] as const

interface PdfToolbarProps {
  mode: PdfMode
  onModeChange: (mode: PdfMode) => void
  markupTool: number
  onMarkupToolChange: (tool: number) => void
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomChange: (percent: number) => void
  searchOpen: boolean
  onToggleSearch: () => void
  fullscreen: boolean
  onToggleFullscreen: () => void
}

/** Page nav, zoom, and the Fill/Markup mode toggle — mutually exclusive
 *  modes, mirroring how the pdfjs reference viewer separates them (avoids
 *  accidental annotation clicks landing on form fields). */
export default function PdfToolbar({
  mode,
  onModeChange,
  markupTool,
  onMarkupToolChange,
  page,
  pageCount,
  onPageChange,
  scale,
  onZoomIn,
  onZoomOut,
  onZoomChange,
  searchOpen,
  onToggleSearch,
  fullscreen,
  onToggleFullscreen,
}: PdfToolbarProps) {
  const clampPage = (n: number) => onPageChange(Math.min(pageCount, Math.max(1, Math.round(n))))

  return (
    <div className="flex items-center gap-1 bg-(--fd-navigator-bg) px-2 py-1.5 border-(--fd-border) border-b shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        title="Previous page"
      >
        <ChevronLeft className="size-3.5" />
      </Button>
      <EditableStat
        display={`${page} / ${pageCount}`}
        value={page}
        onCommit={clampPage}
        title="Go to page"
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
        title="Next page"
      >
        <ChevronRight className="size-3.5" />
      </Button>

      <div className="bg-(--fd-border) mx-1 w-px h-4" />

      <Button variant="ghost" size="icon" className="size-7" onClick={onZoomOut} title="Zoom out">
        <ZoomOut className="size-3.5" />
      </Button>
      <EditableStat
        display={`${Math.round(scale * 100)}%`}
        value={Math.round(scale * 100)}
        onCommit={onZoomChange}
        title="Set zoom"
      />
      <Button variant="ghost" size="icon" className="size-7" onClick={onZoomIn} title="Zoom in">
        <ZoomIn className="size-3.5" />
      </Button>

      <div className="bg-(--fd-border) mx-1 w-px h-4" />

      <Button
        variant={searchOpen ? 'secondary' : 'ghost'}
        size="icon"
        className="size-7"
        onClick={onToggleSearch}
        title="Find in document"
      >
        <Search className="size-3.5" />
      </Button>

      <div className="bg-(--fd-border) mx-1 w-px h-4" />

      <div className="flex items-center gap-0.5 bg-black/20 p-0.5 rounded-md">
        <Button
          variant={mode === 'fill' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-6 text-xs"
          onClick={() => onModeChange('fill')}
        >
          <FormInput className="mr-1 size-3.5" />
          Fill
        </Button>
        <Button
          variant={mode === 'markup' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-6 text-xs"
          onClick={() => onModeChange('markup')}
        >
          <Pencil className="mr-1 size-3.5" />
          Markup
        </Button>
      </div>

      {mode === 'markup' && (
        <div className="flex items-center gap-0.5 ml-1">
          {MARKUP_TOOLS.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={markupTool === type ? 'secondary' : 'ghost'}
              size="icon"
              className="size-7"
              onClick={() => onMarkupToolChange(type)}
              title={label}
            >
              <Icon className="size-3.5" />
            </Button>
          ))}
        </div>
      )}

      <div className="flex-1" />

      <Button
        variant={fullscreen ? 'secondary' : 'ghost'}
        size="icon"
        className="size-7"
        onClick={onToggleFullscreen}
        title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
      >
        {fullscreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
      </Button>
    </div>
  )
}
