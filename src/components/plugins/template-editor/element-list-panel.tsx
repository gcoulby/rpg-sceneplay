import { FaPlus, FaTrash } from 'react-icons/fa'
import type { FormattingElementRule } from '@/stores/formattingTypes'
import { Button } from '@/components/ui/button'

interface ElementListPanelProps {
  rules: Record<string, FormattingElementRule>
  selectedId: string | null
  onSelect: (id: string) => void
  onToggleEnabled: (id: string, enabled: boolean) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

export default function ElementListPanel({
  rules,
  selectedId,
  onSelect,
  onToggleEnabled,
  onAdd,
  onRemove,
}: ElementListPanelProps) {
  return (
    <div className="flex flex-col border-r w-60 min-w-50">
      <div className="flex justify-between items-center px-3 py-2 font-bold text-muted-foreground text-xs uppercase tracking-[0.5px]">
        <span>Elements</span>
        <Button
          size="icon"
          variant="outline"
          className="w-6 h-6"
          onClick={onAdd}
          title="Add custom element"
        >
          <FaPlus className="text-[11px]" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {Object.values(rules).map((rule) => (
          <div
            key={rule.id}
            className={`flex items-center gap-2 py-1.5 px-3 cursor-pointer text-[13px] border-l-[3px] border-l-transparent hover:bg-muted ${
              selectedId === rule.id ? 'bg-muted border-l-primary' : ''
            } ${!rule.enabled ? 'opacity-50' : ''}`}
            onClick={() => onSelect(rule.id)}
          >
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={(e) => onToggleEnabled(rule.id, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="flex-1">
              {rule.label}
              {!rule.isBuiltIn && (
                <span className="bg-primary ml-1 px-1 py-0.5 rounded-[3px] text-[9px] text-primary-foreground">
                  custom
                </span>
              )}
            </span>
            {!rule.isBuiltIn && (
              <button
                className="p-0.5 text-[11px] text-muted-foreground hover:text-red-500 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(rule.id)
                }}
                title="Remove element"
              >
                <FaTrash />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
