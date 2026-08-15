// activity-panel.tsx
import { type ReactNode, type CSSProperties } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { cn } from '@/lib/utils'

// ─── Shell ───────────────────────────────────────────────

interface ShellProps {
  children: ReactNode
  className?: string
}

export const Shell = ({ children, className }: ShellProps) => {
  return <div className={cn('flex flex-col h-full', className)}>{children}</div>
}

// ─── Header ──────────────────────────────────────────────

interface HeaderProps {
  children: ReactNode
  className?: string
}

export const Header = ({ children, className }: HeaderProps) => {
  return (
    <div
      className={cn(
        'flex items-center px-3.5 py-2 border-b border-(--fd-border) shrink-0 gap-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ─── Title ───────────────────────────────────────────────

interface TitleProps {
  children: ReactNode
  className?: string
}

export const Title = ({ children, className }: TitleProps) => (
  <span
    className={cn(
      'font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)',
      className,
    )}
  >
    {children}
  </span>
)

// ─── Meta ────────────────────────────────────────────────

interface MetaProps {
  children: ReactNode
  className?: string
}

export const Meta = ({ children, className }: MetaProps) => (
  <span className={cn('text-xs text-(--fd-text) opacity-70', className)}>
    {children}
  </span>
)

// ─── Interactions ────────────────────────────────────────
// Freeform header slot for buttons, icons, controls etc.
// Defaults to pushing itself to the end of the header row.

interface InteractionsProps {
  children: ReactNode
  className?: string
}

export const Interactions = ({ children, className }: InteractionsProps) => (
  <div className={cn('flex items-center gap-1.5 ml-auto', className)}>
    {children}
  </div>
)

// ─── SubHeader ───────────────────────────────────────────
// Sits below the title bar, outside the scroll area.
// e.g. filters, tabs, search input.

interface SubHeaderProps {
  children: ReactNode
  className?: string
}

export const SubHeader = ({ children, className }: SubHeaderProps) => (
  <div
    className={cn(
      'flex  items-center py-2 border-b border-(--fd-border) shrink-0 gap-2 w-full',
      className,
    )}
  >
    {children}
  </div>
)

// ─── Content ─────────────────────────────────────────────

interface ContentProps {
  children: ReactNode
  headerOffset?: string
  className?: string
}

export const Content = ({
  children,
  headerOffset = '3dvh',
  className,
}: ContentProps) => {
  return (
    <div className="flex-1 w-full overflow-y-auto">
      <ScrollArea
        className={cn(
          'w-full h-[calc(var(--app-h)-var(--header-offset))]',
          className,
        )}
        style={{ '--header-offset': headerOffset } as CSSProperties}
      >
        <div className="p-2">{children}</div>
      </ScrollArea>
    </div>
  )
}
