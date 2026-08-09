import { useRef, useState } from 'react'
import { FaSearchMinus, FaSearchPlus } from 'react-icons/fa'
import { useEditorStore } from '@/stores/editorStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ToolbarZoomControl() {
  const zoomLevel = useEditorStore((s) => s.zoomLevel)
  const setZoomLevel = useEditorStore((s) => s.setZoomLevel)

  const [editing, setEditing] = useState(false)
  const [zoomInput, setZoomInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = () => {
    setZoomInput(String(zoomLevel))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commit = () => {
    const val = parseInt(zoomInput, 10)
    if (!isNaN(val) && val >= 50 && val <= 300) setZoomLevel(val)
    setEditing(false)
  }

  return (
    <div className="toolbar-group zoom-group flex items-center gap-1">
      <Button
        type="button"
        title="Zoom Out"
        onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
        disabled={zoomLevel <= 50}
        variant="ghost"
        className="rounded-sm size-6 cursor-pointer"
      >
        <FaSearchMinus className="size-3" />
      </Button>

      {editing ? (
        <Input
          ref={inputRef}
          className="w-12 bg-(--fd-input-bg) border border-(--fd-accent) rounded-[3px] text-xs! text-center outline-none px-0.5 py-0 max-h-6"
          type="number"
          min={50}
          max={300}
          step={10}
          value={zoomInput}
          onChange={(e) => setZoomInput(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
          }}
          autoFocus
        />
      ) : (
        <span
          className="zoom-label text-(--fd-text-muted) text-[11px] min-w-9 text-center tabular-nums cursor-pointer"
          onClick={startEditing}
          title="Click to edit zoom"
        >
          {zoomLevel}%
        </span>
      )}

      <Button
        type="button"
        title="Zoom In"
        onClick={() => setZoomLevel(Math.min(300, zoomLevel + 10))}
        disabled={zoomLevel >= 300}
        variant="ghost"
        className="rounded-sm size-6 cursor-pointer"
      >
        <FaSearchPlus className="size-3" />
      </Button>
    </div>
  )
}
