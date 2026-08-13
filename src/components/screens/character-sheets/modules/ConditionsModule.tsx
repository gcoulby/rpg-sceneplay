import React from 'react'
import { X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import ModuleCard from './shared/ModuleCard'
import type { ModuleComponentProps } from './moduleProps'

export interface ConditionItem {
  id: string
  label: string
  active: boolean
}

export interface ConditionsConfig {}

export interface ConditionsValues {
  items: ConditionItem[]
}

export const defaultConditionsConfig: ConditionsConfig = {}
export const defaultConditionsValues: ConditionsValues = { items: [] }

const ConditionsModule: React.FC<
  ModuleComponentProps<ConditionsConfig, ConditionsValues>
> = ({ module, onChangeLabel, onChangeValues, onDelete }) => {
  const { values } = module

  return (
    <ModuleCard label={module.label} onChangeLabel={onChangeLabel} onDelete={onDelete}>
      <div className="flex flex-wrap gap-1.5">
        {values.items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-1 pl-2 pr-1 py-1 rounded-full border text-[11px] cursor-pointer transition-colors ${
              item.active
                ? 'bg-(--fd-accent) border-(--fd-accent) text-white'
                : 'bg-transparent border-(--fd-border) text-(--fd-text-muted)'
            }`}
            onClick={() =>
              onChangeValues({
                items: values.items.map((i) =>
                  i.id === item.id ? { ...i, active: !i.active } : i,
                ),
              })
            }
          >
            {item.label}
            <Button
              variant="ghost"
              size="icon"
              className="size-3.5"
              onClick={(e) => {
                e.stopPropagation()
                onChangeValues({ items: values.items.filter((i) => i.id !== item.id) })
              }}
            >
              <X className="size-2.5" />
            </Button>
          </div>
        ))}
        <NewConditionInput
          onAdd={(label) =>
            onChangeValues({ items: [...values.items, { id: uuid(), label, active: false }] })
          }
        />
      </div>
    </ModuleCard>
  )
}

const NewConditionInput: React.FC<{ onAdd: (label: string) => void }> = ({ onAdd }) => {
  const [value, setValue] = React.useState('')
  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && value.trim()) {
          onAdd(value.trim())
          setValue('')
        }
      }}
      placeholder="+ Condition (Enter)"
      className="h-6 w-36 text-[11px]"
    />
  )
}

export default ConditionsModule
