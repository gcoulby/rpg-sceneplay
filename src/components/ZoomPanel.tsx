import React, { useState, useRef, useEffect } from 'react';
import { FaSearchPlus, FaSearchMinus, FaTimes } from 'react-icons/fa';
import { useEditorStore } from '../stores/editorStore';

const ZoomPanel: React.FC = () => {
  const { zoomLevel, setZoomLevel, zoomPanelOpen, setZoomPanelOpen } = useEditorStore();
  const [inputValue, setInputValue] = useState(String(zoomLevel));
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(String(zoomLevel));
  }, [zoomLevel]);

  if (!zoomPanelOpen) return null;

  const handleInputCommit = () => {
    const val = parseInt(inputValue, 10);
    if (!isNaN(val) && val >= 50 && val <= 300) {
      setZoomLevel(val);
    } else {
      setInputValue(String(zoomLevel));
    }
  };

  return (
    <div
      className="zoom-panel fixed top-20 right-3 flex items-center gap-2 bg-[rgba(30,30,30,0.88)] backdrop-blur-md border border-white/15 rounded-[10px] py-2 px-3 z-5000 shadow-[0_4px_16px_rgba(0,0,0,0.4)] text-white! **:text-inherit!"
      ref={panelRef}
    >
      <button
        className="zoom-panel-btn flex items-center justify-center w-9 h-9 rounded-lg border border-white/20 bg-white/10 text-sm cursor-pointer active:bg-white/25 disabled:opacity-30"
        onClick={() => setZoomLevel(zoomLevel - 10)}
        disabled={zoomLevel <= 50}
      >
        <FaSearchMinus />
      </button>
      <div className="zoom-panel-input-wrap flex items-center bg-white/10! rounded-md border border-white/20! px-1.5 h-9">
        <input
          className="zoom-panel-input w-11 bg-transparent! border-none! text-white! text-sm! text-right outline-none h-auto [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0"
          type="number"
          min={50}
          max={300}
          step={10}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleInputCommit();
          }}
        />
        <span className="zoom-panel-pct text-white/80! text-[13px] ml-px">%</span>
      </div>
      <button
        className="zoom-panel-btn flex items-center justify-center w-9 h-9 rounded-lg border border-white/20 bg-white/10 text-sm cursor-pointer active:bg-white/25 disabled:opacity-30"
        onClick={() => setZoomLevel(zoomLevel + 10)}
        disabled={zoomLevel >= 300}
      >
        <FaSearchPlus />
      </button>
      <button
        className="zoom-panel-close flex items-center justify-center w-7 h-7 rounded-full border-none bg-white/15 text-white/70 text-xs cursor-pointer ml-1 active:bg-white/30"
        onClick={() => setZoomPanelOpen(false)}
        title="Close"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default ZoomPanel;
