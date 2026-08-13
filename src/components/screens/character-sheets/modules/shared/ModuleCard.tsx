import React from 'react'
import { ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ModuleCardProps {
  label: string
  icon: LucideIcon
  onChangeLabel: (label: string) => void
  onDelete: () => void
  onMoveUp: (() => void) | null
  onMoveDown: (() => void) | null
  children: React.ReactNode
}

/** Shared chrome for every module renderer: a type icon, editable label
 *  heading, reorder controls, and delete — wrapping the module-specific
 *  body. */
const ModuleCard: React.FC<ModuleCardProps> = ({
  label,
  icon: Icon,
  onChangeLabel,
  onDelete,
  onMoveUp,
  onMoveDown,
  children,
}) => (
  <div className="flex flex-col gap-3 bg-(--fd-dropdown-bg) shadow-sm border border-(--fd-border) rounded-lg overflow-hidden">
    <div className="flex items-center gap-2 bg-black/10 px-3 py-2 border-(--fd-border) border-b">
      <GripVertical className="size-3.5 text-(--fd-text-muted)/50 shrink-0" />
      <Icon className="size-3.5 text-(--fd-accent) shrink-0" />
      <Input
        value={label}
        onChange={(e) => onChangeLabel(e.target.value)}
        className="bg-transparent px-1.5 border-transparent hover:border-(--fd-border) focus-visible:border-ring h-6 font-semibold text-xs"
      />
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="disabled:opacity-30 size-6 text-(--fd-text-muted)"
          onClick={() => onMoveUp?.()}
          disabled={!onMoveUp}
          title="Move up"
        >
          <ChevronUp className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="disabled:opacity-30 size-6 text-(--fd-text-muted)"
          onClick={() => onMoveDown?.()}
          disabled={!onMoveDown}
          title="Move down"
        >
          <ChevronDown className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-(--fd-text-muted) hover:text-destructive"
          onClick={onDelete}
          title="Remove module"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
    <div className="flex flex-col gap-2 px-3 pb-3">{children}</div>
  </div>
)

export default ModuleCard
