/**
 * Shown at startup when the Tauri SQLite plugin is unavailable and we have
 * dropped into file-based fallback storage.  Displays the underlying error
 * so the user can report it, and explains that the app is still safe to use.
 */

import React from 'react';
import { useStorageStatusStore } from '../stores/storageStatusStore';

const StorageFallbackDialog: React.FC = () => {
  const { mode, errorReason, acknowledged, acknowledge } = useStorageStatusStore();

  if (acknowledged) return null;
  if (mode === 'sqlite' || mode === 'http') return null;

  const isFile = mode === 'file-fallback';
  const heading = isFile
    ? 'Switched to file-based storage'
    : 'Local database unavailable';
  const explanation = isFile
    ? 'OpenDraft could not open its local database, so your projects are now being saved as individual files in your app data folder. You can keep working — saving and loading still work normally, but version history is disabled until the database is reachable again.'
    : 'OpenDraft could not open its local database and the file-based fallback also failed. Your changes will be saved in the browser only and may be lost if storage is cleared.';

  return (
    <div className="dialog-overlay fixed left-0 top-0 right-0 bg-black/50 z-3000 flex items-start justify-center h-(--vv-height,100dvh) pt-[5vh] px-4 pb-4 overflow-y-auto" onClick={acknowledge}>
      <div
        className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,.6)] min-w-[320px] max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="dialog-header py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0">{heading}</div>
        <div className="dialog-body p-5 overflow-y-auto flex-1">
          <p style={{ margin: '0 0 12px' }}>{explanation}</p>
          {errorReason && (
            <>
              <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--fd-text-muted)' }}>
                Underlying error:
              </p>
              <pre
                style={{
                  margin: 0,
                  padding: '8px 10px',
                  fontSize: 12,
                  background: '#f4f4f4',
                  color: '#1a1a1a',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: 160,
                  overflow: 'auto',
                }}
              >
                {errorReason}
              </pre>
            </>
          )}
        </div>
        <div className="dialog-footer flex items-center gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0">
          <div style={{ flex: 1 }} />
          <button
            className="dialog-btn dialog-btn-primary h-8.5 px-4.5 bg-(--fd-accent) border border-(--fd-accent) text-white rounded cursor-pointer text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-default"
            onClick={acknowledge}
            autoFocus
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default StorageFallbackDialog;
