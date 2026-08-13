import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ModuleCardProps {
  label: string
  onChangeLabel: (label: string) => void
  onDelete: () => void
  children: React.ReactNode
}

/** Shared chrome for every module renderer: an editable label heading and a
 *  delete action, wrapping whatever the module-specific body is. */
const ModuleCard: React.FC<ModuleCardProps> = ({
  label,
  onChangeLabel,
  onDelete,
  children,
}) => (
  <div className="flex flex-col gap-2 bg-(--fd-dropdown-bg) p-3 border border-(--fd-border) rounded-md">
    <div className="flex items-center gap-2">
      <Input
        value={label}
        onChange={(e) => onChangeLabel(e.target.value)}
        className="h-7 font-semibold text-xs"
      />
      <Button
        variant="ghost"
        size="icon"
        className="size-6 text-(--fd-text-muted) shrink-0"
        onClick={onDelete}
        title="Remove module"
      >
        <X className="size-3.5" />
      </Button>
    </div>
    {children}
  </div>
)

export default ModuleCard
