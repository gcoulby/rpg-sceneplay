import React from 'react'
import { CircleDot } from 'lucide-react'
import ModuleCard from './shared/ModuleCard'
import NumberField from './shared/NumberField'
import type { ModuleComponentProps } from './moduleProps'

/** Segmented circular "pie" tracker — popular for tracking countdowns/
 *  progress in solo & journaling play (Blades-in-the-Dark-style clocks),
 *  not tied to any one system. Click a wedge to fill up to it, same
 *  interaction model as PipRow but arranged radially. */
export interface ClockConfig {
  segments: number
}

export interface ClockValues {
  filled: number
}

export const defaultClockConfig: ClockConfig = { segments: 6 }
export const defaultClockValues: ClockValues = { filled: 0 }

const SIZE = 96
const CENTER = SIZE / 2
const RADIUS = SIZE / 2 - 4

function wedgePath(index: number, total: number): string {
  const start = (index / total) * 2 * Math.PI - Math.PI / 2
  const end = ((index + 1) / total) * 2 * Math.PI - Math.PI / 2
  const x1 = CENTER + RADIUS * Math.cos(start)
  const y1 = CENTER + RADIUS * Math.sin(start)
  const x2 = CENTER + RADIUS * Math.cos(end)
  const y2 = CENTER + RADIUS * Math.sin(end)
  const largeArc = end - start > Math.PI ? 1 : 0
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

const ClockModule: React.FC<
  ModuleComponentProps<ClockConfig, ClockValues>
> = ({ module, layout, onChangeLabel, onChangeConfig, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => {
  const { config, values } = module
  const segments = Math.max(2, config.segments)
  const filled = Math.min(values.filled, segments)

  return (
    <ModuleCard
      label={module.label}
      icon={CircleDot}
      layout={layout}
      onChangeLabel={onChangeLabel}
      onChangeLayout={onChangeLayout}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col items-center gap-3">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {Array.from({ length: segments }, (_, i) => (
            <path
              key={i}
              d={wedgePath(i, segments)}
              className={`cursor-pointer transition-colors ${
                i < filled ? 'fill-(--fd-accent)' : 'fill-white/5 hover:fill-white/15'
              }`}
              stroke="var(--fd-text-muted)"
              strokeOpacity={0.5}
              strokeWidth={1.5}
              onClick={() => onChangeValues({ filled: filled === i + 1 ? i : i + 1 })}
            />
          ))}
        </svg>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-(--fd-text-muted)">
            {filled} / {segments}
          </span>
          <span className="text-(--fd-text-muted)/50">·</span>
          <span className="text-(--fd-text-muted)">Segments</span>
          <NumberField
            value={segments}
            min={2}
            max={12}
            onChange={(v) => {
              const next = Math.max(2, Math.min(12, v))
              onChangeConfig({ segments: next })
              if (filled > next) onChangeValues({ filled: next })
            }}
            inputClassName="h-7 w-12"
          />
        </div>
      </div>
    </ModuleCard>
  )
}

export default ClockModule
