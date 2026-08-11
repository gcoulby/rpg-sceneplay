import React from 'react'
import { Undo2, Redo2, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface IndexCardsToolbarProps {
  sceneCount: number
  dragMode: boolean
  fullscreen: boolean
  canUndo: boolean
  canRedo: boolean
  hasChanges: boolean
  onUndo: () => void
  onRedo: () => void
  onCancelReorder: () => void
  onApplyReorder: () => void
  onEnterReorderMode: () => void
  onToggleFullscreen: () => void
}

const IndexCardsToolbar: React.FC<IndexCardsToolbarProps> = ({
  sceneCount,
  dragMode,
  fullscreen,
  canUndo,
  canRedo,
  hasChanges,
  onUndo,
  onRedo,
  onCancelReorder,
  onApplyReorder,
  onEnterReorderMode,
  onToggleFullscreen,
}) => (
  <div className="index-cards-header flex items-center py-2.5 px-4 border-b border-(--fd-border) gap-2 shrink-0">
    <span className="font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
      Index Cards
    </span>
    <span className="text-[11px] text-(--fd-text-muted) mr-auto">{sceneCount} scenes</span>
    <div className="flex gap-1">
      {dragMode ? (
        <>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="size-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={onCancelReorder}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-[11px]"
            variant={hasChanges ? 'default' : 'outline'}
            onClick={onApplyReorder}
            disabled={!hasChanges}
            title={hasChanges ? 'Apply scene reorder to screenplay' : 'No changes to apply'}
          >
            Apply
          </Button>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px]"
          onClick={onEnterReorderMode}
          title="Enter drag-drop mode"
        >
          Reorder
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        className="size-7"
        onClick={onToggleFullscreen}
        title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
      </Button>
    </div>
  </div>
)

export default IndexCardsToolbar
