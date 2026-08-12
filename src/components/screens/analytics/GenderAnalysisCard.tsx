import React from 'react'
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts'
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
import type { computeGenderBreakdown } from '@/utils/open-draft/scriptStatistics'

interface GenderAnalysisCardProps {
  data: ReturnType<typeof computeGenderBreakdown>
}

const GenderAnalysisCard: React.FC<GenderAnalysisCardProps> = ({ data }) => {
  if (data.length === 0) return null

  return (
    <ChartCard title="Gender Analysis">
      <div className="items-start gap-4 grid grid-cols-2 max-[768px]:grid-cols-1">
        <div className="flex justify-center items-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                dataKey="wordCount"
                nameKey="gender"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={75}
                paddingAngle={2}
                label={({ gender, dialoguePercentage }: any) =>
                  `${gender} ${Number(dialoguePercentage).toFixed(0)}%`
                }
              >
                {data.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={
                  ((value: any) => [`${value} words`, 'Dialogue']) as any
                }
                contentStyle={CHART_TOOLTIP_STYLE}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <Table className="text-xs self-center">
          <TableHeader>
            <TableRow>
              <TableHead>Gender</TableHead>
              <TableHead>Characters</TableHead>
              <TableHead>Lines</TableHead>
              <TableHead>Words</TableHead>
              <TableHead>%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((g, idx) => (
              <TableRow key={g.gender}>
                <TableCell>
                  <span
                    className="inline-block mr-1.5 rounded-full w-2 h-2 align-middle"
                    style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                  />
                  {g.gender}
                </TableCell>
                <TableCell>{g.characters}</TableCell>
                <TableCell>{g.lineCount}</TableCell>
                <TableCell>{g.wordCount}</TableCell>
                <TableCell>{g.dialoguePercentage.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ChartCard>
  )
}

export default GenderAnalysisCard
