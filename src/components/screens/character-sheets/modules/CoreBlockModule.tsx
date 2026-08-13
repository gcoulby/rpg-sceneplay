import React from 'react'
import { IdCard, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import TrackerBar from './shared/TrackerBar'
import NumberField from './shared/NumberField'
import ModuleCard from './shared/ModuleCard'
import type { ModuleComponentProps } from './moduleProps'

export interface CoreBlockConfig {
  statLabels: { id: string; label: string }[]
}

export interface CoreBlockValues {
  characterName: string
  portraitAssetId: string | null
  hpCurrent: number
  hpMax: number
  stats: Record<string, number>
}

export const defaultCoreBlockConfig: CoreBlockConfig = {
  statLabels: [
    { id: uuid(), label: 'STR' },
    { id: uuid(), label: 'DEX' },
    { id: uuid(), label: 'CON' },
  ],
}

export const defaultCoreBlockValues: CoreBlockValues = {
  characterName: '',
  portraitAssetId: null,
  hpCurrent: 10,
  hpMax: 10,
  stats: {},
}

const CoreBlockModule: React.FC<
  ModuleComponentProps<CoreBlockConfig, CoreBlockValues>
> = ({ module, onChangeLabel, onChangeConfig, onChangeValues, onDelete, onMoveUp, onMoveDown }) => {
  const { config, values } = module

  return (
    <ModuleCard
      label={module.label}
      icon={IdCard}
      onChangeLabel={onChangeLabel}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col gap-3">
        <Input
          value={values.characterName}
          placeholder="Character name"
          onChange={(e) => onChangeValues({ ...values, characterName: e.target.value })}
          className="bg-transparent px-1.5 border-transparent hover:border-(--fd-border) focus-visible:border-ring font-semibold text-sm"
        />

        <div>
          <span className="font-medium text-[10px] text-(--fd-text-muted) uppercase tracking-wide">
            HP
          </span>
          <TrackerBar
            current={values.hpCurrent}
            max={values.hpMax}
            onChange={({ current, max }) =>
              onChangeValues({ ...values, hpCurrent: current, hpMax: max })
            }
          />
        </div>

        {config.statLabels.length > 0 && (
          <div className="gap-2 grid grid-cols-3">
            {config.statLabels.map((stat) => (
              <div
                key={stat.id}
                className="group relative flex flex-col items-center gap-1 bg-black/10 py-2 border border-(--fd-border) rounded-lg"
              >
                <button
                  type="button"
                  className="top-1 right-1 absolute flex items-center justify-center opacity-0 group-hover:opacity-100 rounded text-(--fd-text-muted) hover:text-destructive transition-opacity size-4"
                  onClick={() =>
                    onChangeConfig({
                      statLabels: config.statLabels.filter((s) => s.id !== stat.id),
                    })
                  }
                  title="Remove stat"
                >
                  <X className="size-3" />
                </button>
                <input
                  value={stat.label}
                  onChange={(e) =>
                    onChangeConfig({
                      statLabels: config.statLabels.map((s) =>
                        s.id === stat.id ? { ...s, label: e.target.value } : s,
                      ),
                    })
                  }
                  className="bg-transparent w-full font-medium text-[10px] text-(--fd-text-muted) text-center uppercase tracking-wide outline-none"
                />
                <NumberField
                  value={values.stats[stat.id] ?? 0}
                  onChange={(v) =>
                    onChangeValues({ ...values, stats: { ...values.stats, [stat.id]: v } })
                  }
                  inputClassName="h-8 bg-transparent border-transparent font-bold text-lg"
                />
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="self-start h-7 text-xs"
          onClick={() =>
            onChangeConfig({
              statLabels: [...config.statLabels, { id: uuid(), label: 'NEW' }],
            })
          }
        >
          <Plus className="mr-1 size-3.5" />
          Stat
        </Button>
      </div>
    </ModuleCard>
  )
}

export default CoreBlockModule
