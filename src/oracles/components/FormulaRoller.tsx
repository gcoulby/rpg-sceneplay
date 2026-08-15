import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { rollFormula, type RollResult } from '@/components/screens/character-sheets/formula/rollFormula'

interface FormulaRollerProps {
  compact?: boolean
}

export default function FormulaRoller({ compact }: FormulaRollerProps) {
  const [formula, setFormula] = useState('2d6')
  const [result, setResult] = useState<RollResult | null>(null)

  const roll = () => {
    if (!formula.trim()) return
    setResult(rollFormula(formula))
  }

  return (
    <div className="flex flex-col gap-2">
      {!compact && <span className="text-sm font-medium">Formula Roll</span>}
      <div className="flex flex-row items-center gap-2">
        <Input
          className="w-28"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="2d6+1"
        />
        <Button size={compact ? 'sm' : 'default'} onClick={roll}>
          Roll
        </Button>
        {result && <span className="text-sm font-semibold">{result.total}</span>}
      </div>
      {!compact && result && (
        <span className="text-xs text-muted-foreground">
          {result.terms.map((t) => `${t.text} [${t.rolls.join(', ') || t.total}]`).join(' ')}
        </span>
      )}
    </div>
  )
}
