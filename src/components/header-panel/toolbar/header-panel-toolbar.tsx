import {
  FaUndo,
  FaRedo,
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaSubscript,
  FaSuperscript,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaSearch,
  FaHashtag,
  FaMoon,
  FaSun,
  FaHighlighter,
} from 'react-icons/fa'
import { RiFontSize } from 'react-icons/ri'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FontPicker from './font-picker' // adjust path
import ToolbarZoomControl from './toolbar-zoom-control'
import { useToolbar } from './use-toolbar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeaderPanelToolbarProps {
  onOpenGoToPage: () => void
  wrap?: boolean
}

export function HeaderPanelToolbar({
  onOpenGoToPage,
  wrap = false,
}: HeaderPanelToolbarProps) {
  const toolbar = useToolbar({ onOpenGoToPage })

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-3 py-1.5 border-b toolbar *:shrink-0',
        wrap
          ? 'flex-wrap h-auto'
          : 'flex-nowrap h-10! overflow-x-auto overflow-y-hidden no-scrollbar',
      )}
      role="toolbar"
    >
      <Button
        type="button"
        title={`Undo (${toolbar.mod}Z)`}
        disabled={toolbar.undo.disabled}
        onClick={toolbar.undo.action}
        variant="ghost"
        className="rounded-sm size-6 cursor-pointer"
      >
        <FaUndo className="size-3" />
      </Button>
      <Button
        type="button"
        title="Redo"
        disabled={toolbar.redo.disabled}
        onClick={toolbar.redo.action}
        variant="ghost"
        className="rounded-sm size-6 cursor-pointer"
      >
        <FaRedo className="size-3" />
      </Button>

      <div className="w-px h-4 bg-(--fd-border) opacity-50 mx-1" />

      <Select
        value={toolbar.element.value}
        onValueChange={(value) => value && toolbar.element.onChange(value)}
      >
        <SelectTrigger className="rounded-sm min-w-35 h-6! text-[10.5px] cursor-pointer">
          <SelectValue placeholder="Theme">
            {
              toolbar.element.options.find(
                (x) => x.id == (toolbar.element.value as string),
              )?.label
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-auto min-w-56">
          <SelectGroup>
            {toolbar.element.options.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                <span className="flex w-full items-center justify-between gap-3">
                  <span>{opt.label}</span>
                  {opt.shortcut && (
                    <span className="text-muted-foreground text-xs tracking-widest">
                      {opt.shortcut}
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="w-px h-4 bg-(--fd-border) opacity-50 mx-1" />

      <FontPicker
        value={toolbar.fontFamily.value}
        extraFonts={toolbar.fontFamily.extraFonts}
        onChange={toolbar.fontFamily.onChange}
      />

      <Select
        value={
          toolbar.fontSize.value !== null ? String(toolbar.fontSize.value) : ''
        }
        onValueChange={(value) => {
          if (value) toolbar.fontSize.onChange(Number(value))
        }}
      >
        <SelectTrigger className="rounded-sm min-w-15 h-6! text-[11.5px]">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {toolbar.fontSize.options.map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s}pt
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="w-px h-4 bg-(--fd-border) opacity-50 mx-1" />

      <Toggle
        size="sm"
        pressed={toolbar.style.bold.active}
        disabled={toolbar.style.bold.disabled}
        onPressedChange={toolbar.style.bold.toggle}
        aria-label="Bold"
      >
        <FaBold className="size-3" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbar.style.italic.active}
        disabled={toolbar.style.italic.disabled}
        onPressedChange={toolbar.style.italic.toggle}
        aria-label="Italic"
      >
        <FaItalic className="size-3" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbar.style.underline.active}
        disabled={toolbar.style.underline.disabled}
        onPressedChange={toolbar.style.underline.toggle}
        aria-label="Underline"
      >
        <FaUnderline className="size-3" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbar.style.strikethrough.active}
        disabled={toolbar.style.strikethrough.disabled}
        onPressedChange={toolbar.style.strikethrough.toggle}
        aria-label="Strikethrough"
      >
        <FaStrikethrough className="size-3" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbar.style.subscript.active}
        disabled={toolbar.style.subscript.disabled}
        onPressedChange={toolbar.style.subscript.toggle}
        aria-label="Subscript"
      >
        <FaSubscript className="size-3" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={toolbar.style.superscript.active}
        disabled={toolbar.style.superscript.disabled}
        onPressedChange={toolbar.style.superscript.toggle}
        aria-label="Superscript"
      >
        <FaSuperscript className="size-3" />
      </Toggle>

      <div className="w-px h-4 bg-(--fd-border) opacity-50 mx-1" />

      <label
        title="Text Color"
        className={`toolbar-btn relative flex flex-col items-center justify-center gap-0.5 w-6.5 h-6 rounded-[5px] cursor-pointer hover:bg-(--fd-overlay-light) ${toolbar.colors.text.disabled ? 'opacity-30 pointer-events-none' : ''}`}
      >
        <RiFontSize size={12} />
        {/* <BiFontColor size={12} /> */}
        <span
          className="w-3.5 h-0.75 rounded-[1px] border border-(--fd-border)"
          style={{ backgroundColor: toolbar.colors.text.value }}
        />
        <input
          type="color"
          disabled={toolbar.colors.text.disabled}
          value={toolbar.colors.text.value}
          onChange={(e) => toolbar.colors.text.onChange(e.target.value)}
          className="sr-only"
        />
      </label>
      <label
        title="Highlight Color"
        className={`toolbar-btn relative flex flex-col items-center justify-center gap-0.5 w-6.5 h-6 rounded-[5px] cursor-pointer hover:bg-(--fd-overlay-light) ${toolbar.colors.background.disabled ? 'opacity-30 pointer-events-none' : ''}`}
      >
        <FaHighlighter size={9} />
        <span
          className="w-3.5 h-0.75 rounded-[1px] border border-(--fd-border)"
          style={{ backgroundColor: toolbar.colors.background.value }}
        />
        <input
          type="color"
          disabled={toolbar.colors.background.disabled}
          value={toolbar.colors.background.value}
          onChange={(e) => toolbar.colors.background.onChange(e.target.value)}
          className="sr-only"
        />
      </label>

      <div className="w-px h-4 bg-(--fd-border) opacity-50 mx-1" />

      {/* Alignment — base-ui's ToggleGroup is array-based regardless of
          how many values can be selected; we only ever put one value in
          the array, same pattern as ElementDetailPanel's textAlign group. */}
      <ToggleGroup
        size="sm"
        value={[toolbar.alignment.value]}
        onValueChange={(v) => {
          const next = v[0]
          if (next) toolbar.alignment.onChange(next)
        }}
        disabled={toolbar.alignment.disabled}
      >
        <ToggleGroupItem value="left" aria-label="Align left">
          <FaAlignLeft className="size-3" />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <FaAlignCenter className="size-3" />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <FaAlignRight className="size-3" />
        </ToggleGroupItem>
        <ToggleGroupItem value="justify" aria-label="Align justify">
          <FaAlignJustify className="size-3" />
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="w-px h-4 bg-(--fd-border) opacity-50 mx-1" />

      <Button
        type="button"
        title={`Find & Replace (${toolbar.mod}F)`}
        onClick={toolbar.search.action}
        variant="ghost"
        className="rounded-sm size-6 cursor-pointer"
      >
        <FaSearch className="size-3" />
      </Button>
      <Button
        type="button"
        title={`Go to Page (${toolbar.mod}G)`}
        onClick={toolbar.goto.action}
        variant="ghost"
        className="rounded-sm size-6 cursor-pointer"
      >
        <FaHashtag className="size-3" />
      </Button>

      <div className="w-px h-4 bg-(--fd-border) opacity-50 mx-1" />

      <div style={{ flex: 1 }} />

      <Toggle
        size="sm"
        pressed={toolbar.theme.active === 'light'}
        onPressedChange={toolbar.theme.toggle}
        aria-label="Production Tags"
        className="cursor-pointer"
      >
        {toolbar.theme.active === 'light' ? <FaSun /> : <FaMoon />}
      </Toggle>

      <ToolbarZoomControl />
    </div>
  )
}
