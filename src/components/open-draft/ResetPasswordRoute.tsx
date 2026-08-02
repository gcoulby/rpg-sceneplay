/**
 * /reset-password?token=… landing page.
 *
 * The forgot-password email carries a link here with an opaque token. The
 * user picks a new password; we POST {token, newPassword} to /reset-password.
 * On success the server has already revoked every refresh token, so we bounce
 * the user to the app and let the normal sign-in flow take over.
 */

import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { collabAuthApi } from '@/services/collabAuth'
import { showToast } from './Toast'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const ResetPasswordRoute: React.FC = () => {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  // Missing token = the user got here via something other than the email link.
  // We still render the form so the user can read why it's broken.
  const missingToken = !token

  const validate = (): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain an uppercase letter, a lowercase letter, and a digit.'
    }
    if (password !== confirm) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async () => {
    if (missingToken) return
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setStatus('submitting')
    try {
      await collabAuthApi.resetPassword(token, password)
      setStatus('success')
      showToast(
        'Password updated. You can sign in with your new password.',
        'success',
      )
      setTimeout(() => navigate('/', { replace: true }), 1500)
    } catch (err: any) {
      setStatus('error')
      setError(err?.message || 'Could not reset password.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="flex justify-center items-center p-6 min-h-[70vh]">
      <div
        className="max-w-[440px] w-full p-6 rounded-lg bg-(--fd-surface,#1e1e1e) text-(--fd-text,#eee) shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
        onKeyDown={handleKeyDown}
      >
        <h2 className="mt-0">Choose a new password</h2>

        {missingToken ? (
          <>
            <p className="text-(--fd-text-muted,#aaa)">
              This reset link is missing its token. Request a new password-reset
              email from the sign-in screen.
            </p>
            <button
              className="dialog-btn dialog-btn-primary mt-3 h-8.5 px-4.5 bg-(--fd-accent) border border-(--fd-accent) text-white rounded cursor-pointer text-sm hover:opacity-90"
              onClick={() => navigate('/', { replace: true })}
            >
              Go to sign in
            </button>
          </>
        ) : status === 'success' ? (
          <>
            <p>Your password was updated. Redirecting to the sign-in screen…</p>
          </>
        ) : (
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-(--fd-text-muted)">
                New Password
              </label>
              <div className="relative flex items-center">
                <input
                  className="dialog-input h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border pr-[38px] focus:border-(--fd-accent)"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, upper + lower + digit"
                  autoFocus
                  disabled={status === 'submitting'}
                />
                <button
                  type="button"
                  className="absolute right-1 flex items-center justify-center w-[30px] h-[30px] bg-transparent border-none cursor-pointer text-(--fd-text-muted) text-sm rounded p-0 hover:text-(--fd-text) hover:bg-(--fd-toolbar-hover)"
                  onClick={() => setShowPw(!showPw)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-(--fd-text-muted)">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <input
                  className="dialog-input h-8.5 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2.5 text-sm outline-none w-full box-border pr-[38px] focus:border-(--fd-accent)"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={status === 'submitting'}
                />
                <button
                  type="button"
                  className="absolute right-1 flex items-center justify-center w-[30px] h-[30px] bg-transparent border-none cursor-pointer text-(--fd-text-muted) text-sm rounded p-0 hover:text-(--fd-text) hover:bg-(--fd-toolbar-hover)"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && <p className="m-0 text-[#e57373] text-[13px]">{error}</p>}

            <button
              className="dialog-btn dialog-btn-primary mt-1 self-start min-w-[160px] h-9 text-sm bg-(--fd-accent) text-white border-none rounded-md font-semibold cursor-pointer hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!password || !confirm || status === 'submitting'}
            >
              {status === 'submitting' ? 'Updating…' : 'Update password'}
            </button>
            <button
              className="dialog-btn h-8.5 px-4.5 bg-(--fd-toolbar-bg) text-(--fd-text) border border-(--fd-border) rounded cursor-pointer text-sm hover:bg-(--fd-toolbar-hover) disabled:opacity-50 disabled:cursor-default"
              onClick={() => navigate('/', { replace: true })}
              disabled={status === 'submitting'}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordRoute
