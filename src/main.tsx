import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { SidebarProvider } from './components/ui/sidebar.tsx'
import { TooltipProvider } from './components/ui/tooltip.tsx'

async function init() {
  // Apply saved theme before first render to avoid flash
  const savedTheme = localStorage.getItem('opendraft:theme') || 'dark'
  document.documentElement.setAttribute('data-theme', savedTheme)

  // Android needs viewport-fit=cover and explicit safe-area padding
  if (/android/i.test(navigator.userAgent)) {
    document.documentElement.classList.add('android')
    const vp = document.querySelector('meta[name="viewport"]')
    if (vp)
      vp.setAttribute(
        'content',
        vp.getAttribute('content') + ', viewport-fit=cover',
      )
  }

  // Track the visual viewport height as a CSS variable so dialogs/overlays can
  // shrink when the soft keyboard appears. Android WebView's `dvh` unit is
  // unreliable for keyboard insets, but `visualViewport.height` is accurate.
  const updateViewportHeight = () => {
    const vv = window.visualViewport
    const h = vv ? vv.height : window.innerHeight
    document.documentElement.style.setProperty('--vv-height', `${h}px`)
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateViewportHeight)
    window.visualViewport.addEventListener('scroll', updateViewportHeight)
  }
  window.addEventListener('resize', updateViewportHeight)
  updateViewportHeight()

  // Clear the loading-timeout diagnostic (and remove overlay if it fired early)
  if ((window as any)._renderTimeout)
    clearTimeout((window as any)._renderTimeout)
  const fatalOverlay = document.getElementById('_fatal')
  if (fatalOverlay) fatalOverlay.remove()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SidebarProvider>
        <TooltipProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TooltipProvider>
      </SidebarProvider>
    </StrictMode>,
  )
}

init().catch((err) => {
  console.error('Fatal init error:', err)
  const d = document.createElement('div')
  d.style.cssText =
    'position:fixed;top:0;right:0;bottom:0;left:0;z-index:99999;background:#1a1a2e;color:#ff6b6b;font:14px/1.6 monospace;padding:40px;white-space:pre-wrap;'
  d.textContent =
    'OpenDraft failed to start:\n\n' +
    (err?.stack || err?.message || String(err))
  document.body.appendChild(d)
})
