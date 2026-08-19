import * as pdfjsLib from 'pdfjs-dist'

// Must run before any getDocument()/rendering call. Confirmed working under
// this project's Vite build in the Phase 0 feasibility spike — the worker
// resolves through Vite's dependency pre-bundling, no bundler config needed.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href

export { pdfjsLib }
