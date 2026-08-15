import React, { useState } from 'react'
import { AlertTriangle, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { uuid } from '@/utils/open-draft/uuid'
import { CONDITION_PRESETS } from './conditionPresets'
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
> = ({ module, layout, onChangeLabel, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => {
  const { values } = module
  const existingLabels = new Set(values.items.map((i) => i.label.toLowerCase()))
  const availablePresets = CONDITION_PRESETS.filter(
    (p) => !existingLabels.has(p.toLowerCase()),
  )

  const addCondition = (label: string) => {
    if (!label.trim() || existingLabels.has(label.trim().toLowerCase())) return
    onChangeValues({
      items: [...values.items, { id: uuid(), label: label.trim(), active: false }],
    })
  }

  return (
    <ModuleCard
      label={module.label}
      icon={AlertTriangle}
      layout={layout}
      onChangeLabel={onChangeLabel}
      onChangeLayout={onChangeLayout}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col gap-3">
        {values.items.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {values.items.map((item) => (
              <div
                key={item.id}
                className={`group flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full border text-xs cursor-pointer transition-colors ${
                  item.active
                    ? 'bg-(--fd-accent) border-(--fd-accent) text-white'
                    : 'bg-transparent border-(--fd-border) text-(--fd-text-muted) hover:border-(--fd-text-muted)'
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
                <button
                  type="button"
                  className="flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full size-3.5 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    onChangeValues({ items: values.items.filter((i) => i.id !== item.id) })
                  }}
                >
                  <X className="size-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {availablePresets.length > 0 && (
            <Select
              onValueChange={(v: string | null) => {
                if (v) addCondition(v)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Add from list…" />
              </SelectTrigger>
              <SelectContent>
                {availablePresets.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {preset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <CustomConditionInput onAdd={addCondition} />
        </div>
      </div>
    </ModuleCard>
  )
}

const CustomConditionInput: React.FC<{ onAdd: (label: string) => void }> = ({ onAdd }) => {
  const [value, setValue] = useState('')
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            onAdd(value)
            setValue('')
          }
        }}
        placeholder="Custom…"
        className="h-8 w-28 text-xs"
      />
      <Button
        variant="outline"
        size="icon"
        className="size-8 shrink-0"
        title="Add condition"
        onClick={() => {
          if (value.trim()) {
            onAdd(value)
            setValue('')
          }
        }}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  )
}

export default ConditionsModule
