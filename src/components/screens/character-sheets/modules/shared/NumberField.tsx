import React from 'react'
import { Minus, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface NumberFieldProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Renders +/- stepper buttons flanking the input, for prominent single
   *  values (Core Block stat boxes, tracker current/max). Row-context uses
   *  (Skills modifier, Gear qty) omit this to stay compact. */
  withSteppers?: boolean
  className?: string
  inputClassName?: string
  title?: string
}

/** Numeric input with the native spinner arrows removed — at the compact
 *  widths this sheet uses, the browser's default up/down buttons sit
 *  directly on top of the digits. Centers text and widens the hit area
 *  instead, with optional explicit +/- steppers for prominent fields. */
const NumberField: React.FC<NumberFieldProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  withSteppers = false,
  className,
  inputClassName,
  title,
}) => {
  const clamp = (n: number) => {
    if (min !== undefined && n < min) return min
    if (max !== undefined && n > max) return max
    return n
  }

  const input = (
    <Input
      type="number"
      value={Number.isNaN(value) ? '' : value}
      title={title}
      onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
      className={cn(
        'text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
        inputClassName,
      )}
    />
  )

  if (!withSteppers) return input

  return (
    <div className={cn('flex items-stretch gap-1', className)}>
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        className="flex items-center justify-center bg-(--fd-dropdown-bg) hover:bg-(--fd-border) border border-(--fd-border) rounded-md size-7 text-(--fd-text-muted) shrink-0 transition-colors"
        title="Decrease"
      >
        <Minus className="size-3" />
      </button>
      {input}
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        className="flex items-center justify-center bg-(--fd-dropdown-bg) hover:bg-(--fd-border) border border-(--fd-border) rounded-md size-7 text-(--fd-text-muted) shrink-0 transition-colors"
        title="Increase"
      >
        <Plus className="size-3" />
      </button>
    </div>
  )
}

export default NumberField
