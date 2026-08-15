import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { FATE_CHART, rollFate, type FateRollResult } from '../fateChart'

interface FateChartRollerProps {
  compact?: boolean
}

export default function FateChartRoller({ compact }: FateChartRollerProps) {
  const [oddsRank, setOddsRank] = useState(4) // 50/50
  const [chaosRank, setChaosRank] = useState(5)
  const [result, setResult] = useState<FateRollResult | null>(null)

  const roll = () => setResult(rollFate(oddsRank, chaosRank))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Odds</label>
          <Select value={String(oddsRank)} onValueChange={(v) => v && setOddsRank(Number(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
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
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 9 }, (_, i) => i + 1).map((r) => (
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
        {result && (
          <Badge
            variant={
              result.result.startsWith('Exceptional')
                ? 'default'
                : result.result === 'Yes'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {result.roll}: {result.result}
          </Badge>
        )}
      </div>

      {!compact && (
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr>
                <th className="text-left px-2 py-1">Odds</th>
                {Array.from({ length: 9 }, (_, i) => 9 - i).map((r) => (
                  <th key={r} className="px-2 py-1 text-center">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FATE_CHART.map((row) => (
                <tr
                  key={row.rank}
                  className={cn(row.rank === oddsRank && 'bg-muted')}
                >
                  <td
                    className="px-2 py-1 font-medium cursor-pointer"
                    onClick={() => setOddsRank(row.rank)}
                  >
                    {row.name}
                  </td>
                  {[...row.chaosOdds].reverse().map((cell) => (
                    <td
                      key={cell.rank}
                      onClick={() => {
                        setOddsRank(row.rank)
                        setChaosRank(cell.rank)
                      }}
                      className={cn(
                        'px-2 py-1 text-center cursor-pointer',
                        row.rank === oddsRank && cell.rank === chaosRank && 'bg-primary/20',
                      )}
                    >
                      {cell.chance}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
