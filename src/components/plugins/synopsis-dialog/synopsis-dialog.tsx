import React, { useRef, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  formatSceneDuration,
  getTimingColor,
} from '@/utils/open-draft/scriptTiming'
import { ScrollArea } from '@/components/ui/scroll-area'

const SCENE_COLORS = [
  '#8b5cf6',
  '#4f46e5',
  '#2563eb',
  '#059669',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#000000',
  '#ffffff',
  '',
]

interface SynopsisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sceneHeading: string
  synopsis: string
  sceneColor?: string
  pageLength?: number
  autoTimingSeconds?: number
  timingOverride?: number | null
  onSave: (
    synopsis: string,
    color: string,
    timingOverride?: number | null,
  ) => void
}

const SynopsisDialog: React.FC<SynopsisDialogProps> = ({
  open,
  onOpenChange,
  sceneHeading,
  synopsis,
  sceneColor,
  pageLength,
  autoTimingSeconds,
  timingOverride: initialOverride,
  onSave,
}) => {
  const [text, setText] = useState(synopsis)
  const [color, setColor] = useState(sceneColor || '')
  const [timingMode, setTimingMode] = useState<'auto' | 'manual'>(
    initialOverride != null ? 'manual' : 'auto',
  )
  const [manualMinutes, setManualMinutes] = useState(() =>
    initialOverride != null ? String(Math.floor(initialOverride / 60)) : '',
  )
  const [manualSeconds, setManualSeconds] = useState(() =>
    initialOverride != null ? String(Math.round(initialOverride % 60)) : '',
  )

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.focus()
    el.selectionStart = el.value.length
  }, [])

  const handleSave = () => {
    let override: number | null = null
    if (timingMode === 'manual') {
      const m = parseInt(manualMinutes || '0', 10)
      const s = parseInt(manualSeconds || '0', 10)
      if (m > 0 || s > 0) override = m * 60 + s
    }
    onSave(text, color, override)
    onOpenChange(false)
  }

  const finalSeconds =
    timingMode === 'manual'
      ? parseInt(manualMinutes || '0', 10) * 60 +
        parseInt(manualSeconds || '0', 10)
      : autoTimingSeconds || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-0 p-0 max-w-1/2! max-h-[80vh]">
        <DialogHeader className="px-5 py-3.5 border-b border-(--fd-border) shrink-0">
          <DialogTitle className="text-base">Synopsis</DialogTitle>
        </DialogHeader>
        {/* flex-1 + min-h-0 lets this shrink to the content's actual height
            (and only start scrolling once content exceeds the dialog's
            max-h-[80vh]) instead of always reserving a fixed 60vh, which
            was leaving dead space above the footer on short content. */}
        <ScrollArea className="flex-1 w-full min-h-0">
          <div className="flex flex-col flex-1 gap-2.5 px-5 py-4 overflow-y-auto">
            <div className="text-[13px] font-semibold text-(--fd-text) opacity-70 overflow-hidden text-ellipsis whitespace-nowrap ">
              {sceneHeading}
            </div>
            {(pageLength != null || autoTimingSeconds != null) && (
              <div className="flex gap-2.5 text-xs text-(--fd-text-muted) tabular-nums mb-0.5">
                {pageLength != null && pageLength > 0 && (
                  <span className="font-semibold">
                    {Number(pageLength.toFixed(1))}{' '}
                    {pageLength <= 1 ? 'page' : 'pages'}
                  </span>
                )}
                {finalSeconds > 0 && (
                  <span
                    className="font-semibold"
                    style={{ color: getTimingColor(finalSeconds) }}
                  >
                    {formatSceneDuration(finalSeconds)}
                    {timingMode === 'manual' && ' (manual)'}
                  </span>
                )}
              </div>
            )}
            <textarea
              ref={textareaRef}
              className="w-full min-h-50 resize-y bg-(--fd-bg) border border-(--fd-border) rounded p-3 text-(--fd-text) text-base font-[inherit] leading-normal outline-none focus:border-(--fd-accent) max-[600px]:min-h-[40vh]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a synopsis for this scene..."
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-(--fd-text-muted) whitespace-nowrap">
                Scene Duration
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-1 text-[13px] text-(--fd-text) cursor-pointer">
                  <input
                    type="radio"
                    name="timing"
                    className="cursor-pointer"
                    checked={timingMode === 'auto'}
                    onChange={() => setTimingMode('auto')}
                  />
                  Auto
                  {autoTimingSeconds
                    ? ` (${formatSceneDuration(autoTimingSeconds)})`
                    : ''}
                </label>
                <label className="flex items-center gap-1 text-[13px] text-(--fd-text) cursor-pointer">
                  <input
                    type="radio"
                    name="timing"
                    className="cursor-pointer"
                    checked={timingMode === 'manual'}
                    onChange={() => {
                      setTimingMode('manual')
                      if (
                        !manualMinutes &&
                        !manualSeconds &&
                        autoTimingSeconds
                      ) {
                        setManualMinutes(
                          String(Math.floor(autoTimingSeconds / 60)),
                        )
                        setManualSeconds(
                          String(Math.round(autoTimingSeconds % 60)),
                        )
                      }
                    }}
                  />
                  Manual
                </label>
                {timingMode === 'manual' && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className="w-12 h-7 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-1.5 text-[13px] text-center outline-none tabular-nums focus:border-(--fd-accent)"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="99"
                    />
                    <span className="text-xs text-(--fd-text-muted) font-medium">
                      m
                    </span>
                    <input
                      type="number"
                      className="w-12 h-7 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded-[3px] px-1.5 text-[13px] text-center outline-none tabular-nums focus:border-(--fd-accent)"
                      value={manualSeconds}
                      onChange={(e) => setManualSeconds(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="59"
                    />
                    <span className="text-xs text-(--fd-text-muted) font-medium">
                      s
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-(--fd-text-muted) whitespace-nowrap">
                Scene Color
              </span>
              <div className="flex flex-wrap gap-2">
                {SCENE_COLORS.map((c) => (
                  <button
                    key={c || 'none'}
                    type="button"
                    className={`w-7 h-7 rounded-full border-2 cursor-pointer shrink-0 bg-(--fd-text-muted) opacity-30 shadow-[inset_0_0_0_1px_rgba(128,128,128,0.3)] [[style]]:opacity-100 ${color === c ? 'border-(--fd-text)' : 'border-transparent'}`}
                    style={c ? { background: c } : undefined}
                    onClick={() => setColor(c)}
                    title={c || 'None'}
                  />
                ))}
                <label
                  className="w-7 h-7 rounded-full border-2 border-dashed border-(--fd-border) flex items-center justify-center cursor-pointer shrink-0 relative overflow-hidden"
                  title="Custom color"
                >
                  <input
                    type="color"
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    value={color || '#000000'}
                    onChange={(e) => setColor(e.target.value)}
                  />
                  <span className="text-sm font-bold text-(--fd-text-muted) pointer-events-none">
                    +
                  </span>
                </label>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mx-0 mb-0 rounded-none bg-transparent px-5 py-3.5 border-t border-(--fd-border) w-full">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SynopsisDialog
