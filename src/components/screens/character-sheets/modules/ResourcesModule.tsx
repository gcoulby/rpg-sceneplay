import React from 'react'
import { Gauge, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import ModuleCard from './shared/ModuleCard'
import NumberField from './shared/NumberField'
import AddTile from './shared/AddTile'
import type { ModuleComponentProps } from './moduleProps'

/** Multiple small named pools in one card (Mana 4/10, Stamina 2/5...) —
 *  distinct from Tracker, which is one big bar per module instance. */
export interface ResourceRow {
  id: string
  label: string
  current: number
  max: number
}

export interface ResourcesConfig {}

export interface ResourcesValues {
  rows: ResourceRow[]
}

export const defaultResourcesConfig: ResourcesConfig = {}
export const defaultResourcesValues: ResourcesValues = { rows: [] }

const ResourcesModule: React.FC<
  ModuleComponentProps<ResourcesConfig, ResourcesValues>
> = ({ module, layout, onChangeLabel, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => {
  const { values } = module

  const updateRow = (id: string, updates: Partial<ResourceRow>) =>
    onChangeValues({ rows: values.rows.map((r) => (r.id === id ? { ...r, ...updates } : r)) })

  return (
    <ModuleCard
      label={module.label}
      icon={Gauge}
      layout={layout}
      onChangeLabel={onChangeLabel}
      onChangeLayout={onChangeLayout}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col gap-2">
        {values.rows.map((row) => {
          const pct = row.max > 0 ? Math.min(100, Math.max(0, (row.current / row.max) * 100)) : 0
          return (
            <div key={row.id} className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Input
                  value={row.label}
                  onChange={(e) => updateRow(row.id, { label: e.target.value })}
                  placeholder="Resource"
                  className="h-7 text-xs"
                />
                <NumberField
                  value={row.current}
                  min={0}
                  onChange={(v) => updateRow(row.id, { current: v })}
                  inputClassName="h-7 w-12"
                  title="Current"
                />
                <span className="text-(--fd-text-muted) text-xs">/</span>
                <NumberField
                  value={row.max}
                  min={0}
                  onChange={(v) => updateRow(row.id, { max: v })}
                  inputClassName="h-7 w-12"
                  title="Max"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-(--fd-text-muted) shrink-0"
                  onClick={() => onChangeValues({ rows: values.rows.filter((r) => r.id !== row.id) })}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
              <div className="bg-black/30 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-(--fd-accent) h-full transition-[width] duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
        <AddTile
          label="Add Resource"
          onClick={() =>
            onChangeValues({
              rows: [...values.rows, { id: uuid(), label: 'New Resource', current: 5, max: 5 }],
            })
          }
        />
      </div>
    </ModuleCard>
  )
}

export default ResourcesModule
