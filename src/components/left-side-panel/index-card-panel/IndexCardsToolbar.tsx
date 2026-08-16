import React from 'react'
import { Undo2, Redo2 } from 'lucide-react'
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
  canUndo,
  canRedo,
  hasChanges,
  onUndo,
  onRedo,
  onApplyReorder,
}) => (
  <div className="index-cards-header flex items-center py-2.5 px-4 border-b border-(--fd-border) gap-2 shrink-0 w-full max-w-full">
    <div className="flex gap-1 pe-15 w-full">
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

      <Button
        size="sm"
        className="w-full h-7 text-[11px]"
        variant={hasChanges ? 'default' : 'outline'}
        onClick={onApplyReorder}
        disabled={!hasChanges}
        title={
          hasChanges
            ? 'Apply scene reorder to screenplay'
            : 'No changes to apply'
        }
      >
        Apply
      </Button>
    </div>
  </div>
)

export default IndexCardsToolbar
