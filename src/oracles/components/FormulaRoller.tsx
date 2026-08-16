import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DieChip from './DieChip'
import {
  rollFormula,
  type RollResult,
} from '@/components/screens/character-sheets/formula/rollFormula'
import DiceResult from './DiceResult'
import type { RollValue } from '../rollTypes'

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100]

interface FormulaRollerProps {
  compact?: boolean
  onResult?: (value: RollValue) => void
}

export default function FormulaRoller({ compact, onResult }: FormulaRollerProps) {
  const [formula, setFormula] = useState('2d6+2d4,1d8')
  const [result, setResult] = useState<RollResult | null>(null)

  const roll = (f: string) => {
    if (!f.trim()) return
    const rolled = rollFormula(f)
    setResult(rolled)
    onResult?.({
      kind: 'dice',
      expression: rolled.formula,
      rolls: rolled.terms.flatMap((t) => t.rolls),
      total: rolled.total,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row flex-wrap justify-center items-center gap-1.5">
        {QUICK_DICE.map((sides) => (
          <DieChip
            key={sides}
            sides={sides}
            value={`D${sides}`}
            size="sm"
            onClick={() => roll(`1d${sides}`)}
          />
        ))}
      </div>

      <div className="flex flex-row justify-center items-center gap-2">
        <div className="flex flex-row items-end gap-2 w-full">
          <div className="flex flex-col gap-1 grow">
            <Input
              type="text"
              className={' w-full text-sm h-9'}
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1 mt-0.5 grow">
            <Button size="lg" variant="secondary" onClick={() => roll(formula)}>
              Roll
            </Button>
          </div>
        </div>
      </div>

      {result && <DiceResult compact={compact} result={result} />}
    </div>
  )
}
