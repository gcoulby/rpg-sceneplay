import React from 'react'

interface DragGhostProps {
  html: string
  x: number
  y: number
  width: number
  height: number
}

const DragGhost: React.FC<DragGhostProps> = ({ html, x, y, width, height }) => (
  <div
    className="z-10000 fixed opacity-[0.92] shadow-[0_8px_24px_rgba(0,0,0,0.4)] overflow-hidden [pointer-events:none!important] **:[pointer-events:none!important]"
    style={{ left: x, top: y, width, height }}
  >
    <div
      className="index-card flex bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-md overflow-hidden"
      style={{ width: '100%', height: '100%', margin: 0 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  </div>
)

export default DragGhost
