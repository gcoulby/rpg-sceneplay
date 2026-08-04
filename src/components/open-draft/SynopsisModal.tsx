import React, { useState, useEffect, useRef } from 'react'
import { formatSceneDuration, getTimingColor } from '@/utils/scriptTiming'

// VIBGYOR + black + white + no color (rainbow order)
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

interface SynopsisModalProps {
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
  onClose: () => void
}

const SynopsisModal: React.FC<SynopsisModalProps> = ({
  sceneHeading,
  synopsis,
  sceneColor,
  pageLength,
  autoTimingSeconds,
  timingOverride: initialOverride,
  onSave,
  onClose,
}) => {
  const [text, setText] = useState(synopsis)
  const [color, setColor] = useState(sceneColor || '')
  const [timingMode, setTimingMode] = useState<'auto' | 'manual'>(
    initialOverride != null ? 'manual' : 'auto',
  )
  const [manualMinutes, setManualMinutes] = useState(() => {
    if (initialOverride != null) return String(Math.floor(initialOverride / 60))
    return ''
  })
  const [manualSeconds, setManualSeconds] = useState(() => {
    if (initialOverride != null) return String(Math.round(initialOverride % 60))
    return ''
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSave = () => {
    let override: number | null = null
    if (timingMode === 'manual') {
      const m = parseInt(manualMinutes || '0', 10)
      const s = parseInt(manualSeconds || '0', 10)
      if (m > 0 || s > 0) override = m * 60 + s
    }
    onSave(text, color, override)
    onClose()
  }

  const finalSeconds =
    timingMode === 'manual'
      ? parseInt(manualMinutes || '0', 10) * 60 +
        parseInt(manualSeconds || '0', 10)
      : autoTimingSeconds || 0

  return (
    <div
      className="dialog-overlay fixed left-0 top-0 right-0 bg-black/50 z-3500 flex items-start justify-center h-(--vv-height,100dvh) pt-[5vh] px-4 pb-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] w-[min(520px,calc(100vw-32px))] max-h-[80vh] flex flex-col max-[600px]:w-[calc(100vw-24px)] max-[600px]:max-h-[85vh] max-[600px]:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header flex items-baseline gap-3 px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base shrink-0 max-[600px]:flex-col max-[600px]:gap-1">
          <span>Synopsis</span>
        </div>
        <div className="flex flex-col flex-1 gap-2.5 px-5 max-[600px]:px-4 py-4 max-[600px]:py-3">
          <div className="text-[13px] font-semibold text-(--fd-text) opacity-70 overflow-hidden text-ellipsis whitespace-nowrap max-[600px]:whitespace-normal">
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
          {/* Timing editor */}
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
                    if (!manualMinutes && !manualSeconds && autoTimingSeconds) {
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
        </div>
        <div className="flex flex-col gap-1.5 px-5 py-2">
          <span className="text-xs text-(--fd-text-muted) whitespace-nowrap">
            Scene Color
          </span>
          <div className="flex flex-wrap gap-2">
            {SCENE_COLORS.map((c) => (
              <button
                key={c || 'none'}
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
        <div className="dialog-footer flex items-center gap-2 px-5 py-3.5 border-t border-(--fd-border) shrink-0">
          <button
            className="dialog-btn h-8.5 px-4.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded text-sm cursor-pointer hover:bg-(--fd-toolbar-hover)"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="dialog-btn dialog-btn-primary h-8.5 px-4.5 bg-(--fd-accent) border border-(--fd-accent) text-white rounded text-sm cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-default"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default SynopsisModal
