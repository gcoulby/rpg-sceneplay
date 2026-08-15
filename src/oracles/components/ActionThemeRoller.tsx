import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useOracleStore } from '@/stores/oracleStore'
import { rollCombo, type TableRollResult, describeTableRoll } from '../rollTable'

interface ActionThemeRollerProps {
  compact?: boolean
}

export default function ActionThemeRoller({ compact }: ActionThemeRollerProps) {
  const getAllCombos = useOracleStore((s) => s.getAllCombos)
  const getTableById = useOracleStore((s) => s.getTableById)
  const [result, setResult] = useState<{ text: string; rolls: TableRollResult[] } | null>(
    null,
  )

  const combo = getAllCombos().find((c) => c.name === 'Action/Theme')

  const roll = () => {
    if (!combo) return
    setResult(rollCombo(combo, getTableById))
  }

  if (!combo) return null

  return (
    <div className="flex flex-col gap-2">
      {!compact && <span className="text-sm font-medium">Action / Theme</span>}
      <Button size={compact ? 'sm' : 'default'} onClick={roll}>
        Roll Action/Theme
      </Button>
      {result && (
        <div className="text-sm">
          <div className="font-semibold">{result.text}</div>
          {!compact && (
            <div className="text-xs text-muted-foreground">
              {result.rolls
                .map((r) => `${r.table.name}: ${describeTableRoll(r)}`)
                .join(' · ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
