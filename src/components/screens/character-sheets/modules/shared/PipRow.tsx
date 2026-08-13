import React from 'react'
import { Input } from '@/components/ui/input'

interface PipRowProps {
  current: number
  max: number
  onChange: (next: { current: number; max: number }) => void
}

/** Pip-based tracker for the Charges module (spell slots, limited-use
 *  abilities). Clicking a pip sets `current` to that pip's index. */
const PipRow: React.FC<PipRowProps> = ({ current, max, onChange }) => {
  const pips = Array.from({ length: Math.max(0, max) }, (_, i) => i < current)

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex flex-wrap gap-1">
        {pips.map((filled, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange({ current: current === i + 1 ? i : i + 1, max })}
            className={`size-4 rounded-full border transition-colors ${
              filled
                ? 'bg-(--fd-accent) border-(--fd-accent)'
                : 'bg-transparent border-(--fd-border)'
            }`}
            title={`${i + 1} / ${max}`}
          />
        ))}
        {max === 0 && (
          <span className="text-[10px] text-(--fd-text-muted)">No charges configured</span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-(--fd-text-muted)">Max</span>
        <Input
          type="number"
          value={max}
          onChange={(e) => {
            const nextMax = Math.max(0, Number(e.target.value) || 0)
            onChange({ current: Math.min(current, nextMax), max: nextMax })
          }}
          className="h-6 px-1.5 w-16 text-xs text-right"
        />
      </div>
    </div>
  )
}

export default PipRow
