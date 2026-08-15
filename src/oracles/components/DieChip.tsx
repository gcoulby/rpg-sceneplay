import { cn } from '@/lib/utils'

interface DieChipProps {
  value: number | string
  label?: string
  size?: 'sm' | 'default'
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'destructive'
  onClick?: () => void
  className?: string
}

const VARIANT_CLASSES: Record<NonNullable<DieChipProps['variant']>, string> = {
  default: 'bg-foreground text-background',
  accent: 'bg-primary text-primary-foreground',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
  destructive: 'bg-destructive text-destructive-foreground',
}

/**
 * The one shared "rolled value" visual across the oracle feature — story
 * cubes, hit-roll dice, formula-roll terms, table results all render
 * through this so the feature reads as one designed system instead of each
 * roller inventing its own button/badge.
 */
export default function DieChip({
  value,
  label,
  size = 'default',
  variant = 'default',
  onClick,
  className,
}: DieChipProps) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border font-semibold shadow-sm',
        size === 'sm' ? 'h-9 w-9 text-sm' : 'h-14 w-14 text-lg',
        VARIANT_CLASSES[variant],
        onClick && 'cursor-pointer transition-transform hover:scale-105 active:scale-95',
        className,
      )}
    >
      <span>{value}</span>
      {label && (
        <span
          className={cn(
            'font-normal opacity-80',
            size === 'sm' ? 'text-[7px]' : 'text-[9px]',
          )}
        >
          {label}
        </span>
      )}
    </Comp>
  )
}
