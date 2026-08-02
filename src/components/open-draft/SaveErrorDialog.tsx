/**
 * Blocking modal shown when a save (auto-save, manual save, metadata save,
 * or save-on-close) fails.  The user must acknowledge before continuing so
 * unsaved-data risk is impossible to miss.
 */

import React from 'react'
import { useSaveErrorStore } from '@/stores/saveErrorStore'

const SOURCE_LABELS: Record<string, string> = {
  'auto-save': 'Auto-save failed',
  'metadata-save': 'Save failed',
  'manual-save': 'Save failed',
  'save-on-close': 'Could not save before closing',
}

const SaveErrorDialog: React.FC = () => {
  const error = useSaveErrorStore((s) => s.error)
  const clearError = useSaveErrorStore((s) => s.clearError)

  if (!error) return null

  const heading = SOURCE_LABELS[error.source] || 'Save failed'
  const localTime = new Date(error.at).toLocaleTimeString()

  return (
    <div
      className="dialog-overlay fixed left-0 top-0 right-0 bg-black/50 z-3000 flex items-start justify-center h-(--vv-height,100dvh) pt-[5vh] px-4 pb-4 overflow-y-auto"
      onClick={clearError}
    >
      <div
        className="dialog-box max-w-120 bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[320px] max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        <div className="dialog-header py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0">
          {heading}
        </div>
        <div className="flex-1 p-5 overflow-y-auto dialog-body">
          <p className="mb-3">
            OpenDraft could not save your changes. Your work is still in the
            editor — please copy anything important before closing the app or
            reloading the window.
          </p>
          <p className="mb-1.5 text-[13px] text-(--fd-text-muted)">
            Failure at {localTime}:
          </p>
          <pre className="bg-[#f4f4f4] m-0 px-2.5 py-2 border border-[#ddd] rounded max-h-40 overflow-auto text-[#1a1a1a] text-xs wrap-break-word whitespace-pre-wrap">
            {error.message}
          </pre>
        </div>
        <div className="dialog-footer flex items-center gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0">
          <div className="flex-1" />
          <button
            className="dialog-btn dialog-btn-primary h-8.5 px-4.5 bg-(--fd-accent) border border-(--fd-accent) text-white rounded cursor-pointer text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-default"
            onClick={clearError}
            autoFocus
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  )
}

export default SaveErrorDialog
