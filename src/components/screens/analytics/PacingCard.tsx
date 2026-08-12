import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import ChartCard from './ChartCard'
import { CHART_TOOLTIP_STYLE } from './constants'
import type { computePacingData } from '@/utils/open-draft/scriptStatistics'

interface PacingCardProps {
  data: ReturnType<typeof computePacingData>
  sceneHeadings: string[]
}

const PacingCard: React.FC<PacingCardProps> = ({ data, sceneHeadings }) => {
  if (data.length === 0) return null

  return (
    <ChartCard title="Pacing — Dialogue vs Action by Scene">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
          <XAxis
            dataKey="sceneIndex"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: any) => `S${Number(v) + 1}`}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            label={{
              value: 'Words',
              angle: -90,
              position: 'insideLeft',
              fontSize: 10,
            }}
          />
          <Tooltip
            labelFormatter={(v: any) =>
              sceneHeadings[v as number] || `Scene ${(v as number) + 1}`
            }
            formatter={
              ((value: any, name: any) => [
                `${value} words`,
                name === 'dialogueWords' ? 'Dialogue' : 'Action',
              ]) as any
            }
            contentStyle={CHART_TOOLTIP_STYLE}
          />
          <Area
            type="monotone"
            dataKey="dialogueWords"
            stackId="1"
            stroke="#3b82f6"
            fill="#3b82f680"
            name="dialogueWords"
          />
          <Area
            type="monotone"
            dataKey="actionWords"
            stackId="1"
            stroke="#f59e0b"
            fill="#f59e0b80"
            name="actionWords"
          />
          <Legend
            formatter={(value: any) =>
              value === 'dialogueWords' ? 'Dialogue' : 'Action'
            }
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

export default PacingCard
