/**
 * File operations — browser only.
 *
 * Save is an anchor download to the browser's Downloads folder; open is an
 * `<input type="file">` picker. The `filters` argument is accepted and ignored
 * for save (the browser decides where the download lands) and mapped to
 * `input.accept` for the open paths, which keeps the signature identical to
 * every existing caller.
 *
 * Automatic writes to a user-chosen file on disk are a different mechanism
 * entirely — see `providers/diskHandleProvider.ts`.
 */

interface FileFilter {
  name: string
  extensions: string[]
}

function acceptFromFilters(filters?: FileFilter[]): string | null {
  if (!filters) return null
  return filters.flatMap((f) => f.extensions.map((e) => `.${e}`)).join(',')
}

// ── Save ────────────────────────────────────────────────────────────────────

/**
 * Save data to a file via a browser download.
 * `_filters` is unused — the browser download has no format dialog — but the
 * parameter stays so exporters can keep passing their filter list unchanged.
 */
export async function saveFile(
  data: Uint8Array | string,
  defaultFilename: string,
  _filters?: FileFilter[],
): Promise<boolean> {
  const blob =
    typeof data === 'string'
      ? new Blob([data], { type: 'text/plain' })
      : new Blob([data] as BlobPart[])
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = defaultFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Delay revoke so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  return true
}

// ── Open (text) ─────────────────────────────────────────────────────────────

/** Open a text file. Returns { name, content } or null if the user cancelled. */
export function openTextFile(
  filters?: FileFilter[],
): Promise<{ name: string; content: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    const accept = acceptFromFilters(filters)
    if (accept) input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () =>
        resolve({ name: file.name, content: reader.result as string })
      reader.onerror = () => resolve(null)
      reader.readAsText(file)
    }
    input.click()
  })
}

// ── Open (binary) ───────────────────────────────────────────────────────────

/** Open a binary file. Returns { name, content } or null if cancelled. */
export function openBinaryFile(
  filters?: FileFilter[],
): Promise<{ name: string; content: ArrayBuffer } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    const accept = acceptFromFilters(filters)
    if (accept) input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const reader = new FileReader()
      reader.onload = () =>
        resolve({ name: file.name, content: reader.result as ArrayBuffer })
      reader.onerror = () => resolve(null)
      reader.readAsArrayBuffer(file)
    }
    input.click()
  })
}
