import * as pdfjsLib from 'pdfjs-dist'

// Must run before any getDocument()/rendering call. Confirmed working under
// this project's Vite build in the Phase 0 feasibility spike — the worker
// resolves through Vite's dependency pre-bundling, no bundler config needed.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href

// Needed for AcroForm push buttons/calculated fields that rely on a JS
// action (common in pre-made fillable character sheets) — without a
// sandbox bundle, `PDFViewer`'s `enableScripting` has nothing to run
// against and those buttons silently do nothing on click. `wasmUrl` must
// point at the directory containing `quickjs-eval.js`/`.wasm` (ships in
// pdfjs-dist's own `wasm/` dir, separate from `build/`) — the sandbox
// module's own default ("../web/wasm/") assumes Mozilla's reference
// viewer's file layout, not this one, and resolves to a 404 otherwise.
export const pdfSandboxBundleSrc = new URL(
  'pdfjs-dist/build/pdf.sandbox.mjs',
  import.meta.url,
).href
// `QuickJSSandbox` builds its own request URLs by string-concatenating
// `wasmUrl` with a hardcoded filename (`${wasmUrl}quickjs-eval.js`) at
// runtime, inside a pre-built pdfjs-dist module Vite doesn't transform — so
// unlike `pdf.worker.mjs`/`pdf.sandbox.mjs` above, this can't go through
// Vite's `new URL('pkg/file', import.meta.url)` asset-rewriting (that only
// rewrites literal, statically-visible file references, and production
// build renames/hashes the file besides). Instead `quickjs-eval.js`/`.wasm`
// are copied verbatim into `public/pdfjs-wasm/` (see that directory's
// contents — sourced from `node_modules/pdfjs-dist/wasm/`) so they're
// served at a stable, unhashed path in both dev and production.
export const pdfSandboxWasmUrl = `${import.meta.env.BASE_URL}pdfjs-wasm/`

export { pdfjsLib }
