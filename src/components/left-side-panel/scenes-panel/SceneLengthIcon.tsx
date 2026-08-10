import React from 'react'
import { getPageFillStyle } from './scene-utils'

const SceneLengthIcon: React.FC<{ pages: number }> = React.memo(({ pages }) => {
  const wholePgs = Math.floor(pages)
  const fraction = pages - wholePgs
  const FILL_TOP = 2.5
  const FILL_BOT = 14
  const FILL_H = FILL_BOT - FILL_TOP
  const fillH = (fraction > 0 ? fraction : 1) * FILL_H
  const { color: fillColor, opacity: fillOpacity } = getPageFillStyle(pages)
  const showBg = pages > 1 && fraction > 0
  const bgStyle = showBg ? getPageFillStyle(wholePgs) : null

  return (
    <svg width="14" height="16" viewBox="0 0 14 16" style={{ flexShrink: 0 }}>
      {wholePgs >= 2 && (
        <rect
          x="3.5"
          y="0"
          width="9.5"
          height="13.5"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.2"
        />
      )}
      {wholePgs >= 1 && pages > 1 && (
        <rect
          x="2.5"
          y="0.5"
          width="9.5"
          height="13.5"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.3"
        />
      )}
      <rect
        x="1"
        y="1.5"
        width="9.5"
        height="13"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.5"
      />
      {bgStyle && (
        <rect
          x="2"
          y={FILL_TOP}
          width="7.5"
          height={FILL_H}
          fill={bgStyle.color}
          opacity={bgStyle.opacity}
          rx="0.5"
        />
      )}
      <rect
        x="2"
        y={FILL_BOT - fillH}
        width="7.5"
        height={fillH}
        fill={fillColor}
        opacity={fillOpacity}
        rx="0.5"
        className="opacity-55 scene-length-fill"
      />
    </svg>
  )
})

export default SceneLengthIcon
