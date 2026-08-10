import React from 'react'

interface StatCardProps {
  value: string | number
  label: string
  sublabel?: string
}

const StatCard: React.FC<StatCardProps> = ({ value, label, sublabel }) => (
  <div className="bg-[var(--fd-dropdown-bg)] p-4 border border-[var(--fd-border)] rounded-lg text-center">
    <div className="font-bold text-[28px] text-[var(--fd-text)] leading-[1.2]">
      {value}
    </div>
    <div className="mt-1 text-[11px] text-[var(--fd-text-muted)] uppercase tracking-[0.5px]">
      {label}
    </div>
    {sublabel && (
      <div className="opacity-70 mt-0.5 text-[11px] text-[var(--fd-text-muted)]">
        {sublabel}
      </div>
    )}
  </div>
)

export default StatCard
