import React from 'react'
import { ToggleLeft, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { uuid } from '@/utils/open-draft/uuid'
import ModuleCard from './shared/ModuleCard'
import AddTile from './shared/AddTile'
import type { ModuleComponentProps } from './moduleProps'

/** Named on/off switches — flags like "Inspiration" or "Advantage", visually
 *  distinct from List's checkable-item rows. No shadcn `switch` primitive is
 *  installed in this project, so this is hand-rolled like PipRow/TrackerBar. */
export interface ToggleItem {
  id: string
  label: string
  enabled: boolean
}

export interface TogglesConfig {}

export interface TogglesValues {
  items: ToggleItem[]
}

export const defaultTogglesConfig: TogglesConfig = {}
export const defaultTogglesValues: TogglesValues = { items: [] }

const TogglesModule: React.FC<
  ModuleComponentProps<TogglesConfig, TogglesValues>
> = ({ module, layout, onChangeLabel, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => {
  const { values } = module

  return (
    <ModuleCard
      label={module.label}
      icon={ToggleLeft}
      layout={layout}
      onChangeLabel={onChangeLabel}
      onChangeLayout={onChangeLayout}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col gap-1.5">
        {values.items.map((item) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                onChangeValues({
                  items: values.items.map((i) =>
                    i.id === item.id ? { ...i, enabled: !i.enabled } : i,
                  ),
                })
              }
              className={`relative shrink-0 w-8 h-4.5 rounded-full transition-colors ${
                item.enabled ? 'bg-(--fd-accent)' : 'bg-black/30'
              }`}
              title={item.enabled ? 'On' : 'Off'}
            >
              <span
                className={`absolute top-0.5 size-3.5 rounded-full bg-white transition-all ${
                  item.enabled ? 'left-4' : 'left-0.5'
                }`}
              />
            </button>
            <Input
              value={item.label}
              onChange={(e) =>
                onChangeValues({
                  items: values.items.map((i) =>
                    i.id === item.id ? { ...i, label: e.target.value } : i,
                  ),
                })
              }
              className="flex-1 h-7 text-xs"
            />
            <button
              type="button"
              onClick={() =>
                onChangeValues({ items: values.items.filter((i) => i.id !== item.id) })
              }
              className="text-(--fd-text-muted) hover:text-destructive shrink-0"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <AddTile
          label="Add Toggle"
          onClick={() =>
            onChangeValues({
              items: [...values.items, { id: uuid(), label: 'New Toggle', enabled: false }],
            })
          }
        />
      </div>
    </ModuleCard>
  )
}

export default TogglesModule
