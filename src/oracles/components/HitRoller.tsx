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
  const [stat, setStat] = useState(0)
  const [add, setAdd] = useState(0)
  const [result, setResult] = useState<HitRollResult | null>(null)

  const roll = () => setResult(rollHit(stat, add))

  return (
    <div className="flex flex-col gap-3">
      {!compact && <span className="text-sm font-medium">Hit Roll</span>}

      <div className="flex flex-row flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Stat</label>
          <Input
            type="number"
            className={compact ? 'h-7 w-14 text-sm' : 'w-16'}
            value={stat}
            onChange={(e) => setStat(Number(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Add</label>
          <Input
            type="number"
            className={compact ? 'h-7 w-14 text-sm' : 'w-16'}
            value={add}
            onChange={(e) => setAdd(Number(e.target.value) || 0)}
          />
        </div>
        <Button size={compact ? 'sm' : 'default'} onClick={roll}>
          Roll
        </Button>
      </div>

      {result && (
        <div className="flex flex-row items-center gap-3">
          <div className="flex flex-row items-center gap-1.5">
            <DieChip
              value={result.actionDie}
              label="action"
              variant="accent"
              size={compact ? 'sm' : 'default'}
            />
            <span className="text-muted-foreground">+</span>
            <DieChip
              value={result.challenge1}
              label="chal"
              size={compact ? 'sm' : 'default'}
            />
            <DieChip
              value={result.challenge2}
              label="chal"
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
            {result.isMatch && (
              <span className="text-xs font-medium text-primary">Match!</span>
            )}
            {!compact && (
              <span className="text-xs text-muted-foreground">
                Score {result.score} ({result.actionDie}+{result.stat}+{result.add})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
