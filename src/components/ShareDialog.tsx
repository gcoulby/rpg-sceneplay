import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { CollabSession } from '../services/api';
import { useSettingsStore } from '../stores/settingsStore';
import { collabAuthApi, isCollabAuthenticated } from '../services/collabAuth';
import { showToast } from './Toast';

interface ShareDialogProps {
  projectId: string;
  scriptId: string;
  scriptTitle: string;
  isCollabActive: boolean;
  onStartCollab: (session: CollabSession) => void;
  onClose: () => void;
}

const EXPIRY_OPTIONS = [
  { label: '30 min', hours: 0.5 },
  { label: '1 hour', hours: 1 },
  { label: '6 hours', hours: 6 },
  { label: '12 hours', hours: 12 },
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
  { label: '7 days', hours: 168 },
  { label: '30 days', hours: 720 },
];

function formatExpiry(expiresAt: string): string {
  if (!expiresAt) return '';
  const exp = new Date(expiresAt);
  const now = new Date();
  const diffMs = exp.getTime() - now.getTime();
  if (diffMs <= 0) return 'Expired';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m left`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h left`;
  return `${Math.floor(diffHrs / 24)}d left`;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  projectId,
  scriptId,
  scriptTitle,
  isCollabActive,
  onStartCollab,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [expiryHours, setExpiryHours] = useState(
    useSettingsStore.getState().defaultInviteExpiry || 1,
  );
  const [sessions, setSessions] = useState<CollabSession[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Track whether pointerdown started on the overlay itself (not on the dialog box).
  // On iPad, keyboard dismissal can shift the dialog, causing a synthetic click
  // to land on the overlay even though the user tapped inside the dialog.
  const overlayPointerDown = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    // Only load existing sessions if collab is already active (host inviting more guests).
    // When starting a fresh session, don't show stale invitations from previous sessions.
    if (isCollabActive) {
      api.listCollabSessions(projectId, scriptId)
        .then(setSessions)
        .catch(() => {});
    }
  }, [projectId, scriptId, isCollabActive]);

  const handleGenerate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Verify user is still authenticated (also clears expired tokens)
    if (!isCollabAuthenticated()) {
      showToast('Session expired — please log in again (Settings → Collaboration)', 'error');
      onClose();
      return;
    }

    setGenerating(true);
    try {
      // Verify the collab server is reachable before creating an invite
      const serverOk = await collabAuthApi.testConnection();
      if (!serverOk) {
        showToast('Cannot reach the collaboration server. Make sure it is running.', 'error');
        setGenerating(false);
        return;
      }

      // Reuse the session nonce from the first invite so all guests join the same Yjs room
      const existingNonce = sessions.length > 0 ? sessions[0].session_nonce || '' : '';
      const session = await api.createCollabInvite(projectId, scriptId, trimmed, role, expiryHours, existingNonce);
      setSessions((prev) => [...prev, session]);
      setName('');
      inputRef.current?.focus();
      showToast(`Invite created for ${trimmed}`, 'success');

      // When first invite is created, start collab for the owner too
      if (!isCollabActive) {
        onStartCollab(session);
      }
    } catch (err) {
      showToast(`Failed to create invite: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (token: string) => {
    try {
      await api.revokeCollabSession(token);
      setSessions((prev) => prev.filter((s) => s.token !== token));
    } catch {
      showToast('Failed to revoke invite', 'error');
    }
  };

  const handleRevokeAll = async () => {
    try {
      await api.revokeAllCollabSessions(projectId, scriptId);
      setSessions([]);
    } catch {
      showToast('Failed to revoke invites', 'error');
    }
  };

  const copyLink = async (token: string) => {
    // Build invite link from the collab server URL in Settings.
    // The guest will open this on the collab server (which may be on a different
    // machine than the frontend/backend).
    const collabWs = useSettingsStore.getState().collabServerUrl;
    const collabHttp = collabWs.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
    const link = `${collabHttp}/collab/${token}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        // Fallback for non-secure contexts (HTTP)
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      showToast('Failed to copy link to clipboard', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleGenerate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed left-0 top-0 right-0 bg-black/50 z-[3000] flex items-start justify-center h-[var(--vv-height,100dvh)] pt-[5vh] px-4 pb-4 overflow-y-auto max-[480px]:pt-[env(safe-area-inset-top,0px)] max-[480px]:px-0 max-[480px]:pb-0"
      onPointerDown={(e) => { overlayPointerDown.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (e.target === e.currentTarget && overlayPointerDown.current) onClose(); overlayPointerDown.current = false; }}
    >
      <div
        className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[320px] max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col max-[768px]:min-w-0 max-[768px]:max-w-none max-[768px]:w-[calc(100vw-32px-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] max-[480px]:w-screen! max-[480px]:max-w-screen! max-[480px]:rounded-t-none max-[480px]:rounded-b-xl max-[480px]:max-h-[60vh] max-[480px]:overflow-y-auto"
        style={{ maxWidth: 560 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="dialog-header px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base shrink-0">
          Collaborate — {scriptTitle}
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {isCollabActive && (
            <div className="collab-status-badge flex items-center gap-2 px-3.5 py-2.5 mb-3.5 rounded-md bg-[#1a3a2a] text-[#4ade80] text-sm font-medium">
              <span className="collab-dot" /> Live collaboration active
            </div>
          )}

          <p className="mb-3 text-sm text-(--fd-text-muted)">
            Generate a link for each collaborator. They can open the link to join a live editing session.
          </p>

          <label className="block text-sm text-(--fd-text-muted) mb-1">Invite a collaborator</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className="flex-1 h-[34px] bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none focus:border-(--fd-accent)"
              placeholder="Person's name (e.g., John)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={generating}
              aria-label="Collaborator name"
            />
            <button
              className="h-[34px] px-[18px] rounded cursor-pointer text-sm border bg-(--fd-accent) border-(--fd-accent) text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-default"
              onClick={handleGenerate}
              disabled={!name.trim() || generating}
            >
              {generating ? 'Creating...' : 'Invite'}
            </button>
          </div>

          {/* Role and expiry options */}
          <div className="flex gap-6 mt-1">
            <div className="flex-1">
              <label className="block text-sm text-(--fd-text-muted) mb-1 mt-3">Permission</label>
              <div className="flex gap-4 mt-1">
                <label className="collab-radio-label flex items-center gap-1.5 text-[13px] text-(--fd-text) cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="editor"
                    checked={role === 'editor'}
                    onChange={() => setRole('editor')}
                  />
                  Co-Edit
                </label>
                <label className="collab-radio-label flex items-center gap-1.5 text-[13px] text-(--fd-text) cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="viewer"
                    checked={role === 'viewer'}
                    onChange={() => setRole('viewer')}
                  />
                  Read Only
                </label>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm text-(--fd-text-muted) mb-1 mt-3">Token Valid For</label>
              <select
                className="w-full mt-1 h-[34px] bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none box-border focus:border-(--fd-accent)"
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                aria-label="Invite expiry duration"
              >
                {EXPIRY_OPTIONS.map((opt) => (
                  <option key={opt.hours} value={opt.hours}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sessions.length > 0 && (
            <div className="max-h-[280px] overflow-y-auto">
              <label className="block text-sm text-(--fd-text-muted) mb-1 mt-4">
                Active invites ({sessions.length})
              </label>
              {sessions.map((s) => (
                <div key={s.token} className="flex items-center justify-between px-3 py-2.5 mt-2 rounded-md bg-(--fd-input-bg) gap-2.5">
                  <div className="flex flex-col gap-[3px] min-w-0">
                    <span className="font-semibold text-sm text-(--fd-text)">
                      {s.collaborator_name}
                      <span className={`collab-role-${s.role || 'editor'} inline-block text-[10px] px-1.5 py-px rounded-[3px] ml-2 font-medium uppercase tracking-[0.3px] ${s.role === 'viewer' ? 'bg-[rgba(255,183,77,0.15)] text-[#ffb74d]' : 'bg-[rgba(74,158,255,0.15)] text-[#4a9eff]'}`}>
                        {s.role === 'viewer' ? 'Read Only' : 'Co-Edit'}
                      </span>
                    </span>
                    <span className="text-[13px] text-(--fd-text-muted)">
                      {new Date(s.created_at).toLocaleString()}
                      {s.expires_at && (
                        <span className="text-[#888]"> · {formatExpiry(s.expires_at)}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      className="collab-copy-btn py-1.5 px-3 rounded border border-(--fd-border) bg-transparent text-(--fd-text) text-[13px] cursor-pointer whitespace-nowrap hover:bg-(--fd-toolbar-hover)"
                      onClick={() => copyLink(s.token)}
                      title="Copy invite link"
                      aria-label={
                        copiedToken === s.token
                          ? `Copied invite link for ${s.collaborator_name}`
                          : `Copy invite link for ${s.collaborator_name}`
                      }
                    >
                      {copiedToken === s.token ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button
                      className="collab-revoke-btn py-1.5 px-3 rounded border border-[#5a3030] bg-transparent text-[#e06060] text-[13px] cursor-pointer whitespace-nowrap hover:bg-[#3a2020]"
                      onClick={() => handleRevoke(s.token)}
                      title="Revoke this invite"
                      aria-label={`Revoke invite for ${s.collaborator_name}`}
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dialog-footer flex items-center gap-2 px-5 py-3.5 border-t border-(--fd-border) shrink-0">
          {sessions.length > 1 && (
            <button
              className="dialog-btn h-[34px] px-[18px] bg-(--fd-toolbar-bg) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover)"
              style={{ color: '#e06060' }}
              onClick={handleRevokeAll}
            >
              Revoke All
            </button>
          )}
          <div className="flex-1" />
          <button className="dialog-btn h-[34px] px-[18px] bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover)" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
