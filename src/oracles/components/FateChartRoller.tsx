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
import {
  FATE_CHART,
  getFateCell,
  rollFate,
  type FateRollResult,
} from '../fateChart'
import { Badge } from '@/components/ui/badge'

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
    <div className="group relative flex justify-center items-center w-full">
      <Badge
        tabIndex={0}
        className={cn(
          'flex items-center gap-1.5 mt-2 px-3 py-3 border rounded-full outline-none w-1/2 font-semibold text-sm cursor-default',
          isYes
            ? 'border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400'
            : 'border-destructive/40 bg-destructive/10 text-destructive',
        )}
      >
        {isExceptional && (
          <span className="text-xs uppercase tracking-wide">Exceptional</span>
        )}
        {result.result.replace('Exceptional ', '')}
        <span className="font-normal text-muted-foreground text-xs">
          ({result.roll})
        </span>
      </Badge>

      <div className="bottom-full left-1/2 z-50 absolute bg-popover opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 shadow-md mb-2 px-3 py-2 border rounded-lg w-max text-popover-foreground transition-opacity -translate-x-1/2 duration-150 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <span className="font-mono font-bold text-lg">{result.roll}</span>
          </div>
          <span className="text-muted-foreground text-xs">vs</span>
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-muted-foreground">
              {result.cell.lowerBound}
            </span>
            <span className="font-bold text-lg">{result.cell.chance}</span>
            <span className="text-muted-foreground text-sm">
              {result.cell.upperBound}
            </span>
          </div>
        </div>
        <div className="top-full left-1/2 absolute bg-popover -mt-1 border-r border-b w-2 h-2 rotate-45 -translate-x-1/2" />
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
  const [showChart, setShowChart] = useState(false)

  const roll = () => setResult(rollFate(oddsRank, chaosRank))
  const activeCell = getFateCell(oddsRank, chaosRank)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row flex-wrap items-end gap-2 w-full">
        <div className="flex flex-col gap-1 grow">
          <label className="text-muted-foreground text-xs">Odds</label>
          <Select
            value={String(oddsRank)}
            onValueChange={(v) => v && setOddsRank(Number(v))}
          >
            <SelectTrigger className="w-full">
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
        <div className="flex flex-col gap-1 grow">
          <label className="text-muted-foreground text-xs">Chaos Rank</label>
          <Select
            value={String(chaosRank)}
            onValueChange={(v) => v && setChaosRank(Number(v))}
          >
            <SelectTrigger className="w-full">
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
      </div>
      <div>
        <Button className="w-full" variant="secondary" size="lg" onClick={roll}>
          Fate Roll
        </Button>
        {result && <FateResultChip result={result} />}
      </div>
      {activeCell && !result && (
        <span className="flex justify-center items-center gap-2 text-xs">
          <span className="text-muted-foreground text-xs">
            {activeCell.lowerBound}
          </span>
          <span className="font-bold text-xl">{activeCell.chance}</span>
          <span className="text-muted-foreground text-xs">
            {activeCell.upperBound}
          </span>
        </span>
      )}
      {!compact && (
        <Button
          variant="secondary"
          size="lg"
          onClick={() => setShowChart(!showChart)}
        >
          {showChart ? 'Hide' : 'Show'} Fate Chart
        </Button>
      )}
      {!compact && showChart && (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr>
                <th className="bg-muted/50 px-2 py-1.5 border-b font-semibold text-left">
                  Odds
                </th>
                {CHAOS_RANKS.map((r) => (
                  <th
                    key={r}
                    onClick={() => setChaosRank(r)}
                    className={cn(
                      'hover:bg-muted px-2 py-1.5 border-b font-semibold cursor-pointer',
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
                      'hover:bg-muted px-2 py-1.5 border-b font-medium text-left whitespace-nowrap cursor-pointer',
                      row.rank === oddsRank && 'bg-primary/10 text-primary',
                    )}
                  >
                    {row.name}
                  </td>
                  {[...row.chaosOdds].map((cell) => {
                    const isActive =
                      row.rank === oddsRank && cell.rank === chaosRank
                    const inRowOrCol =
                      row.rank === oddsRank || cell.rank === chaosRank
                    return (
                      <td
                        key={cell.rank}
                        onClick={() => {
                          setOddsRank(row.rank)
                          setChaosRank(cell.rank)
                        }}
                        className={cn(
                          'hover:bg-muted px-1 py-1 border-b leading-tight cursor-pointer',
                          inRowOrCol && 'bg-muted/60',
                          isActive &&
                            'bg-primary/20 ring-1 ring-inset ring-primary',
                        )}
                      >
                        <div className="flex flex-row justify-center items-center gap-2">
                          <span className="text-[9px] text-muted-foreground">
                            {cell.lowerBound}
                          </span>
                          <span className="font-bold text-sm">
                            {cell.chance}
                          </span>
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
