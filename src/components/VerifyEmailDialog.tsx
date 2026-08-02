/**
 * VerifyEmailDialog — OTP code entry after registration or when a protected
 * action returns 403 email_not_verified. Also used as the target for the
 * magic-link /verify route via preset props.
 */

import React, { useState } from 'react';
import { collabAuthApi, handleAuthResponse } from '../services/collabAuth';
import { useSettingsStore } from '../stores/settingsStore';
import { showToast } from './Toast';

interface VerifyEmailDialogProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const VerifyEmailDialog: React.FC<VerifyEmailDialogProps> = ({ onClose, onSuccess }) => {
  const user = useSettingsStore((s) => s.collabAuth.user);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      showToast('Enter the 6-digit code from your email', 'error');
      return;
    }
    setLoading(true);
    try {
      // Prefer the authenticated /verify-email if we already have a token,
      // otherwise fall back to the unauthenticated /verify-email-link with
      // the user's email from local state.
      if (useSettingsStore.getState().collabAuth.accessToken) {
        await collabAuthApi.verifyEmail(code.trim());
        // Refresh cached user so emailVerified flips to true.
        const refreshed = await collabAuthApi.getMe();
        const current = useSettingsStore.getState().collabAuth;
        useSettingsStore.getState().setCollabAuth({ ...current, user: refreshed });
      } else {
        if (!user?.email) {
          showToast('No account in progress. Please sign up again.', 'error');
          return;
        }
        const resp = await collabAuthApi.verifyEmailLink(user.email, code.trim());
        handleAuthResponse(resp);
      }
      showToast('Email verified — you can now save files', 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await collabAuthApi.resendVerification();
      showToast('Verification email sent', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not resend', 'error');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className="fixed left-0 top-0 right-0 bg-black/50 z-[3000] flex items-start justify-center h-[var(--vv-height,100dvh)] pt-[5vh] px-4 pb-4 overflow-y-auto max-[480px]:pt-[env(safe-area-inset-top,0px)] max-[480px]:px-0 max-[480px]:pb-0"
      onClick={onClose}
    >
      <div
        className="dialog-box bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.6)] min-w-[320px] max-h-[calc(var(--vv-height,100dvh)-48px)] flex flex-col max-[768px]:min-w-0 max-[768px]:max-w-none max-[768px]:w-[calc(100vw-32px-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px))] max-[480px]:w-screen! max-[480px]:max-w-screen! max-[480px]:rounded-t-none max-[480px]:rounded-b-xl max-[480px]:max-h-[60vh] max-[480px]:overflow-y-auto"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleVerify();
          else if (e.key === 'Escape') onClose();
        }}
      >
        <div className="dialog-header px-5 py-3.5 border-b border-(--fd-border) font-semibold text-base shrink-0">Verify your email</div>
        <div className="p-5 overflow-y-auto flex-1">
          <p className="mb-3 text-sm text-(--fd-text-muted)">
            We sent a 6-digit code to {user?.email ? <strong>{user.email}</strong> : 'your email'}.
            Enter it below, or click the activation link in the email.
          </p>
          <input
            className="h-[34px] bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 outline-none w-full box-border tracking-[6px] text-xl text-center focus:border-(--fd-accent)"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            autoFocus
          />
          <button
            className="min-w-[160px] h-9 text-sm bg-(--fd-accent) text-white border-none rounded-md font-semibold cursor-pointer hover:opacity-[0.85] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            style={{ marginTop: 12 }}
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <div className="text-center mt-3">
            <button
              className="dialog-btn h-[34px] px-[18px] bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer hover:bg-(--fd-toolbar-hover)"
              onClick={handleResend}
              disabled={resendLoading || !useSettingsStore.getState().collabAuth.accessToken}
              style={{ fontSize: 13 }}
            >
              {resendLoading ? 'Sending…' : 'Resend code'}
            </button>
          </div>
        </div>
        <div className="dialog-footer flex items-center gap-2 px-5 py-3.5 border-t border-(--fd-border) shrink-0">
          <div className="flex-1" />
          <button className="dialog-btn h-[34px] px-[18px] bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover)" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailDialog;
