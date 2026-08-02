import React, { useState, useEffect, useRef } from 'react'
import { useEditorStore } from '../stores/editorStore'

interface GoToPageProps {
  onGoToPage: (page: number) => void
}

const GoToPage: React.FC<GoToPageProps> = ({ onGoToPage }) => {
  const { goToPageOpen, setGoToPageOpen, pageCount } = useEditorStore()
  const [pageNum, setPageNum] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (goToPageOpen && inputRef.current) {
      inputRef.current.focus()
      setPageNum('')
    }
  }, [goToPageOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') {
        e.preventDefault()
        setGoToPageOpen(true)
      }
      if (e.key === 'Escape' && goToPageOpen) {
        setGoToPageOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [goToPageOpen, setGoToPageOpen])

  const handleGo = () => {
    const num = parseInt(pageNum, 10)
    if (num >= 1 && num <= pageCount) {
      onGoToPage(num)
      setGoToPageOpen(false)
    }
  }

  if (!goToPageOpen) return null

  return (
    <div
      className=" text-(--fd-text-muted) fixed left-0 top-0 right-0 bg-black/50 z-[3000] flex items-start justify-center h-[var(--vv-height,100dvh)] pt-[5vh] px-4 pb-4 overflow-y-auto max-[480px]:pt-[env(safe-area-inset-top,0px)] max-[480px]:px-0 max-[480px]:pb-0"
      onClick={() => setGoToPageOpen(false)}
    >
      <div
        className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[320px] max-w-[400px] max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col max-[768px]:min-w-0 max-[768px]:max-w-none max-[768px]:w-[calc(100vw-32px-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] max-[480px]:w-screen! max-[480px]:max-w-screen! max-[480px]:rounded-t-none max-[480px]:rounded-b-xl max-[480px]:max-h-[60vh] max-[480px]:overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base shrink-0">
          Go to Page
        </div>
        <div className="flex-1 p-5 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-(--fd-text-muted)">
              Page number (1-{pageCount}):
            </label>
            <input
              ref={inputRef}
              className="h-9 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none focus:border-(--fd-accent) max-[768px]:h-10 max-[768px]:text-base"
              type="number"
              min={1}
              max={pageCount}
              value={pageNum}
              onChange={(e) => setPageNum(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGo()
              }}
            />
          </div>
        </div>
        <div className="dialog-actions flex justify-end gap-2 px-5 py-3.5 border-t border-(--fd-border) shrink-0">
          <button
            className="h-[34px] px-[18px] bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-menu-hover) max-[768px]:h-10"
            onClick={() => setGoToPageOpen(false)}
          >
            Cancel
          </button>
          <button
            className="h-[34px] px-[18px] rounded cursor-pointer text-sm border bg-(--fd-accent)! border-(--fd-accent)! text-white! hover:opacity-90 max-[768px]:h-10"
            onClick={handleGo}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  )
}

export default GoToPage
