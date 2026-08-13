import React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Base classes for the dashed "add" affordance, exported so components
 *  that need to apply it to a non-<button> trigger (e.g. a base-ui
 *  DropdownMenuTrigger, which renders its own element and doesn't support
 *  wrapping via asChild) can reuse the same look without nesting buttons. */
export const ADD_TILE_CLASSNAME =
  'flex items-center justify-center gap-1.5 rounded-md border border-dashed border-(--fd-border) text-(--fd-text-muted) text-xs hover:border-(--fd-accent) hover:text-(--fd-accent) transition-colors py-2.5 px-3 w-full'

interface AddTileProps {
  label: string
  onClick?: () => void
  className?: string
  /** For wrapping in a trigger (e.g. DropdownMenuTrigger) that owns its own
   *  click handling — pass no onClick and this component still renders as
   *  a plain button so the wrapper can attach its own props. */
  children?: React.ReactNode
}

/** Dashed-border "add" affordance, styled as an empty slot rather than a
 *  toolbar button — used for the last cell in the module grid and for
 *  trailing rows in per-module item lists (gear, list items, skills...). */
const AddTile = React.forwardRef<HTMLButtonElement, AddTileProps>(
  ({ label, onClick, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      className={cn(ADD_TILE_CLASSNAME, className)}
      {...rest}
    >
      <Plus className="size-3.5" />
      {label}
      {children}
    </button>
  ),
)
AddTile.displayName = 'AddTile'

export default AddTile
