import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
} from 'react-icons/fa'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { FormattingElementRule } from '@/stores/formattingTypes'
import { FONT_CATEGORIES, getFontsByCategory } from '@/utils/open-draft/fonts'
import type { FontEntry } from '@/utils/open-draft/fonts'
import { FONT_SIZES } from './template-editor-utils'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ElementDetailPanelProps {
  rule: FormattingElementRule
  mode: 'enforce' | 'override'
  elementOptions: { id: string; label: string }[]
  onUpdate: (updates: Partial<FormattingElementRule>) => void
}

export default function ElementDetailPanel({
  rule,
  mode,
  elementOptions,
  onUpdate,
}: ElementDetailPanelProps) {
  const textTransforms = [
    { label: 'None', id: 'none' },
    { label: 'Uppercase', id: 'uppercase' },
    { label: 'Lowercase', id: 'lowercase' },
  ]

  return (
    <div className="flex flex-col flex-1 gap-3 p-4 overflow-y-auto">
      {/* Label */}
      <div className="space-y-1 min-w-45">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Label
        </Label>
        <Input
          className="h-8.5 text-sm"
          value={rule.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          disabled={rule.isBuiltIn}
          placeholder="Element name"
        />
      </div>

      {/* Font family & size */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1 min-w-45">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Font Family
          </Label>
          <select
            className="bg-input px-2.5 border focus:border-primary rounded outline-none w-full h-8.5 text-foreground text-sm"
            value={rule.fontFamily || ''}
            onChange={(e) => onUpdate({ fontFamily: e.target.value || null })}
          >
            <option value="">Default</option>
            {FONT_CATEGORIES.map((category) => {
              const fonts = getFontsByCategory()[category]
              if (!fonts || fonts.length === 0) return null
              return (
                <optgroup key={category} label={category}>
                  {fonts.map((font: FontEntry) => (
                    <option key={font.name} value={font.name}>
                      {font.name}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>
        </div>
        <div className="flex-1 space-y-1 min-w-45">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Font Size
          </Label>
          <Select
            value={(rule.fontSize ?? 'Default') as string}
            onValueChange={(e) =>
              onUpdate({
                fontSize: e ? Number(e) : null,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Default">
                {FONT_SIZES.find((x) => x == rule.fontSize)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="">Default</SelectItem>
                {FONT_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}pt
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {/* <select
            className="bg-input px-2.5 border focus:border-primary rounded outline-none w-full h-8.5 text-foreground text-sm"
            value={rule.fontSize ?? ''}
            onChange={(e) =>
              onUpdate({
                fontSize: e.target.value ? Number(e.target.value) : null,
              })
            }
          >
            <option value="">Default</option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}pt
              </option>
            ))}
          </select> */}
        </div>
      </div>

      {/* Text style toggles */}
      <div className="space-y-1 min-w-45">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Text Style
        </Label>
        <div className="flex gap-1">
          <Toggle
            pressed={rule.bold}
            onPressedChange={(v) => onUpdate({ bold: v })}
            aria-label="Bold"
          >
            <FaBold />
          </Toggle>
          <Toggle
            pressed={rule.italic}
            onPressedChange={(v) => onUpdate({ italic: v })}
            aria-label="Italic"
          >
            <FaItalic />
          </Toggle>
          <Toggle
            pressed={rule.underline}
            onPressedChange={(v) => onUpdate({ underline: v })}
            aria-label="Underline"
          >
            <FaUnderline />
          </Toggle>
          <Toggle
            pressed={rule.strikethrough}
            onPressedChange={(v) => onUpdate({ strikethrough: v })}
            aria-label="Strikethrough"
          >
            <FaStrikethrough />
          </Toggle>
        </div>
      </div>

      {/* Text transform */}
      <div className="space-y-1 min-w-45">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Text Transform
        </Label>
        <Select
          value={rule.textTransform}
          onValueChange={(e) =>
            onUpdate({ textTransform: e as typeof rule.textTransform })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Text Transform">
              {
                textTransforms.find(
                  (x) => x.id == (rule.textTransform as string),
                )?.label
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {textTransforms.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup></SelectGroup>
          </SelectContent>
        </Select>
        {/* <select
          className="bg-input px-2.5 border focus:border-primary rounded outline-none w-full h-8.5 text-foreground text-sm"
          value={rule.textTransform}
          onChange={(e) =>
            onUpdate({
              textTransform: e.target.value as typeof rule.textTransform,
            })
          }
        >
          <option value="none">None</option>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
        </select> */}
      </div>

      {/* Alignment */}
      <div className="space-y-1 min-w-45">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Alignment
        </Label>
        <ToggleGroup
          value={[rule.textAlign]}
          onValueChange={(v) => {
            const next = v[0]
            if (next)
              onUpdate({
                textAlign: next as FormattingElementRule['textAlign'],
              })
          }}
        >
          <ToggleGroupItem value="left" aria-label="Align left">
            <FaAlignLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <FaAlignCenter />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <FaAlignRight />
          </ToggleGroupItem>
          <ToggleGroupItem value="justify" aria-label="Align justify">
            <FaAlignJustify />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Colors */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1 min-w-45">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Text Color
          </Label>
          <div className="flex items-center gap-1">
            <input
              type="color"
              className="bg-transparent p-0 border rounded w-7 h-7 cursor-pointer"
              value={rule.textColor || '#000000'}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
            />
            <Input
              className="flex-1 h-7 text-xs"
              value={rule.textColor || ''}
              onChange={(e) => onUpdate({ textColor: e.target.value || null })}
              placeholder="inherit"
            />
            {rule.textColor && (
              <button
                className="w-5 h-5 text-muted-foreground hover:text-red-500 text-xs"
                onClick={() => onUpdate({ textColor: null })}
              >
                x
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-1 min-w-45">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Background Color
          </Label>
          <div className="flex items-center gap-1">
            <input
              type="color"
              className="bg-transparent p-0 border rounded w-7 h-7 cursor-pointer"
              value={rule.backgroundColor || '#ffffff'}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            />
            <Input
              className="flex-1 h-7 text-xs"
              value={rule.backgroundColor || ''}
              onChange={(e) =>
                onUpdate({ backgroundColor: e.target.value || null })
              }
              placeholder="transparent"
            />
            {rule.backgroundColor && (
              <button
                className="w-5 h-5 text-muted-foreground hover:text-red-500 text-xs"
                onClick={() => onUpdate({ backgroundColor: null })}
              >
                x
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Layout: margin, indents */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1 min-w-45">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Margin Top (pt)
          </Label>
          <Input
            type="number"
            className="w-20 h-8.5 text-sm"
            value={rule.marginTop}
            onChange={(e) =>
              onUpdate({ marginTop: Number(e.target.value) || 0 })
            }
            min={0}
            step={1}
          />
        </div>
        <div className="flex-1 space-y-1 min-w-45">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Left Indent (in)
          </Label>
          <Input
            type="number"
            className="w-20 h-8.5 text-sm"
            value={rule.leftIndent}
            onChange={(e) =>
              onUpdate({ leftIndent: Number(e.target.value) || 0 })
            }
            min={0}
            step={0.25}
          />
        </div>
        <div className="flex-1 space-y-1 min-w-45">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Right Indent (in)
          </Label>
          <Input
            type="number"
            className="w-20 h-8.5 text-sm"
            value={rule.rightIndent}
            onChange={(e) =>
              onUpdate({ rightIndent: Number(e.target.value) || 0 })
            }
            min={0}
            step={0.25}
          />
        </div>
      </div>

      {/* Element flow */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1 min-w-45">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Next on Enter
          </Label>

          <Select
            value={rule.nextOnEnter}
            onValueChange={(e) => onUpdate({ nextOnEnter: e as string })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Theme">
                {
                  elementOptions.find(
                    (x) => x.id == (rule.nextOnEnter as string),
                  )?.label
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {elementOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* <select
            className="bg-input px-2.5 border focus:border-primary rounded outline-none w-full h-8.5 text-foreground text-sm"
            value={rule.nextOnEnter}
            onChange={(e) => onUpdate({ nextOnEnter: e.target.value })}
          >
            {elementOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select> */}
        </div>
        <div className="flex-1 space-y-1 min-w-45">
          <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Next on Tab
          </Label>
          <Select
            value={rule.nextOnTab}
            onValueChange={(e) => {
              onUpdate({ nextOnTab: e as string })
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Theme">
                {
                  elementOptions.find((x) => x.id == (rule.nextOnTab as string))
                    ?.label
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {elementOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {/* <select
            className="bg-input px-2.5 border focus:border-primary rounded outline-none w-full h-8.5 text-foreground text-sm"
            value={rule.nextOnTab || ''}
            onChange={(e) => onUpdate({ nextOnTab: e.target.value || null })}
          >
            <option value="">None</option>
            {elementOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select> */}
        </div>
      </div>

      {/* Placeholder */}
      <div className="space-y-1 min-w-45">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Placeholder Text
        </Label>
        <Input
          className="h-8.5 text-sm"
          value={rule.placeholder}
          onChange={(e) => onUpdate({ placeholder: e.target.value })}
          placeholder="Shown when element is empty"
        />
      </div>

      {/* Format override */}
      {mode === 'enforce' && (
        <div className="space-y-1 min-w-45">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rule.allowFormatOverride !== false}
              onChange={(e) =>
                onUpdate({ allowFormatOverride: e.target.checked })
              }
            />
            Allow format override
          </label>
          <span className="block text-[11px] text-muted-foreground">
            {rule.allowFormatOverride !== false
              ? 'Users can override formatting for this element type.'
              : 'All formatting is locked — users cannot change any styling for this element.'}
          </span>
        </div>
      )}

      {/* Preview */}
      <div className="space-y-1 min-w-45">
        <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
          Preview
        </Label>
        <div
          className="bg-background px-4 py-3 border rounded min-h-12"
          style={{
            fontFamily: rule.fontFamily || undefined,
            fontSize: rule.fontSize ? `${rule.fontSize}pt` : undefined,
            fontWeight: rule.bold ? 'bold' : 'normal',
            fontStyle: rule.italic ? 'italic' : 'normal',
            textDecoration:
              [
                rule.underline ? 'underline' : '',
                rule.strikethrough ? 'line-through' : '',
              ]
                .filter(Boolean)
                .join(' ') || 'none',
            textTransform:
              rule.textTransform as React.CSSProperties['textTransform'],
            textAlign: rule.textAlign as React.CSSProperties['textAlign'],
            marginTop: `${rule.marginTop}pt`,
            paddingLeft: `${Math.max(0, (rule.leftIndent - 1.5) * 96)}px`,
            color: rule.textColor || undefined,
            backgroundColor: rule.backgroundColor || undefined,
          }}
        >
          {rule.placeholder || rule.label || 'Sample text...'}
        </div>
      </div>
    </div>
  )
}
