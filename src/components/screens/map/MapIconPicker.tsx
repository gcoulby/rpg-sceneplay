import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MAP_ICONS, MAP_ICONS_BY_KEY } from './mapIcons'

interface MapIconPickerProps {
  value: string
  onChange: (key: string) => void
}

/** Small grid picker over the curated GameIcons set — a tile's glyph. */
export default function MapIconPicker({ value, onChange }: MapIconPickerProps) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')

  const selected = value ? MAP_ICONS_BY_KEY[value] : undefined
  const filtered = MAP_ICONS.filter((opt) =>
    opt.label.toLowerCase().includes(filter.trim().toLowerCase()),
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs h-8 justify-start gap-2"
          />
        }
      >
        {selected ? (
          <>
            <selected.Icon size={14} />
            {selected.label}
          </>
        ) : (
          'Choose Icon'
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="p-2 w-64">
        <Input
          autoFocus
          className="h-7 text-xs mb-2"
          placeholder="Filter icons…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
          {value && (
            <button
              type="button"
              title="No icon"
              className="flex items-center justify-center rounded border border-border h-8 text-[10px] text-muted-foreground hover:bg-muted"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              None
            </button>
          )}
          {filtered.map((opt) => (
            <button
              key={opt.key}
              type="button"
              title={opt.label}
              className={`flex items-center justify-center rounded border h-8 hover:bg-muted ${
                value === opt.key ? 'border-primary bg-primary/10' : 'border-border'
              }`}
              onClick={() => {
                onChange(opt.key)
                setOpen(false)
              }}
            >
              <opt.Icon size={16} />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
