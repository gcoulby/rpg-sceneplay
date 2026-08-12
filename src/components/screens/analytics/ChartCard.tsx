import React from 'react'

interface ChartCardProps {
  title: string
  id?: string
  action?: React.ReactNode
  children: React.ReactNode
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  id,
  action,
  children,
}) => (
  <div
    className="bg-(--fd-dropdown-bg) p-4 border border-(--fd-border) rounded-lg"
    id={id}
  >
    <div className="flex justify-between items-center mb-3">
      <h3 className="m-0 font-semibold text-[13px] text-(--fd-text) uppercase tracking-[0.3px]">
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
)

export default ChartCard
