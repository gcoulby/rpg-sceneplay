import React, { useState } from 'react'
import { Target, X, Dices } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import { rollFormula } from '../formula/rollFormula'
import ModuleCard from './shared/ModuleCard'
import NumberField from './shared/NumberField'
import AddTile from './shared/AddTile'
import type { ModuleComponentProps } from './moduleProps'

export interface SkillRow {
  id: string
  name: string
  modifier: number
}

export interface SkillsConfig {
  showRoll: boolean
}

export interface SkillsValues {
  rows: SkillRow[]
}

export const defaultSkillsConfig: SkillsConfig = { showRoll: true }
export const defaultSkillsValues: SkillsValues = { rows: [] }

const SkillsModule: React.FC<
  ModuleComponentProps<SkillsConfig, SkillsValues>
> = ({ module, layout, onChangeLabel, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => {
  const { values } = module
  const [lastRoll, setLastRoll] = useState<Record<string, number>>({})

  return (
    <ModuleCard
      label={module.label}
      icon={Target}
      layout={layout}
      onChangeLabel={onChangeLabel}
      onChangeLayout={onChangeLayout}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col gap-1.5">
        {values.rows.map((row) => (
          <div key={row.id} className="flex items-center gap-1.5">
            <Input
              value={row.name}
              onChange={(e) =>
                onChangeValues({
                  rows: values.rows.map((r) =>
                    r.id === row.id ? { ...r, name: e.target.value } : r,
                  ),
                })
              }
              className="h-8 text-xs"
              placeholder="Skill name"
            />
            <NumberField
              value={row.modifier}
              onChange={(v) =>
                onChangeValues({
                  rows: values.rows.map((r) => (r.id === row.id ? { ...r, modifier: v } : r)),
                })
              }
              inputClassName="h-8 w-14"
            />
            <button
              type="button"
              title="Roll 1d20 + modifier"
              onClick={() => {
                const sign = row.modifier >= 0 ? '+' : ''
                const result = rollFormula(`1d20${sign}${row.modifier}`)
                setLastRoll((s) => ({ ...s, [row.id]: result.total }))
              }}
              className="flex items-center gap-1 bg-black/10 hover:bg-black/20 px-1.5 border border-(--fd-border) rounded-md h-8 shrink-0 transition-colors"
            >
              <Dices className="size-3.5 text-(--fd-text-muted)" />
              {lastRoll[row.id] !== undefined && (
                <span className="min-w-4 font-semibold text-(--fd-accent) text-xs text-center">
                  {lastRoll[row.id]}
                </span>
              )}
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-(--fd-text-muted) shrink-0"
              onClick={() =>
                onChangeValues({ rows: values.rows.filter((r) => r.id !== row.id) })
              }
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        <AddTile
          label="Add Skill"
          onClick={() =>
            onChangeValues({
              rows: [...values.rows, { id: uuid(), name: 'New Skill', modifier: 0 }],
            })
          }
        />
      </div>
    </ModuleCard>
  )
}

export default SkillsModule
