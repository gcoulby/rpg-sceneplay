import React, { useState } from 'react'
import { X, Dices } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import { rollFormula } from '../formula/rollFormula'
import ModuleCard from './shared/ModuleCard'
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
> = ({ module, onChangeLabel, onChangeValues, onDelete }) => {
  const { values } = module
  const [lastRoll, setLastRoll] = useState<Record<string, number>>({})

  return (
    <ModuleCard label={module.label} onChangeLabel={onChangeLabel} onDelete={onDelete}>
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
              className="h-7 text-xs"
              placeholder="Skill name"
            />
            <Input
              type="number"
              value={row.modifier}
              onChange={(e) =>
                onChangeValues({
                  rows: values.rows.map((r) =>
                    r.id === row.id
                      ? { ...r, modifier: Number(e.target.value) || 0 }
                      : r,
                  ),
                })
              }
              className="h-7 w-16 text-xs text-right"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-(--fd-text-muted)"
              title="Roll"
              onClick={() => {
                const sign = row.modifier >= 0 ? '+' : ''
                const result = rollFormula(`1d20${sign}${row.modifier}`)
                setLastRoll((s) => ({ ...s, [row.id]: result.total }))
              }}
            >
              <Dices className="size-3.5" />
            </Button>
            {lastRoll[row.id] !== undefined && (
              <span className="w-6 text-(--fd-accent) text-xs text-center shrink-0">
                {lastRoll[row.id]}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-(--fd-text-muted)"
              onClick={() =>
                onChangeValues({ rows: values.rows.filter((r) => r.id !== row.id) })
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
              rows: [...values.rows, { id: uuid(), name: 'New Skill', modifier: 0 }],
            })
          }
        >
          + Skill
        </Button>
      </div>
    </ModuleCard>
  )
}

export default SkillsModule
