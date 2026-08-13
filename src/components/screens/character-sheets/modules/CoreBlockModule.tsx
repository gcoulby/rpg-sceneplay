import React from 'react'
import { Input } from '@/components/ui/input'
import { uuid } from '@/utils/open-draft/uuid'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TrackerBar from './shared/TrackerBar'
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
> = ({ module, onChangeLabel, onChangeConfig, onChangeValues, onDelete }) => {
  const { config, values } = module

  return (
    <ModuleCard label={module.label} onChangeLabel={onChangeLabel} onDelete={onDelete}>
      <div className="flex flex-col gap-2">
        <Input
          value={values.characterName}
          placeholder="Character name"
          onChange={(e) => onChangeValues({ ...values, characterName: e.target.value })}
          className="h-7 text-xs"
        />

        <div>
          <span className="text-[10px] text-(--fd-text-muted) uppercase">HP</span>
          <TrackerBar
            current={values.hpCurrent}
            max={values.hpMax}
            onChange={({ current, max }) =>
              onChangeValues({ ...values, hpCurrent: current, hpMax: max })
            }
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {config.statLabels.map((stat) => (
            <div key={stat.id} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1">
                <Input
                  value={stat.label}
                  onChange={(e) =>
                    onChangeConfig({
                      statLabels: config.statLabels.map((s) =>
                        s.id === stat.id ? { ...s, label: e.target.value } : s,
                      ),
                    })
                  }
                  className="h-5 px-1 w-14 text-[10px] text-center uppercase"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-4 text-(--fd-text-muted)"
                  onClick={() =>
                    onChangeConfig({
                      statLabels: config.statLabels.filter((s) => s.id !== stat.id),
                    })
                  }
                >
                  <X className="size-2.5" />
                </Button>
              </div>
              <Input
                type="number"
                value={values.stats[stat.id] ?? 0}
                onChange={(e) =>
                  onChangeValues({
                    ...values,
                    stats: { ...values.stats, [stat.id]: Number(e.target.value) || 0 },
                  })
                }
                className="h-8 w-14 text-sm text-center"
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="self-end h-8 text-xs"
            onClick={() =>
              onChangeConfig({
                statLabels: [...config.statLabels, { id: uuid(), label: 'NEW' }],
              })
            }
          >
            + Stat
          </Button>
        </div>
      </div>
    </ModuleCard>
  )
}

export default CoreBlockModule
