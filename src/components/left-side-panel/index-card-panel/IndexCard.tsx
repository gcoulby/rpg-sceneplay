import React from 'react'
import { GripVertical, Maximize2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  formatSceneDuration,
  getTimingColor,
} from '@/utils/open-draft/scriptTiming'
import type { SceneInfo } from '@/stores/editorStore'

interface IndexCardProps {
  scene: SceneInfo
  index: number
  dragMode: boolean
  isDragging: boolean
  origNum: number | undefined
  pageLength: number | undefined
  finalSeconds: number | undefined
  onNavigate: () => void
  onSynopsisChange: (value: string) => void
  onExpandSynopsis: () => void
  onDragHandleDown: (e: React.PointerEvent) => void
}

const IndexCard: React.FC<IndexCardProps> = ({
  scene,
  index,
  dragMode,
  isDragging,
  origNum,
  pageLength,
  finalSeconds,
  onNavigate,
  onSynopsisChange,
  onExpandSynopsis,
  onDragHandleDown,
}) => {
  const newNum = index + 1
  const movedUp = dragMode && origNum !== undefined && newNum < origNum
  const movedDown = dragMode && origNum !== undefined && newNum > origNum

  return (
    <div
      className={
        'index-card flex bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-md overflow-hidden transition-[border-color] duration-150 hover:border-(--fd-accent) mb-4' +
        (dragMode ? ' cursor-grab active:cursor-grabbing' : '') +
        (isDragging ? ' opacity-25' : '') +
        (movedUp
          ? ' border-[#2d8a4e]! shadow-[0_0_0_1px_#2d8a4e] [&_.index-card-badge]:bg-[#2d8a4e]'
          : '') +
        (movedDown
          ? ' border-[#d97706]! shadow-[0_0_0_1px_#d97706] [&_.index-card-badge]:bg-[#d97706]'
          : '')
      }
    >
      {dragMode && (
        <div
          className="flex items-center justify-center w-8 min-h-11 text-(--fd-text-muted) shrink-0 cursor-grab select-none touch-none hover:text-(--fd-text)"
          title="Drag to reorder"
          onPointerDown={onDragHandleDown}
        >
          <GripVertical className="size-4" />
        </div>
      )}
      <div
        className="w-0.75 shrink-0"
        style={{ backgroundColor: scene.color || 'var(--fd-text-muted)' }}
      />
      <div className="flex flex-col flex-1 gap-2 px-3 py-2.5 min-w-0">
        <div className="flex items-start gap-2">
          <span
            className="index-card-badge flex items-center justify-center min-w-6 h-6 bg-(--fd-text-muted) text-(--fd-bg,#fff) text-xs font-bold rounded-full shrink-0 py-0 px-1 gap-0.5 whitespace-nowrap"
            style={
              scene.color
                ? { background: scene.color, borderColor: scene.color }
                : undefined
            }
          >
            {movedUp || movedDown ? (
              <>
                <span className="opacity-60 line-through">{origNum}</span> →{' '}
                {newNum}
              </>
            ) : (
              (scene.sceneNumber ?? newNum)
            )}
          </span>
          <div
            className="flex-1 text-xs [font-family:var(--screenplay-font)] text-(--fd-text) cursor-pointer overflow-hidden line-clamp-2 leading-[1.3] hover:text-(--fd-accent)"
            onClick={() => !dragMode && onNavigate()}
            title={dragMode ? undefined : 'Click to navigate to scene'}
          >
            {scene.heading}
          </div>
          {((pageLength ?? 0) > 0 || (finalSeconds ?? 0) > 0) && (
            <div className="flex gap-1 text-[9px] text-(--fd-text-muted) [font-variant-numeric:tabular-nums] shrink-0 ml-auto items-center whitespace-nowrap">
              {(pageLength ?? 0) > 0 && (
                <span className="font-semibold">
                  {Number(pageLength!.toFixed(1))}p
                </span>
              )}
              {(finalSeconds ?? 0) > 0 && (
                <span
                  className="font-semibold"
                  style={{ color: getTimingColor(finalSeconds!) }}
                >
                  {formatSceneDuration(finalSeconds!)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="relative w-full">
          <Textarea
            className="font-sans text-[11px] leading-[1.4]"
            placeholder="Add synopsis..."
            value={scene.synopsis}
            onChange={(e) => onSynopsisChange(e.target.value)}
            rows={3}
            disabled={dragMode}
          />
          <button
            type="button"
            className="absolute top-1 right-1 bg-none border-none cursor-pointer text-(--fd-text) opacity-30 p-0.75 rounded-[3px] flex items-center justify-center hover:opacity-80 hover:bg-(--fd-overlay-subtle) disabled:cursor-default disabled:opacity-15"
            onClick={onExpandSynopsis}
            title="Expand synopsis"
            disabled={dragMode}
          >
            <Maximize2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default IndexCard
