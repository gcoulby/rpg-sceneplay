import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface DieChipProps {
  value: number | string
  label?: string
  size?: 'sm' | 'default'
  type?: 'default' | 'action' | 'challenge'
  sides?: number
  variant?:
    | 'default'
    | 'accent'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'destructive'
    | 'action'
    | 'muted'
  // variant?: 'default' | 'action' | 'challenge'
  onClick?: () => void
  className?: string
}

const VARIANT_CLASSES: Record<NonNullable<DieChipProps['variant']>, string> = {
  default: 'bg-foreground text-background',
  accent: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-muted-foreground',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
  destructive: 'bg-destructive text-destructive-foreground',
  action:
    'border-2 bg-transparent! border-foreground! text-background! rounded-full',
  muted: 'bg-secondary! text-muted-foreground!',
}

const SIDE_CLASSES: Record<NonNullable<DieChipProps['sides']>, string> = {
  4: 'bg-[#8e61f8] text-white ',
  6: 'bg-[#4f46e5] text-white',
  8: 'bg-[#2595eb] text-white',
  10: 'bg-[#059669] text-white',
  12: 'bg-[#eab308] text-black',
  20: 'bg-[#f97316] text-black',
  100: 'bg-[#ef4444] text-white',
}

export default function DieChip({
  value,
  size = 'default',
  variant = 'default',
  sides = 6,
  onClick,
  className,
}: DieChipProps) {
  const Comp = onClick ? 'button' : 'div'
  const compSize = useMemo(() => {
    if (size === 'sm') {
      return 'h-10 w-10 text-xs'
    } else if (variant === 'action') {
      return 'h-12 w-12 text-sm'
    } else {
      return 'h-14 w-14 text-sm'
    }
  }, [size, variant])

  return (
    <div className="flex flex-col justify-center items-center gap-2">
      <Comp
        onClick={onClick}
        className={cn(
          'flex flex-col justify-center items-center shadow-sm border rounded-xl font-semibold',
          compSize,
          VARIANT_CLASSES[variant],
          SIDE_CLASSES[sides],

          onClick &&
            'cursor-pointer transition-transform hover:scale-105 active:scale-95',
          className,
        )}
      >
        <span
          className={
            variant === 'action'
              ? 'bg-foreground flex rounded-full w-[80%] h-[80%] items-center justify-center'
              : ''
          }
        >
          {value}
        </span>
      </Comp>
    </div>
  )
}
