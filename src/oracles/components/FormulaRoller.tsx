import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DieChip from './DieChip'
import { rollFormula, type RollResult } from '@/components/screens/character-sheets/formula/rollFormula'

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100]

interface FormulaRollerProps {
  compact?: boolean
}

export default function FormulaRoller({ compact }: FormulaRollerProps) {
  const [formula, setFormula] = useState('2d6')
  const [result, setResult] = useState<RollResult | null>(null)

  const roll = (f: string) => {
    if (!f.trim()) return
    setResult(rollFormula(f))
  }

  return (
    <div className="flex flex-col gap-3">
      {!compact && <span className="text-sm font-medium">Roller</span>}

      <div className="flex flex-row flex-wrap gap-1.5">
        {QUICK_DICE.map((sides) => (
          <DieChip
            key={sides}
            value={`d${sides}`}
            size={compact ? 'sm' : 'default'}
            onClick={() => roll(`1d${sides}`)}
          />
        ))}
      </div>

      <div className="flex flex-row items-center gap-2">
        <Input
          className={compact ? 'h-7 w-24 text-sm' : 'w-28'}
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="2d6+1"
        />
        <Button size={compact ? 'sm' : 'default'} onClick={() => roll(formula)}>
          Roll
        </Button>
      </div>

      {result && (
        <div className="flex flex-row flex-wrap items-center gap-2">
          {result.terms.flatMap((term, ti) =>
            term.rolls.length > 0
              ? term.rolls.map((r, ri) => (
                  <DieChip key={`${ti}-${ri}`} value={r} size={compact ? 'sm' : 'default'} />
                ))
              : [
                  <DieChip
                    key={ti}
                    value={term.total >= 0 ? `+${term.total}` : term.total}
                    variant="accent"
                    size={compact ? 'sm' : 'default'}
                  />,
                ],
          )}
          <span className="text-lg font-bold">= {result.total}</span>
        </div>
      )}
    </div>
  )
}
