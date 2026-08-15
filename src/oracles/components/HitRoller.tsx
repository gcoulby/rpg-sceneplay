import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import DieChip from './DieChip'
import { rollHit, type HitRollResult } from '../hitRoll'

interface HitRollerProps {
  compact?: boolean
}

const HIT_TYPE_CLASSES: Record<HitRollResult['hitType'], string> = {
  'Strong Hit': 'text-emerald-600 dark:text-emerald-400',
  'Weak Hit': 'text-amber-600 dark:text-amber-400',
  Miss: 'text-destructive',
}

export default function HitRoller({ compact }: HitRollerProps) {
  const [modifier, setModifier] = useState('0')
  const [result, setResult] = useState<HitRollResult | null>(null)

  const roll = () => setResult(rollHit(0, Number(modifier)))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row items-end gap-2 w-full">
        <div className="flex flex-col gap-1 grow">
          <label className="text-muted-foreground text-xs">Modifier</label>
          <Input
            type="number"
            className={' w-full text-sm'}
            value={modifier}
            onChange={(e) => setModifier(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 grow">
          <Button size="lg" variant="secondary" onClick={roll}>
            Roll
          </Button>
        </div>
      </div>

      {result && (
        <div className="flex flex-row justify-center items-center gap-3">
          <div className="flex flex-row items-center gap-1.5">
            <DieChip
              value={result.actionDie}
              variant="action"
              size={compact ? 'sm' : 'default'}
            />
            <span className="px-1 text-muted-foreground">+</span>
            <span className="px-1 text-muted-foreground">
              {result.modifier}
            </span>
            <span className="px-4 text-muted-foreground">vs</span>
            <DieChip
              value={result.challenge1}
              sides={10}
              variant={
                result.challenge1 < result.actionDie + result.modifier
                  ? 'muted'
                  : 'default'
              }
              size={compact ? 'sm' : 'default'}
            />
            <DieChip
              value={result.challenge2}
              sides={10}
              variant={
                result.challenge2 < result.actionDie + result.modifier
                  ? 'muted'
                  : 'default'
              }
              size={compact ? 'sm' : 'default'}
            />
          </div>
          <div className="flex flex-col">
            <span
              className={cn(
                'font-bold',
                compact ? 'text-sm' : 'text-lg',
                HIT_TYPE_CLASSES[result.hitType],
              )}
            >
              {result.hitType}
            </span>

            <span className="flex flex-row gap-1 text-muted-foreground text-xs">
              <span className="">Score</span>{' '}
              <span className="text-foreground">{result.score}</span>{' '}
              <span>(</span>
              <span className="text-foreground">{result.actionDie}</span>
              <span>+</span>
              <span
                className={
                  result.modifier < 0 ? `text-red-600` : `text-foreground`
                }
              >
                {result.modifier}
              </span>
              <span>)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
