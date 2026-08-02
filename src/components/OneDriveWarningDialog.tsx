/**
 * Warns the user when OpenDraft's app data folder is under OneDrive sync.
 *
 * OneDrive grabs SQLite WAL/journal files mid-write, which on Windows
 * causes silent save failures. This dialog runs at startup once we've
 * resolved the app data path, lets the user dismiss permanently, and
 * points them at a fix.
 */

import React, { useEffect, useState } from 'react';
import { isDesktopTauri } from '../services/platform';

const DISMISS_KEY = 'opendraft.oneDriveWarning.dismissed';

const OneDriveWarningDialog: React.FC = () => {
  const [show, setShow] = useState(false);
  const [path, setPath] = useState<string>('');

  useEffect(() => {
    if (!isDesktopTauri()) return;
    if (typeof navigator === 'undefined' || !/Windows/i.test(navigator.userAgent)) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    let cancelled = false;
    (async () => {
      try {
        const { collectDiagnostics } = await import('../services/diagnostics');
        const r = await collectDiagnostics();
        if (cancelled) return;
        if (r.oneDriveSuspect && r.appDataDir) {
          setPath(r.appDataDir);
          setShow(true);
        }
      } catch {
        // Diagnostics failure is harmless — never block startup.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!show) return null;

  const dismiss = () => setShow(false);
  const dismissForever = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div className="dialog-overlay" onClick={dismiss}>
      <div
        className="dialog-box max-w-[520px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="dialog-header">OneDrive interference detected</div>
        <div className="dialog-body">
          <p className="mb-3">
            OpenDraft's data folder is inside a OneDrive-synced location. This
            is a known cause of <strong>silent save failures</strong>: OneDrive
            can grab the SQLite write-ahead log file in the middle of a save,
            corrupting the database and losing your latest edits.
          </p>
          <p className="mb-1.5 text-[13px] text-(--fd-text-muted)">
            Affected folder:
          </p>
          <pre
            className="mb-3 py-2 px-2.5 text-xs bg-[#f4f4f4] text-[#1a1a1a] border border-[#ddd] rounded whitespace-pre-wrap break-words"
          >
            {path}
          </pre>
          <p className="mb-1.5 font-semibold">How to fix:</p>
          <ol className="m-0 mb-0 ml-[18px] pl-0 text-[13px] leading-[1.6]">
            <li>Open OneDrive settings → Sync and backup → Manage backup.</li>
            <li>
              Turn off backup for the folder that contains the path above
              (typically Documents or Desktop), or exclude OpenDraft's app
              data folder explicitly.
            </li>
            <li>Restart OpenDraft.</li>
          </ol>
        </div>
        <div className="dialog-footer flex gap-2">
          <button className="dialog-btn" onClick={dismissForever}>
            Don't show again
          </button>
          <div className="flex-1" />
          <button className="dialog-btn dialog-btn-primary" onClick={dismiss} autoFocus>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default OneDriveWarningDialog;
