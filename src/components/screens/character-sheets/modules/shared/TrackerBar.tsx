import React from 'react'
import NumberField from './NumberField'

interface TrackerBarProps {
  current: number
  max: number
  onChange: (next: { current: number; max: number }) => void
}

/** Hand-rolled current/max bar — shadcn `progress` isn't installed in this
 *  project and a single bar doesn't warrant adding the dependency. */
const TrackerBar: React.FC<TrackerBarProps> = ({ current, max, onChange }) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0
  const low = max > 0 && current / max <= 0.25

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="bg-black/30 rounded-full w-full h-2.5 overflow-hidden">
        <div
          className={`h-full transition-[width] duration-200 ${low ? 'bg-destructive' : 'bg-(--fd-accent)'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-2">
        <NumberField
          value={current}
          onChange={(v) => onChange({ current: v, max })}
          withSteppers
          className="flex-1"
          inputClassName="h-7 font-semibold text-sm"
        />
        <span className="text-(--fd-text-muted) text-xs shrink-0">of</span>
        <NumberField
          value={max}
          onChange={(v) => onChange({ current, max: v })}
          withSteppers
          className="flex-1"
          inputClassName="h-7 text-sm"
        />
      </div>
    </div>
  )
}

export default TrackerBar
