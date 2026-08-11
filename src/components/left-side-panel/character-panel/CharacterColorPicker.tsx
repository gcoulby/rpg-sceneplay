import React from 'react'
import { CHARACTER_COLOR_SWATCHES } from './characterConstants'

interface CharacterColorPickerProps {
  value: string
  onChange: (color: string) => void
}

const CharacterColorPicker: React.FC<CharacterColorPickerProps> = ({ value, onChange }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {CHARACTER_COLOR_SWATCHES.map((c) => (
      <button
        key={c}
        type="button"
        className={`w-7 h-7 rounded-full border-2 cursor-pointer shrink-0 shadow-[inset_0_0_0_1px_rgba(128,128,128,0.3)] ${value === c ? 'border-(--fd-text)' : 'border-transparent'}`}
        style={{ background: c }}
        onClick={() => onChange(c)}
      />
    ))}
    <label
      className="w-7 h-7 rounded-full border-2 border-dashed border-(--fd-border) flex items-center justify-center cursor-pointer shrink-0 relative overflow-hidden"
      title="Custom color"
    >
      <input
        type="color"
        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
        value={value || '#999999'}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="text-sm font-bold text-(--fd-text-muted) pointer-events-none">+</span>
    </label>
  </div>
)

export default CharacterColorPicker
