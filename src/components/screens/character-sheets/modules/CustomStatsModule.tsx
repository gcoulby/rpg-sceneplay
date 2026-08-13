import React from 'react'
import { X } from 'lucide-react'
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
> = ({ module, onChangeLabel, onChangeConfig, onChangeValues, onDelete }) => {
  const { config, values } = module

  return (
    <ModuleCard label={module.label} onChangeLabel={onChangeLabel} onDelete={onDelete}>
      <div className="flex flex-col gap-1.5">
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
              className="h-7 text-xs"
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
              <SelectTrigger className="h-7 w-20 text-xs">
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
            <Input
              type="number"
              value={values[row.id] ?? 0}
              onChange={(e) =>
                onChangeValues({ ...values, [row.id]: Number(e.target.value) || 0 })
              }
              className="h-7 w-16 text-xs text-right"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-(--fd-text-muted)"
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
        <Button
          variant="outline"
          size="sm"
          className="self-start h-7 text-xs"
          onClick={() =>
            onChangeConfig({
              rows: [...config.rows, { id: uuid(), label: 'New Stat', die: 'd20' }],
            })
          }
        >
          + Stat
        </Button>
      </div>
    </ModuleCard>
  )
}

export default CustomStatsModule
