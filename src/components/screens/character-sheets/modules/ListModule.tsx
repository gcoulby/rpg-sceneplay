import React from 'react'
import { Check, ListChecks, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import ModuleCard from './shared/ModuleCard'
import AddTile from './shared/AddTile'
import type { ModuleComponentProps } from './moduleProps'

/** Generic toggleable checklist — covers feats/traits/etc. without a
 *  dedicated module per category. */
export interface ListItem {
  id: string
  label: string
  checked: boolean
}

export interface ListConfig {}

export interface ListValues {
  items: ListItem[]
}

export const defaultListConfig: ListConfig = {}
export const defaultListValues: ListValues = { items: [] }

const ListModule: React.FC<
  ModuleComponentProps<ListConfig, ListValues>
> = ({ module, layout, onChangeLabel, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => {
  const { values } = module

  return (
    <ModuleCard
      label={module.label}
      icon={ListChecks}
      layout={layout}
      onChangeLabel={onChangeLabel}
      onChangeLayout={onChangeLayout}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col gap-1">
        {values.items.map((item) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                onChangeValues({
                  items: values.items.map((i) =>
                    i.id === item.id ? { ...i, checked: !i.checked } : i,
                  ),
                })
              }
              className={`flex items-center justify-center size-5 rounded border-2 shrink-0 transition-colors ${
                item.checked
                  ? 'bg-(--fd-accent) border-(--fd-accent)'
                  : 'bg-transparent border-(--fd-border) hover:border-(--fd-text-muted)'
              }`}
              title={item.checked ? 'Mark incomplete' : 'Mark complete'}
            >
              {item.checked && <Check className="size-3.5 text-white" />}
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
              className={`h-7 text-xs ${item.checked ? 'line-through text-(--fd-text-muted)' : ''}`}
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-(--fd-text-muted) shrink-0"
              onClick={() =>
                onChangeValues({ items: values.items.filter((i) => i.id !== item.id) })
              }
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        <AddTile
          label="Add Item"
          onClick={() =>
            onChangeValues({
              items: [...values.items, { id: uuid(), label: 'New item', checked: false }],
            })
          }
        />
      </div>
    </ModuleCard>
  )
}

export default ListModule
