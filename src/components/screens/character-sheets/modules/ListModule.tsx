import React from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import ModuleCard from './shared/ModuleCard'
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
> = ({ module, onChangeLabel, onChangeValues, onDelete }) => {
  const { values } = module

  return (
    <ModuleCard label={module.label} onChangeLabel={onChangeLabel} onDelete={onDelete}>
      <div className="flex flex-col gap-1">
        {values.items.map((item) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() =>
                onChangeValues({
                  items: values.items.map((i) =>
                    i.id === item.id ? { ...i, checked: !i.checked } : i,
                  ),
                })
              }
              className="accent-(--fd-accent) size-3.5"
            />
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
        <Button
          variant="outline"
          size="sm"
          className="self-start h-7 text-xs"
          onClick={() =>
            onChangeValues({
              items: [...values.items, { id: uuid(), label: 'New item', checked: false }],
            })
          }
        >
          + Item
        </Button>
      </div>
    </ModuleCard>
  )
}

export default ListModule
