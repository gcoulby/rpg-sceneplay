import { useState } from 'react'
import DieChip from './DieChip'
import {
  rollFormula,
  type RollResult,
} from '@/components/screens/character-sheets/formula/rollFormula'
import DiceResult from './DiceResult'

const QUICK_DICE = [4, 6, 8, 10, 12, 20, 100]

interface FormulaRollerProps {
  compact?: boolean
}

export default function QuickRoller({ compact }: FormulaRollerProps) {
  const [result, setResult] = useState<RollResult | null>(null)

  const roll = (f: string) => {
    if (!f.trim()) return
    setResult(rollFormula(f))
  }

  return (
    <div className="flex flex-col gap-3">
      {!compact && <span className="font-medium text-sm">Roller</span>}

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

      {result && <DiceResult compact={compact} result={result} />}
    </div>
  )
}
