import React from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import ModuleCard from './shared/ModuleCard'
import type { ModuleComponentProps } from './moduleProps'

export interface GearItem {
  id: string
  name: string
  qty: number
  weight: number
  notes: string
}

export interface GearConfig {}

export interface GearValues {
  items: GearItem[]
}

export const defaultGearConfig: GearConfig = {}
export const defaultGearValues: GearValues = { items: [] }

const GearModule: React.FC<
  ModuleComponentProps<GearConfig, GearValues>
> = ({ module, onChangeLabel, onChangeValues, onDelete }) => {
  const { values } = module

  return (
    <ModuleCard label={module.label} onChangeLabel={onChangeLabel} onDelete={onDelete}>
      <div className="flex flex-col gap-1.5">
        {values.items.map((item) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <Input
              value={item.name}
              onChange={(e) =>
                onChangeValues({
                  items: values.items.map((i) =>
                    i.id === item.id ? { ...i, name: e.target.value } : i,
                  ),
                })
              }
              className="h-7 text-xs"
              placeholder="Item"
            />
            <Input
              type="number"
              value={item.qty}
              onChange={(e) =>
                onChangeValues({
                  items: values.items.map((i) =>
                    i.id === item.id ? { ...i, qty: Number(e.target.value) || 0 } : i,
                  ),
                })
              }
              className="h-7 w-14 text-xs text-right"
              title="Quantity"
            />
            <Input
              type="number"
              value={item.weight}
              onChange={(e) =>
                onChangeValues({
                  items: values.items.map((i) =>
                    i.id === item.id
                      ? { ...i, weight: Number(e.target.value) || 0 }
                      : i,
                  ),
                })
              }
              className="h-7 w-16 text-xs text-right"
              title="Weight"
            />
            <Input
              value={item.notes}
              onChange={(e) =>
                onChangeValues({
                  items: values.items.map((i) =>
                    i.id === item.id ? { ...i, notes: e.target.value } : i,
                  ),
                })
              }
              className="h-7 text-xs"
              placeholder="Notes"
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
              items: [
                ...values.items,
                { id: uuid(), name: 'New Item', qty: 1, weight: 0, notes: '' },
              ],
            })
          }
        >
          + Item
        </Button>
      </div>
    </ModuleCard>
  )
}

export default GearModule
