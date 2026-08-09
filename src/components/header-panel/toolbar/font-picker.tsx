import React from 'react'
import {
  FONT_REGISTRY,
  FONT_CATEGORIES,
  loadFont,
  getFontsByCategory,
} from '@/utils/open-draft/fonts'
import type { FontEntry } from '@/utils/open-draft/fonts'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FontPickerProps {
  value: string
  onChange: (fontName: string) => void
  extraFonts?: string[]
}

const FontPicker: React.FC<FontPickerProps> = ({
  value,
  onChange,
  extraFonts = [],
}) => {
  // const fontsByCategory = useMemo(() => getFontsByCategory(), [])

  const handleChange = (val: string | null) => {
    const fontName = val || ''
    const entry = FONT_REGISTRY.find((f) => f.name === fontName)
    if (entry) {
      loadFont(entry)
    }
    onChange(fontName)
  }

  return (
    <Select value={value} onValueChange={(val) => handleChange(val)}>
      <SelectTrigger className="rounded-sm min-w-45 h-6! text-[11.5px] cursor-pointer">
        <SelectValue placeholder="Default">
          {FONT_CATEGORIES.find((x) => x == value)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Default</SelectItem>
        {extraFonts.length > 0 && (
          <SelectGroup>
            <SelectLabel>Document Fonts</SelectLabel>
            {extraFonts.map((name) => (
              <SelectItem key={`extra-${name}`} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        {FONT_CATEGORIES.map((category, i) => {
          const fonts = getFontsByCategory()[category]
          if (!fonts || fonts.length === 0) return null
          return (
            <>
              <SelectGroup key={category}>
                <SelectLabel>{category}</SelectLabel>
                {fonts.map((font: FontEntry) => (
                  <SelectItem key={font.name} value={font.name}>
                    {font.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              {i <= FONT_CATEGORIES.length - 1 && <SelectSeparator />}
            </>
          )
        })}
      </SelectContent>
    </Select>
  )
}

export default FontPicker
