import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { FATE_CHART, getFateCell, rollFate, type FateRollResult } from '../fateChart'

const CHAOS_RANKS = Array.from({ length: 9 }, (_, i) => 9 - i) // 9..1

interface FateResultChipProps {
  result: FateRollResult
}

/** Compact "Yes/No" chip that reveals the full dice-vs-bounds breakdown on
 *  hover/focus, mirroring mythic-gme-companion's .tip/.top tooltip. */
function FateResultChip({ result }: FateResultChipProps) {
  const isExceptional = result.result.startsWith('Exceptional')
  const isYes = result.result.endsWith('Yes')

  return (
    <div className="group relative inline-flex">
      <div
        tabIndex={0}
        className={cn(
          'flex cursor-default items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold outline-none',
          isYes
            ? 'border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
            : 'border-destructive/40 bg-destructive/10 text-destructive',
        )}
      >
        {isExceptional && <span className="text-xs uppercase tracking-wide">Exceptional</span>}
        {result.result.replace('Exceptional ', '')}
        <span className="text-xs font-normal text-muted-foreground">({result.roll})</span>
      </div>

      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="font-mono text-lg font-bold">{result.roll}</span>
            <span className="text-[10px] text-muted-foreground">d100</span>
          </div>
          <span className="text-muted-foreground">vs</span>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-muted-foreground">{result.cell.lowerBound}</span>
            <span className="text-base font-bold">{result.cell.chance}</span>
            <span className="text-muted-foreground">{result.cell.upperBound}</span>
          </div>
        </div>
        <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b bg-popover" />
      </div>
    </div>
  )
}

interface FateChartRollerProps {
  compact?: boolean
}

export default function FateChartRoller({ compact }: FateChartRollerProps) {
  const [oddsRank, setOddsRank] = useState(4) // 50/50
  const [chaosRank, setChaosRank] = useState(5)
  const [result, setResult] = useState<FateRollResult | null>(null)

  const roll = () => setResult(rollFate(oddsRank, chaosRank))
  const activeCell = getFateCell(oddsRank, chaosRank)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Odds</label>
          <Select value={String(oddsRank)} onValueChange={(v) => v && setOddsRank(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue>
                {FATE_CHART.find((r) => r.rank === oddsRank)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {FATE_CHART.map((row) => (
                <SelectItem key={row.rank} value={String(row.rank)}>
                  {row.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Chaos Rank</label>
          <Select value={String(chaosRank)} onValueChange={(v) => v && setChaosRank(Number(v))}>
            <SelectTrigger className="w-20">
              <SelectValue>{chaosRank}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {CHAOS_RANKS.slice()
                .reverse()
                .map((r) => (
                  <SelectItem key={r} value={String(r)}>
                    {r}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <Button size={compact ? 'sm' : 'default'} onClick={roll}>
          Roll
        </Button>
        {result && <FateResultChip result={result} />}
      </div>
      {activeCell && !result && (
        <span className="text-xs text-muted-foreground">
          {activeCell.lowerBound} / {activeCell.chance} / {activeCell.upperBound}
        </span>
      )}

      {!compact && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="border-b bg-muted/50 px-2 py-1.5 text-left font-semibold">
                  Odds
                </th>
                {CHAOS_RANKS.map((r) => (
                  <th
                    key={r}
                    onClick={() => setChaosRank(r)}
                    className={cn(
                      'cursor-pointer border-b px-2 py-1.5 font-semibold hover:bg-muted',
                      r === chaosRank && 'bg-primary/10 text-primary',
                    )}
                  >
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FATE_CHART.map((row) => (
                <tr key={row.rank}>
                  <td
                    onClick={() => setOddsRank(row.rank)}
                    className={cn(
                      'cursor-pointer border-b px-2 py-1.5 text-left font-medium whitespace-nowrap hover:bg-muted',
                      row.rank === oddsRank && 'bg-primary/10 text-primary',
                    )}
                  >
                    {row.name}
                  </td>
                  {[...row.chaosOdds].reverse().map((cell) => {
                    const isActive = row.rank === oddsRank && cell.rank === chaosRank
                    const inRowOrCol = row.rank === oddsRank || cell.rank === chaosRank
                    return (
                      <td
                        key={cell.rank}
                        onClick={() => {
                          setOddsRank(row.rank)
                          setChaosRank(cell.rank)
                        }}
                        className={cn(
                          'cursor-pointer border-b px-1 py-1 leading-tight hover:bg-muted',
                          inRowOrCol && 'bg-muted/60',
                          isActive && 'bg-primary/20 ring-1 ring-inset ring-primary',
                        )}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] text-muted-foreground">
                            {cell.lowerBound}
                          </span>
                          <span className="text-sm font-bold">{cell.chance}</span>
                          <span className="text-[9px] text-muted-foreground">
                            {cell.upperBound}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
