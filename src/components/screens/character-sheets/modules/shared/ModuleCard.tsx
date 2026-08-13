import React from 'react'
import { ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ModuleLayout } from '../../types'

const SIZE_OPTIONS = [1, 2, 3, 4, 5, 6]

interface ModuleCardProps {
  label: string
  icon: LucideIcon
  layout: ModuleLayout
  onChangeLabel: (label: string) => void
  onChangeLayout: (layout: ModuleLayout) => void
  onDelete: () => void
  onMoveUp: (() => void) | null
  onMoveDown: (() => void) | null
  children: React.ReactNode
}

/** Shared chrome for every module renderer: a type icon, editable label
 *  heading, size controls, reorder controls, and delete — wrapping the
 *  module-specific body. Sizing is a plain <select> pair (not a shadcn
 *  primitive) so it stays compact enough to live inline in the header. */
const ModuleCard: React.FC<ModuleCardProps> = ({
  label,
  icon: Icon,
  layout,
  onChangeLabel,
  onChangeLayout,
  onDelete,
  onMoveUp,
  onMoveDown,
  children,
}) => (
  <div className="flex flex-col gap-3 bg-(--fd-dropdown-bg) shadow-sm border border-(--fd-border) rounded-lg h-full overflow-hidden">
    <div className="flex items-center gap-2 bg-black/10 px-3 py-2 border-(--fd-border) border-b">
      <GripVertical className="size-3.5 text-(--fd-text-muted)/50 shrink-0" />
      <Icon className="size-3.5 text-(--fd-accent) shrink-0" />
      <Input
        value={label}
        onChange={(e) => onChangeLabel(e.target.value)}
        className="bg-transparent px-1.5 border-transparent hover:border-(--fd-border) focus-visible:border-ring h-6 font-semibold text-xs"
      />
      <div className="flex items-center gap-1 shrink-0">
        <SizeSelect
          value={layout.w}
          title="Width (grid columns, 1-6)"
          onChange={(w) => onChangeLayout({ ...layout, w })}
        />
        <span className="text-(--fd-text-muted)/50 text-[10px]">×</span>
        <SizeSelect
          value={layout.h}
          title="Height (grid rows, 1-6)"
          onChange={(h) => onChangeLayout({ ...layout, h })}
        />
      </div>
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
    <div className="flex flex-col flex-1 gap-2 px-3 pb-3">{children}</div>
  </div>
)

const SizeSelect: React.FC<{
  value: number
  title: string
  onChange: (value: number) => void
}> = ({ value, title, onChange }) => (
  <select
    value={value}
    title={title}
    onChange={(e) => onChange(Number(e.target.value))}
    className="bg-transparent hover:bg-black/20 px-0.5 border border-(--fd-border) rounded text-[10px] text-(--fd-text-muted) h-6 outline-none cursor-pointer"
  >
    {SIZE_OPTIONS.map((n) => (
      <option key={n} value={n} className="bg-(--fd-dropdown-bg)">
        {n}
      </option>
    ))}
  </select>
)

export default ModuleCard
