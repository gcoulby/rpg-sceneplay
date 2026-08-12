export const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
]

export const CHART_TOOLTIP_STYLE = {
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 4,
  fontSize: 12,
}

export function formatEstimatedTime(minutes: number): string {
  const h = Math.floor(minutes)
  const m = Math.round((minutes - h) * 60)
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
