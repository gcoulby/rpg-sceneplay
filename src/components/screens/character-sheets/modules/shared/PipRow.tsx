import React from 'react'
import NumberField from './NumberField'

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
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex flex-wrap justify-center gap-1.5">
        {pips.map((filled, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange({ current: current === i + 1 ? i : i + 1, max })}
            className={`size-5 rounded-full border-2 transition-all hover:scale-110 ${
              filled
                ? 'bg-(--fd-accent) border-(--fd-accent) shadow-[0_0_6px_var(--fd-accent)]'
                : 'bg-transparent border-(--fd-border) hover:border-(--fd-text-muted)'
            }`}
            title={`${i + 1} / ${max}`}
          />
        ))}
        {max === 0 && (
          <span className="text-[10px] text-(--fd-text-muted)">No charges configured</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-(--fd-text-muted) shrink-0">Max</span>
        <NumberField
          value={max}
          min={0}
          onChange={(v) => onChange({ current: Math.min(current, v), max: v })}
          withSteppers
          inputClassName="h-7 w-14"
        />
      </div>
    </div>
  )
}

export default PipRow
