import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Minimal config for unit tests. Deliberately does NOT load the app's vite
// plugins (react / legacy transpile) — these are pure-logic tests that need no
// DOM or JSX transform. App code never imports vitest, so this is dev-only and
// has no effect on the production build.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Shims the handful of browser globals that stores read at module scope
    // (localStorage). Keeps the node environment instead of pulling in jsdom.
    setupFiles: ['./src/test/setup.ts'],
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
