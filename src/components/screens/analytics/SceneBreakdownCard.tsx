import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import ChartCard from './ChartCard'
import MiniChartBox from './MiniChartBox'
import { CHART_TOOLTIP_STYLE } from './constants'
import type { computeSceneBreakdown } from '@/utils/open-draft/scriptStatistics'

interface SceneBreakdownCardProps {
  data: ReturnType<typeof computeSceneBreakdown>
}

const SceneBreakdownCard: React.FC<SceneBreakdownCardProps> = ({ data }) => (
  <ChartCard title="Scene Breakdown">
    <div className="gap-3 grid grid-cols-2 max-[768px]:grid-cols-1">
      <MiniChartBox title="Interior / Exterior">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={[
                { name: 'INT.', value: data.intCount },
                { name: 'EXT.', value: data.extCount },
                { name: 'INT./EXT.', value: data.intExtCount },
              ].filter((d) => d.value > 0)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={55}
              label={({ name, value }: any) => `${name} ${value}`}
            >
              <Cell fill="#3b82f6" />
              <Cell fill="#10b981" />
              <Cell fill="#f59e0b" />
            </Pie>
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </MiniChartBox>

      <MiniChartBox title="Time of Day">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={[
                { name: 'Day', value: data.dayCount },
                { name: 'Night', value: data.nightCount },
                { name: 'Other', value: data.otherTimeCount },
              ].filter((d) => d.value > 0)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={55}
              label={({ name, value }: any) => `${name} ${value}`}
            >
              <Cell fill="#f59e0b" />
              <Cell fill="#6366f1" />
              <Cell fill="#94a3b8" />
            </Pie>
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
          </PieChart>
        </ResponsiveContainer>
      </MiniChartBox>

      <MiniChartBox title="Scene Length Distribution">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={data.sceneLengthBuckets}
            margin={{ left: 0, right: 10, top: 5, bottom: 5 }}
          >
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar dataKey="count" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </MiniChartBox>

      <MiniChartBox title="Top Locations">
        {data.locationFrequency.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={data.locationFrequency.slice(0, 8)}
              layout="vertical"
              margin={{ left: 80, right: 10, top: 5, bottom: 5 }}
            >
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="location"
                tick={{ fontSize: 9 }}
                width={75}
              />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#14b8a6" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-(--fd-text-muted) text-xs text-center p-6 italic">
            No locations found
          </div>
        )}
      </MiniChartBox>
    </div>
  </ChartCard>
)

export default SceneBreakdownCard
