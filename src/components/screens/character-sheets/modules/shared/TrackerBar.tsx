import React from 'react'
import { Input } from '@/components/ui/input'

interface TrackerBarProps {
  current: number
  max: number
  onChange: (next: { current: number; max: number }) => void
}

/** Hand-rolled current/max bar — shadcn `progress` isn't installed in this
 *  project and a single bar doesn't warrant adding the dependency. */
const TrackerBar: React.FC<TrackerBarProps> = ({ current, max, onChange }) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="bg-(--fd-border) rounded-full w-full h-2.5 overflow-hidden">
        <div
          className="bg-(--fd-accent) h-full transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <Input
          type="number"
          value={current}
          onChange={(e) => onChange({ current: Number(e.target.value) || 0, max })}
          className="h-6 px-1.5 w-16 text-xs text-right"
        />
        <span className="text-(--fd-text-muted)">/</span>
        <Input
          type="number"
          value={max}
          onChange={(e) => onChange({ current, max: Number(e.target.value) || 0 })}
          className="h-6 px-1.5 w-16 text-xs text-right"
        />
      </div>
    </div>
  )
}

export default TrackerBar
