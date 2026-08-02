import React, { useEffect, useRef, useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string | null) => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff0000', '#ff6600', '#ffcc00', '#33cc33', '#0066ff', '#9933ff',
  '#cc0000', '#cc6600', '#999900', '#006600', '#003399', '#660099',
  '#ff6666', '#ffcc66', '#ffff66', '#66ff66', '#66ccff', '#cc66ff',
];

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [customColor, setCustomColor] = useState(value || '#000000');

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div className="absolute top-full left-0 z-1000 bg-(--fd-toolbar-bg) border border-(--fd-border) rounded-md p-2 w-55 shadow-[0_4px_12px_rgba(0,0,0,0.4)]" ref={ref}>
      <div className="grid grid-cols-6 gap-1 mb-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            className={`w-7 h-7 border-2 rounded p-0 cursor-pointer ${value === color ? 'border-white shadow-[0_0_0_1px_var(--fd-accent)]' : 'border-transparent hover:border-(--fd-accent)'}`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            title={color}
          />
        ))}
      </div>
      <div className="flex gap-1 items-center mb-1.5">
        <input
          type="color"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          className="w-7 h-7 p-0 border border-(--fd-border) rounded cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={customColor}
          onChange={(e) => setCustomColor(e.target.value)}
          className="flex-1 h-6.5 text-xs px-1.5 bg-(--fd-bg) text-(--fd-text) border border-(--fd-border) rounded"
          placeholder="#000000"
          maxLength={7}
        />
        <button
          className="h-6.5 px-2 text-xs bg-(--fd-accent) text-white border-none rounded cursor-pointer"
          onClick={() => onChange(customColor)}
        >
          Apply
        </button>
      </div>
      <button
        className="w-full p-1 text-xs bg-transparent text-(--fd-text-dim,#aaa) border border-(--fd-border) rounded cursor-pointer hover:text-(--fd-text)"
        onClick={() => onChange(null)}
      >
        Reset to Default
      </button>
    </div>
  );
};

export default ColorPicker;
