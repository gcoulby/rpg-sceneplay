import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useOracleStore } from '@/stores/oracleStore'
import { rollCombo, type TableRollResult, describeTableRoll } from '../rollTable'

interface ComboRollerProps {
  compact?: boolean
}

/** Every bundled combo (Action/Theme, Descriptor/Focus, Aspect/Focus, Sector
 *  Name, ...) as quick inspiration rolls — not just Ironsworn's. */
export default function ComboRoller({ compact }: ComboRollerProps) {
  const getAllCombos = useOracleStore((s) => s.getAllCombos)
  const getAllSources = useOracleStore((s) => s.getAllSources)
  const getTableById = useOracleStore((s) => s.getTableById)
  const [results, setResults] = useState<
    Record<string, { text: string; rolls: TableRollResult[] }>
  >({})

  const combos = getAllCombos()
  const sourcesById = new Map(getAllSources().map((s) => [s.id, s]))

  const roll = (comboId: string) => {
    const combo = combos.find((c) => c.id === comboId)
    if (!combo) return
    setResults((prev) => ({ ...prev, [combo.id]: rollCombo(combo, getTableById) }))
  }

  if (combos.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      {!compact && <span className="text-sm font-medium">Combos</span>}
      {combos.map((combo) => {
        const result = results[combo.id]
        return (
          <div key={combo.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">
                {combo.name}
                {!compact && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {sourcesById.get(combo.sourceId)?.name}
                  </span>
                )}
              </span>
              <Button size={compact ? 'sm' : 'default'} onClick={() => roll(combo.id)}>
                Roll
              </Button>
            </div>
            {result && (
              <div className="text-sm">
                <span className="font-semibold">{result.text}</span>
                {!compact && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({result.rolls
                      .map((r) => `${r.table.name}: ${describeTableRoll(r)}`)
                      .join(' · ')})
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
