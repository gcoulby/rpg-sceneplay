import React from 'react'

interface MiniChartBoxProps {
  title: string
  children: React.ReactNode
}

const MiniChartBox: React.FC<MiniChartBoxProps> = ({ title, children }) => (
  <div className="bg-black/15 p-2.5 rounded-md">
    <div className="text-[11px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-1.5 text-center">
      {title}
    </div>
    {children}
  </div>
)

export default MiniChartBox
