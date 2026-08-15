import React from 'react'
import { UserRound, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import ModuleCard from './shared/ModuleCard'
import AddTile from './shared/AddTile'
import type { ModuleComponentProps } from './moduleProps'

/** Freeform label/value rows — pronouns, species, occupation, age, whatever
 *  the user names them. Text-valued, unlike Custom Stats which is numeric. */
export interface DetailRow {
  id: string
  label: string
  value: string
}

export interface CharacterDetailsConfig {}

export interface CharacterDetailsValues {
  rows: DetailRow[]
}

export const defaultCharacterDetailsConfig: CharacterDetailsConfig = {}
export const defaultCharacterDetailsValues: CharacterDetailsValues = {
  rows: [
    { id: uuid(), label: 'Pronouns', value: '' },
    { id: uuid(), label: 'Occupation', value: '' },
  ],
}

const CharacterDetailsModule: React.FC<
  ModuleComponentProps<CharacterDetailsConfig, CharacterDetailsValues>
> = ({ module, layout, onChangeLabel, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => {
  const { values } = module

  return (
    <ModuleCard
      label={module.label}
      icon={UserRound}
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
              value={row.label}
              onChange={(e) =>
                onChangeValues({
                  rows: values.rows.map((r) =>
                    r.id === row.id ? { ...r, label: e.target.value } : r,
                  ),
                })
              }
              placeholder="Field"
              className="w-24 h-7 text-[11px] text-(--fd-text-muted) shrink-0"
            />
            <Input
              value={row.value}
              onChange={(e) =>
                onChangeValues({
                  rows: values.rows.map((r) =>
                    r.id === row.id ? { ...r, value: e.target.value } : r,
                  ),
                })
              }
              placeholder="Value"
              className="flex-1 h-7 text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-(--fd-text-muted) shrink-0"
              onClick={() =>
                onChangeValues({ rows: values.rows.filter((r) => r.id !== row.id) })
              }
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        <AddTile
          label="Add Field"
          onClick={() =>
            onChangeValues({
              rows: [...values.rows, { id: uuid(), label: 'New Field', value: '' }],
            })
          }
        />
      </div>
    </ModuleCard>
  )
}

export default CharacterDetailsModule
