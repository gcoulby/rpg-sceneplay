import DieChip from './DieChip'
import { type RollResult } from '@/components/screens/character-sheets/formula/rollFormula'

interface FormulaRollerProps {
  compact?: boolean
  result: RollResult
}

export default function DiceResult({ compact, result }: FormulaRollerProps) {
  return (
    <div className="flex flex-row flex-wrap items-center gap-2">
      {result.terms.flatMap((term, ti) =>
        term.rolls.length > 0
          ? term.rolls.map((r, ri) => (
              <DieChip
                key={`${ti}-${ri}`}
                sides={Number(term.text.split('d')[1])}
                value={r}
                size={compact ? 'sm' : 'default'}
              />
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
      <span className="font-bold text-lg">= {result.total}</span>
    </div>
  )
}
