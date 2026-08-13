import React, { useState } from 'react'
import { X, Dices, HelpCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { uuid } from '@/utils/open-draft/uuid'
import { resolveReferences } from '../formula/resolveReferences'
import { rollFormula, type RollResult } from '../formula/rollFormula'
import ModuleCard from './shared/ModuleCard'
import type { ModuleComponentProps } from './moduleProps'

export interface CustomButtonDef {
  id: string
  label: string
  formula: string
}

export interface CustomButtonsConfig {
  buttons: CustomButtonDef[]
}

/** Roll results are transient UI state, not persisted sheet data. */
export type CustomButtonsValues = Record<string, never>

export const defaultCustomButtonsConfig: CustomButtonsConfig = { buttons: [] }
export const defaultCustomButtonsValues: CustomButtonsValues = {}

const CustomButtonsModule: React.FC<
  ModuleComponentProps<CustomButtonsConfig, CustomButtonsValues>
> = ({ module, valueMap, onChangeLabel, onChangeConfig, onDelete, onMoveUp, onMoveDown }) => {
  const { config } = module
  const [results, setResults] = useState<Record<string, RollResult>>({})

  return (
    <ModuleCard
      label={module.label}
      icon={Dices}
      onChangeLabel={onChangeLabel}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1 text-[10px] text-(--fd-text-muted)">
          <Tooltip>
            <TooltipTrigger className="inline-flex">
              <HelpCircle className="size-3 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="block max-w-64 text-xs whitespace-normal">
              <span className="block text-left">
                Formulas support dice like <code>1d20</code>, flat numbers,
                and <code>+</code>/<code>-</code> between terms. Wrap a stat,
                tracker or skill's label in curly braces to pull in its
                current value — e.g. <code>1d20+{'{Strength}'}</code> or{' '}
                <code>1d4+{'{HP.max}'}</code> for a tracker's max.
              </span>
            </TooltipContent>
          </Tooltip>
          <span>Formula syntax help</span>
        </div>
        {config.buttons.map((btn) => (
          <div key={btn.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Input
                value={btn.label}
                onChange={(e) =>
                  onChangeConfig({
                    buttons: config.buttons.map((b) =>
                      b.id === btn.id ? { ...b, label: e.target.value } : b,
                    ),
                  })
                }
                className="h-7 text-xs"
                placeholder="Button label"
              />
              <Input
                value={btn.formula}
                onChange={(e) =>
                  onChangeConfig({
                    buttons: config.buttons.map((b) =>
                      b.id === btn.id ? { ...b, formula: e.target.value } : b,
                    ),
                  })
                }
                className="h-7 text-xs"
                placeholder="e.g. 1d20+{Strength}"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={() => {
                  const resolved = resolveReferences(btn.formula, valueMap)
                  setResults((s) => ({ ...s, [btn.id]: rollFormula(resolved) }))
                }}
              >
                <Dices className="mr-1 size-3.5" />
                Roll
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-(--fd-text-muted)"
                onClick={() =>
                  onChangeConfig({
                    buttons: config.buttons.filter((b) => b.id !== btn.id),
                  })
                }
              >
                <X className="size-3.5" />
              </Button>
            </div>
            {results[btn.id] && (
              <span className="pl-1 text-(--fd-accent) text-xs">
                Result: {results[btn.id].total}
              </span>
            )}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="self-start h-7 text-xs"
          onClick={() =>
            onChangeConfig({
              buttons: [...config.buttons, { id: uuid(), label: 'Roll', formula: '1d20' }],
            })
          }
        >
          + Button
        </Button>
      </div>
    </ModuleCard>
  )
}

export default CustomButtonsModule
