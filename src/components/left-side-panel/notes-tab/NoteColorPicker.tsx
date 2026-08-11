import React from 'react'
import { NOTE_COLORS, type NoteColor } from '@/stores/editorStore'

interface NoteColorPickerProps {
  value: NoteColor
  onChange: (color: NoteColor) => void
}

const NoteColorPicker: React.FC<NoteColorPickerProps> = ({ value, onChange }) => (
  <div className="flex gap-1">
    {NOTE_COLORS.map((c) => (
      <button
        key={c.name}
        type="button"
        className={`w-3.5 h-3.5 rounded-full border-2 cursor-pointer p-0 transition-[border-color,transform] duration-150 hover:scale-120 ${value === c.name ? 'border-white' : 'border-transparent'}`}
        style={{ background: c.hex }}
        onClick={() => onChange(c.name)}
        title={c.name}
      />
    ))}
  </div>
)

export default NoteColorPicker
