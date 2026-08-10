import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import ChartCard from './ChartCard'
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from './constants'
import type { computeCharacterDialogue } from '@/utils/open-draft/scriptStatistics'

interface DialogueDistributionCardProps {
  data: ReturnType<typeof computeCharacterDialogue>
}

const DialogueDistributionCard: React.FC<DialogueDistributionCardProps> = ({
  data,
}) => {
  const top15 = data.slice(0, 15)

  return (
    <ChartCard title="Dialogue Distribution">
      <div className="mb-3">
        {top15.length > 0 ? (
          <ResponsiveContainer
            width="100%"
            height={Math.max(200, top15.length * 28)}
          >
            <BarChart
              data={top15}
              layout="vertical"
              margin={{ left: 100, right: 20, top: 5, bottom: 5 }}
            >
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                width={95}
              />
              <Tooltip
                formatter={
                  ((value: any, name: any) => [
                    name === 'wordCount'
                      ? `${value} words`
                      : `${Number(value).toFixed(1)}%`,
                    name === 'wordCount' ? 'Words' : '% of dialogue',
                  ]) as any
                }
                contentStyle={CHART_TOOLTIP_STYLE}
              />
              <Bar dataKey="wordCount" name="wordCount" radius={[0, 3, 3, 0]}>
                {top15.map((entry, idx) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color || CHART_COLORS[idx % CHART_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="p-6 text-[var(--fd-text-muted)] text-xs text-center italic">
            No dialogue found
          </div>
        )}
      </div>

      {data.length > 0 && (
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Character</TableHead>
              <TableHead>Lines</TableHead>
              <TableHead>Words</TableHead>
              <TableHead>% Dialogue</TableHead>
              <TableHead>Scenes</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((c) => (
              <TableRow key={c.name}>
                <TableCell>
                  <span
                    className="inline-block mr-1.5 rounded-full w-2 h-2 align-middle"
                    style={{ background: c.color || '#666' }}
                  />
                  {c.name}
                </TableCell>
                <TableCell>{c.lineCount}</TableCell>
                <TableCell>{c.wordCount}</TableCell>
                <TableCell>{c.dialoguePercentage.toFixed(1)}%</TableCell>
                <TableCell>{c.sceneCount}</TableCell>
                <TableCell>{c.role || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ChartCard>
  )
}

export default DialogueDistributionCard
