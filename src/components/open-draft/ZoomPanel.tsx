import React, { useState, useRef, useEffect } from 'react'
import { FaSearchPlus, FaSearchMinus, FaTimes } from 'react-icons/fa'
import { useEditorStore } from '@/stores/editorStore'

const ZoomPanel: React.FC = () => {
  const { zoomLevel, setZoomLevel, zoomPanelOpen, setZoomPanelOpen } =
    useEditorStore()
  const [inputValue, setInputValue] = useState(String(zoomLevel))
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInputValue(String(zoomLevel))
  }, [zoomLevel])

  if (!zoomPanelOpen) return null

  const handleInputCommit = () => {
    const val = parseInt(inputValue, 10)
    if (!isNaN(val) && val >= 50 && val <= 300) {
      setZoomLevel(val)
    } else {
      setInputValue(String(zoomLevel))
    }
  }

  return (
    <div
      className="top-20 right-3 z-5000 fixed flex items-center gap-2 bg-[rgba(30,30,30,0.88)] shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-md px-3 py-2 border border-white/15 rounded-[10px] text-white! **:text-inherit! zoom-panel"
      ref={panelRef}
    >
      <button
        className="flex justify-center items-center bg-white/10 active:bg-white/25 disabled:opacity-30 border border-white/20 rounded-lg w-9 h-9 text-sm cursor-pointer zoom-panel-btn"
        onClick={() => setZoomLevel(zoomLevel - 10)}
        disabled={zoomLevel <= 50}
      >
        <FaSearchMinus />
      </button>
      <div className="flex items-center bg-white/10! px-1.5 border border-white/20! rounded-md h-9 zoom-panel-input-wrap">
        <input
          className="bg-transparent! [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0 border-none! outline-none w-11 h-auto text-sm! text-white! text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none zoom-panel-input [-moz-appearance:textfield]"
          type="number"
          min={50}
          max={300}
          step={10}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleInputCommit()
          }}
        />
        <span className="ml-px text-[13px] text-white/80! zoom-panel-pct">
          %
        </span>
      </div>
      <button
        className="flex justify-center items-center bg-white/10 active:bg-white/25 disabled:opacity-30 border border-white/20 rounded-lg w-9 h-9 text-sm cursor-pointer zoom-panel-btn"
        onClick={() => setZoomLevel(zoomLevel + 10)}
        disabled={zoomLevel >= 300}
      >
        <FaSearchPlus />
      </button>
      <button
        className="flex justify-center items-center bg-white/15 active:bg-white/30 ml-1 border-none rounded-full w-7 h-7 text-white/70 text-xs cursor-pointer zoom-panel-close"
        onClick={() => setZoomPanelOpen(false)}
        title="Close"
      >
        <FaTimes />
      </button>
    </div>
  )
}

export default ZoomPanel
