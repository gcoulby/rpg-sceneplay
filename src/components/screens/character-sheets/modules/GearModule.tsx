import React from 'react'
import { Backpack, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import ModuleCard from './shared/ModuleCard'
import NumberField from './shared/NumberField'
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
> = ({ module, onChangeLabel, onChangeValues, onDelete, onMoveUp, onMoveDown }) => {
  const { values } = module

  return (
    <ModuleCard
      label={module.label}
      icon={Backpack}
      onChangeLabel={onChangeLabel}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col gap-1.5">
        {values.items.length > 0 && (
          <div className="flex items-center gap-1.5 px-0.5 text-[10px] text-(--fd-text-muted) uppercase tracking-wide">
            <span className="flex-2">Item</span>
            <span className="w-12 text-center">Qty</span>
            <span className="w-14 text-center">Wt.</span>
            <span className="flex-[1.5]">Notes</span>
            <span className="w-8" />
          </div>
        )}
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
              className="flex-2 h-8 text-xs"
              placeholder="Item"
            />
            <NumberField
              value={item.qty}
              onChange={(v) =>
                onChangeValues({
                  items: values.items.map((i) => (i.id === item.id ? { ...i, qty: v } : i)),
                })
              }
              inputClassName="h-8 w-12"
              title="Quantity"
            />
            <NumberField
              value={item.weight}
              onChange={(v) =>
                onChangeValues({
                  items: values.items.map((i) => (i.id === item.id ? { ...i, weight: v } : i)),
                })
              }
              inputClassName="h-8 w-14"
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
              className="flex-[1.5] h-8 text-xs"
              placeholder="Notes"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-(--fd-text-muted) shrink-0"
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
