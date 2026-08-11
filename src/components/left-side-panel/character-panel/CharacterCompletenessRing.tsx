import React from 'react'
import { getProfileCompleteness } from './characterUtils'
import type { CharacterProfile } from '@/stores/editorStore'

interface CharacterCompletenessRingProps {
  profile: CharacterProfile
}

const CharacterCompletenessRing: React.FC<CharacterCompletenessRingProps> = ({ profile }) => {
  const comp = getProfileCompleteness(profile)
  const color =
    comp.pct === 0
      ? 'var(--fd-text-muted, #666)'
      : comp.pct < 40
        ? '#f44336'
        : comp.pct < 70
          ? '#ff9800'
          : comp.pct < 100
            ? '#4caf50'
            : '#2e7d32'

  return (
    <div className="group relative flex flex-col items-center gap-px cursor-help shrink-0">
      <svg width="22" height="22" viewBox="0 0 22 22" className="block">
        <circle cx="11" cy="11" r="9" fill="none" stroke="var(--fd-border, #333)" strokeWidth="2" />
        <circle
          cx="11"
          cy="11"
          r="9"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={`${comp.pct * 0.5655} 56.55`}
          strokeLinecap="round"
          transform="rotate(-90 11 11)"
        />
      </svg>
      <span className="font-bold text-[8px] leading-none" style={{ color }}>
        {comp.pct}%
      </span>
      <div className="hidden group-hover:block absolute top-full right-0 mt-1.5 bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-md py-2 px-2.5 min-w-40 z-100 shadow-[0_4px_16px_rgba(0,0,0,0.5)] pointer-events-none">
        <div className="text-[11px] font-bold mb-1 text-(--fd-text) pb-1 border-b border-(--fd-border)">
          Profile: {comp.filled}/{comp.total}
        </div>
        {comp.fields.map((f) => (
          <div key={f.label} className="text-[10px] text-(--fd-text-muted) flex items-center gap-1">
            <span className={f.filled ? 'text-[#4caf50]' : 'text-(--fd-text-muted)'}>
              {f.filled ? '\u2713' : '\u2717'}
            </span>
            {f.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CharacterCompletenessRing
