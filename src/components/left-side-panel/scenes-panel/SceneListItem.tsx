import React from 'react'
import { Button } from '@/components/ui/button'
import SceneLengthIcon from './SceneLengthIcon'
import {
  formatSceneDuration,
  getTimingColor,
} from '@/utils/open-draft/scriptTiming'
import { formatPageLength } from './scene-utils'

interface SceneListItemScene {
  id: string
  heading: string
  synopsis: string
  color: string
  sceneNumber: number | null
}

interface SceneListItemProps {
  scene: SceneListItemScene
  detail?: { pageLength: number }
  timing?: { finalSeconds: number; overrideSeconds: number | null }
  actLabel: string | null
  isExpanded: boolean
  searchQuery: string
  onToggle: () => void
  onEditSynopsis: () => void
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const qLower = query.toLowerCase()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-[rgba(234,179,8,0.3)] px-px rounded-[2px]">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  )
}

const SceneListItem: React.FC<SceneListItemProps> = ({
  scene,
  detail,
  timing,
  actLabel,
  isExpanded,
  searchQuery,
  onToggle,
  onEditSynopsis,
}) => {
  return (
    <div
      className={`navigator-scene flex items-start px-3.5 py-2.5 cursor-pointer border-l-[3px] min-h-10 hover:bg-(--fd-overlay-subtle) hover:border-l-(--fd-accent) active:bg-[rgba(74,158,255,0.12)] ${isExpanded ? 'bg-(--fd-overlay-subtle) border-l-(--fd-accent)' : 'border-transparent'}`}
    >
      <div className="flex-1 min-w-0" onClick={onToggle}>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-1.5 text-sm [font-family:var(--screenplay-font)] text-(--fd-text) leading-[1.3] font-semibold">
            {scene.sceneNumber != null && (
              <span
                className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full shrink-0 text-xs font-bold font-inherit bg-(--fd-text-muted) text-(--fd-bg) border-none"
                style={scene.color ? { background: scene.color } : undefined}
              >
                {scene.sceneNumber}
              </span>
            )}
            {actLabel && (
              <span
                className="inline-block text-[9px] font-bold tracking-[0.03em] px-1.25 py-px mr-1.5 rounded-[3px] bg-(--fd-overlay-light) text-(--fd-text-muted) align-middle shrink-0"
                title={`Act ${actLabel.slice(1)}`}
              >
                {actLabel}
              </span>
            )}
            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {highlightText(scene.heading, searchQuery)}
            </span>
          </div>
          {detail && detail.pageLength > 0 && (
            <div
              className="scene-length shrink-0 flex items-center text-(--fd-text-muted) cursor-default ml-1 relative"
              data-tooltip={
                formatPageLength(detail.pageLength) +
                (timing?.finalSeconds
                  ? ` \u00b7 ${formatSceneDuration(timing.finalSeconds)}`
                  : '')
              }
            >
              <SceneLengthIcon pages={detail.pageLength} />
            </div>
          )}
        </div>

        {!isExpanded && scene.synopsis && (
          <div className="text-[11px] text-(--fd-text) opacity-50 leading-[1.3] mt-0.75 whitespace-nowrap overflow-hidden text-ellipsis">
            {highlightText(scene.synopsis.split('\n')[0], searchQuery)}
          </div>
        )}

        {isExpanded && (
          <div className="mt-2 pt-1.5 border-t border-(--fd-border)">
            {(detail || timing) && (
              <div className="flex gap-2 text-[11px] text-(--fd-text-muted) mb-1 [font-variant-numeric:tabular-nums]">
                {detail && detail.pageLength > 0 && (
                  <span className="font-semibold">
                    {formatPageLength(detail.pageLength)}
                  </span>
                )}
                {timing && timing.finalSeconds > 0 && (
                  <span
                    className="font-semibold"
                    style={{ color: getTimingColor(timing.finalSeconds) }}
                  >
                    {formatSceneDuration(timing.finalSeconds)}
                    {timing.overrideSeconds != null && ' *'}
                  </span>
                )}
              </div>
            )}
            {scene.synopsis ? (
              <div className="text-xs text-(--fd-text) opacity-70 leading-normal line-clamp-3">
                {scene.synopsis}
              </div>
            ) : (
              <div className="text-xs text-(--fd-text-muted) italic opacity-60">
                No synopsis for this scene available.
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-1.5 h-auto px-2.5 py-0.75 text-[11px] text-(--fd-accent)"
              onClick={(e) => {
                e.stopPropagation()
                onEditSynopsis()
              }}
            >
              {scene.synopsis ? 'Edit' : '+ Add'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SceneListItem
