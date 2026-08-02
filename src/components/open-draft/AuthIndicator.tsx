/**
 * AuthIndicator — compact badge shown in the MenuBar.
 *
 *   Signed in  → avatar + displayName (click → Settings → Account)
 *   Anonymous  → "Local only" chip (click → open login dialog)
 *
 * The point is to answer the user's question at a glance: "am I saving to the
 * server or just to this device?" — matching the user's requirement that the
 * app works offline without login but shows status clearly.
 */

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { FaCloud, FaUserCircle } from 'react-icons/fa'
import { useSettingsStore } from '@/stores/settingsStore'
import { performLogout } from '@/services/collabAuth'
import CollabLoginDialog from './CollabLoginDialog'

const AuthIndicator: React.FC = () => {
  const collabAuth = useSettingsStore((s) => s.collabAuth)
  const authVerified = useSettingsStore((s) => s.authVerified)
  const [loginOpen, setLoginOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuRect, setMenuRect] = useState<{
    top: number
    right: number
  } | null>(null)

  // Only show "signed in" once the server has confirmed the token. A stored
  // token that hasn't been verified (offline launch, server down) reads as
  // "Local only" — the user hasn't actually been authenticated this session.
  const signedIn = Boolean(
    collabAuth.accessToken && collabAuth.user && authVerified,
  )

  // Recompute the dropdown's anchor position whenever it opens, and on
  // resize/scroll so it stays attached to the button. The dropdown is
  // portaled to <body> with position: fixed so the menu-bar's
  // overflow:hidden on mobile (added for horizontal scroll) doesn't clip it.
  useLayoutEffect(() => {
    if (!menuOpen) return
    const update = () => {
      const r = buttonRef.current?.getBoundingClientRect()
      if (!r) return
      setMenuRect({
        top: r.bottom + 4,
        right: Math.max(8, window.innerWidth - r.right),
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [menuOpen])

  // Close on outside click / tap. onMouseLeave doesn't fire on touch devices,
  // which is why this menu was unreachable on Android/iOS — now it closes on
  // any pointer interaction outside the menu or trigger.
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: PointerEvent) => {
      const t = e.target as Node | null
      if (!t) return
      if (menuRef.current?.contains(t)) return
      if (buttonRef.current?.contains(t)) return
      setMenuOpen(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [menuOpen])

  if (!signedIn) {
    return (
      <>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 bg-transparent border border-(--fd-border) text-(--fd-text-muted) py-0.75 px-2.5 rounded-xl text-xs cursor-pointer whitespace-nowrap leading-[1.2] max-w-55 italic hover:text-(--fd-text) hover:border-white/25"
          onClick={() => setLoginOpen(true)}
          title="Working offline — click to sign in and save to the server"
        >
          <FaCloud style={{ opacity: 0.6 }} />
          <span>Local only</span>
        </button>
        {loginOpen && (
          <CollabLoginDialog
            onClose={() => setLoginOpen(false)}
            onSuccess={() => setLoginOpen(false)}
          />
        )}
      </>
    )
  }

  const user = collabAuth.user!
  const initial = (user.displayName || user.email || '?')
    .charAt(0)
    .toUpperCase()

  return (
    <div className="inline-flex relative items-center">
      <button
        ref={buttonRef}
        type="button"
        className={`inline-flex items-center gap-1.5 bg-transparent border py-0.75 px-2.5 rounded-xl text-xs cursor-pointer whitespace-nowrap leading-[1.2] max-w-55 text-(--fd-text) hover:border-white/25 ${user.emailVerified ? 'border-(--fd-border)' : 'border-[#c97] text-[#eb8]'}`}
        onClick={() => setMenuOpen((v) => !v)}
        title={
          user.emailVerified
            ? `Signed in as ${user.displayName}`
            : 'Email not verified — saving disabled'
        }
      >
        <span
          className="w-5 h-5 rounded-full bg-(--fd-accent) text-white text-[11px] font-semibold inline-flex items-center justify-center"
          aria-hidden="true"
        >
          {initial}
        </span>
        <span className="max-w-30 overflow-hidden text-ellipsis">
          {user.displayName || user.email}
        </span>
        {!user.emailVerified && (
          <span className="bg-[#c97] px-1.25 py-px rounded-lg text-[#111] text-[10px] uppercase">
            verify
          </span>
        )}
      </button>
      {menuOpen &&
        menuRect &&
        createPortal(
          <div
            ref={menuRef}
            className="min-w-45 bg-(--fd-dropdown-bg) text-(--fd-text) border border-(--fd-border) rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.35)] py-1 z-1200 max-[768px]:min-w-55"
            role="menu"
            style={{
              position: 'fixed',
              top: menuRect.top,
              right: menuRect.right,
            }}
          >
            <button
              type="button"
              className="flex items-center gap-2 w-full text-left bg-transparent border-0 text-(--fd-text) py-2 px-3 text-[13px] cursor-pointer hover:bg-[var(--fd-hover,rgba(127,127,127,0.15))] max-[768px]:min-h-11 max-[768px]:py-3 max-[768px]:px-3.5 max-[768px]:text-sm"
              onClick={() => {
                setMenuOpen(false)
                navigate('/settings')
              }}
            >
              <FaUserCircle /> Account settings
            </button>
            <button
              type="button"
              className="flex items-center gap-2 w-full text-left bg-transparent border-0 text-(--fd-text) py-2 px-3 text-[13px] cursor-pointer hover:bg-[var(--fd-hover,rgba(127,127,127,0.15))] max-[768px]:min-h-11 max-[768px]:py-3 max-[768px]:px-3.5 max-[768px]:text-sm"
              onClick={async () => {
                setMenuOpen(false)
                await performLogout()
              }}
            >
              Sign out
            </button>
          </div>,
          document.body,
        )}
    </div>
  )
}

export default AuthIndicator
