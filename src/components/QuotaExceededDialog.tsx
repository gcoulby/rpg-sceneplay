/**
 * QuotaExceededDialog — shown when the backend returns 402 quota_exceeded.
 * The actual upgrade flow (Stripe, tier picker) lives in OpenDraft-Pro. Core
 * only shows the "limit reached" message and a pluggable "Upgrade" action:
 * Pro registers an upgrade handler via the plugin registry, and we invoke
 * it here when present.
 */

import React from 'react';
import type { QuotaErrorDetail } from '../services/api';
import { pluginRegistry } from '../plugins/registry';

interface QuotaExceededDialogProps {
  detail: QuotaErrorDetail;
  onClose: () => void;
}

const QuotaExceededDialog: React.FC<QuotaExceededDialogProps> = ({ detail, onClose }) => {
  // Pro can register an upgrade handler; core has none, so the button hides.
  const upgradeHandler = (pluginRegistry as any).getUpgradeHandler?.() as
    | (() => void)
    | undefined;

  return (
    <div className="dialog-overlay fixed inset-x-0 top-0 z-3000 flex items-start justify-center h-(--vv-height,100dvh) px-4 pt-[5vh] pb-4 overflow-y-auto bg-black/50" onClick={onClose}>
      <div
        className="dialog-box flex flex-col min-w-80 max-w-105 max-h-[calc(var(--vv-height,100dvh)-48px)] bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0">Free plan limit reached</div>
        <div className="dialog-body p-5 overflow-y-auto flex-1">
          <p className="mb-3">{detail.message}</p>
          <p className="m-0 text-[13px] text-(--fd-text-muted)">
            You have <strong>{detail.current}</strong> of <strong>{detail.limit}</strong> files on the{' '}
            <strong>{detail.current_plan}</strong> plan.
          </p>
        </div>
        <div className="dialog-footer flex items-center gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0">
          <div className="flex-1" />
          <button className="dialog-btn h-8.5 px-4.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover)" onClick={onClose}>Close</button>
          {upgradeHandler && (
            <button
              className="dialog-btn dialog-btn-primary h-8.5 px-4.5 bg-(--fd-accent) border border-(--fd-accent) rounded cursor-pointer text-sm text-white hover:opacity-90"
              onClick={() => { upgradeHandler(); onClose(); }}
            >
              Upgrade
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotaExceededDialog;
