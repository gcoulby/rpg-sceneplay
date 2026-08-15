import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { rollHit, type HitRollResult } from '../hitRoll'

interface HitRollerProps {
  compact?: boolean
}

export default function HitRoller({ compact }: HitRollerProps) {
  const [stat, setStat] = useState(0)
  const [add, setAdd] = useState(0)
  const [result, setResult] = useState<HitRollResult | null>(null)

  const roll = () => setResult(rollHit(stat, add))

  const badgeVariant =
    result?.hitType === 'Strong Hit'
      ? 'default'
      : result?.hitType === 'Weak Hit'
        ? 'secondary'
        : 'outline'

  return (
    <div className="flex flex-col gap-2">
      {!compact && <span className="text-sm font-medium">Hit Roll</span>}
      <div className="flex flex-row flex-wrap items-end gap-2">
        {!compact && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Stat</label>
              <Input
                type="number"
                className="w-16"
                value={stat}
                onChange={(e) => setStat(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Add</label>
              <Input
                type="number"
                className="w-16"
                value={add}
                onChange={(e) => setAdd(Number(e.target.value) || 0)}
              />
            </div>
          </>
        )}
        <Button size={compact ? 'sm' : 'default'} onClick={roll}>
          Roll
        </Button>
        {result && <Badge variant={badgeVariant}>{result.hitType}</Badge>}
        {result?.isMatch && <Badge variant="outline">Match</Badge>}
      </div>
      {!compact && result && (
        <span className="text-xs text-muted-foreground">
          Action {result.actionDie} + Stat {result.stat} + Add {result.add} = {result.score}
          {' vs '}
          {result.challenge1} / {result.challenge2}
        </span>
      )}
    </div>
  )
}
