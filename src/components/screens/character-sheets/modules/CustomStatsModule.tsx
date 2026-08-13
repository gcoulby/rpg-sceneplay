import React from 'react'
import { Sparkles, X } from 'lucide-react'
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
import ModuleCard from './shared/ModuleCard'
import NumberField from './shared/NumberField'
import AddTile from './shared/AddTile'
import type { ModuleComponentProps } from './moduleProps'

const DIE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100', 'flat']

export interface CustomStatRow {
  id: string
  label: string
  die: string
}

export interface CustomStatsConfig {
  rows: CustomStatRow[]
}

/** Keyed by row id. Row labels are what formula fields reference. */
export type CustomStatsValues = Record<string, number>

export const defaultCustomStatsConfig: CustomStatsConfig = { rows: [] }
export const defaultCustomStatsValues: CustomStatsValues = {}

const CustomStatsModule: React.FC<
  ModuleComponentProps<CustomStatsConfig, CustomStatsValues>
> = ({
  module,
  layout,
  onChangeLabel,
  onChangeConfig,
  onChangeValues,
  onChangeLayout,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const { config, values } = module

  return (
    <ModuleCard
      label={module.label}
      icon={Sparkles}
      layout={layout}
      onChangeLabel={onChangeLabel}
      onChangeLayout={onChangeLayout}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col gap-1.5">
        {config.rows.length > 0 && (
          <div className="flex items-center gap-1.5 px-0.5 text-[10px] text-(--fd-text-muted) uppercase tracking-wide">
            <span className="flex-1">Stat</span>
            <span className="w-20">Die</span>
            <span className="w-14 text-center">Value</span>
            <span className="w-6" />
          </div>
        )}
        {config.rows.map((row) => (
          <div key={row.id} className="flex items-center gap-1.5">
            <Input
              value={row.label}
              onChange={(e) =>
                onChangeConfig({
                  rows: config.rows.map((r) =>
                    r.id === row.id ? { ...r, label: e.target.value } : r,
                  ),
                })
              }
              className="h-8 text-xs"
              placeholder="Stat name"
            />
            <Select
              value={row.die}
              onValueChange={(die) => {
                if (!die) return
                onChangeConfig({
                  rows: config.rows.map((r) => (r.id === row.id ? { ...r, die } : r)),
                })
              }}
            >
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIE_TYPES.map((die) => (
                  <SelectItem key={die} value={die}>
                    {die}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <NumberField
              value={values[row.id] ?? 0}
              onChange={(v) => onChangeValues({ ...values, [row.id]: v })}
              inputClassName="h-8 w-14"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-(--fd-text-muted) shrink-0"
              onClick={() => {
                onChangeConfig({ rows: config.rows.filter((r) => r.id !== row.id) })
                const nextValues = { ...values }
                delete nextValues[row.id]
                onChangeValues(nextValues)
              }}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        <AddTile
          label="Add Stat"
          onClick={() =>
            onChangeConfig({
              rows: [...config.rows, { id: uuid(), label: 'New Stat', die: 'd20' }],
            })
          }
        />
      </div>
    </ModuleCard>
  )
}

export default CustomStatsModule
