import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReferredInScriptPanelProps {
  names: string[]
  onAdd: (name: string) => void
  onClose: () => void
}

const ReferredInScriptPanel: React.FC<ReferredInScriptPanelProps> = ({
  names,
  onAdd,
  onClose,
}) => (
  <div className="absolute inset-0 z-2 bg-(--fd-navigator-bg) flex flex-col">
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center justify-between py-2.5 px-3 border-b border-(--fd-border) font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
        <span>Referred in Script</span>
        <Button variant="ghost" size="icon" className="size-6 text-(--fd-text-muted)" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>
      <div className="py-2 px-3 text-[11px] text-(--fd-text-muted) border-b border-(--fd-border) leading-normal">
        Names found in ALL CAPS in action lines that are not yet in the character list.
      </div>
      <div className="flex-1 p-1.5 overflow-y-auto">
        {names.map((name) => (
          <div
            key={name}
            className="flex items-center justify-between py-1 px-2 rounded-[3px] hover:bg-(--fd-overlay-subtle)"
          >
            <span className="text-[11px] text-(--fd-text-muted) uppercase tracking-[0.3px]">
              {name}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-auto py-0.5 px-2 text-[10px] text-(--fd-accent)"
              onClick={() => onAdd(name)}
              title="Add to character list"
            >
              + Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default ReferredInScriptPanel
