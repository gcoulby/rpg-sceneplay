/**
 * Sceneplay native format — import/export utilities.
 *
 * A `.sceneplay` file contains the script metadata and TipTap content,
 * designed for lossless round-tripping. `.odraft` is the same schema under
 * the historical extension: both are read and written here, and both parse
 * identically.
 *
 * ## Versions
 *
 * - **v1** — `content` was whatever the caller passed. In practice File →
 *   Export passed the bare editor JSON, so notes, tags, beats and character
 *   profiles were silently dropped. Still readable.
 * - **v2** — `content` is the full `buildSaveContent()` payload (document plus
 *   every `_`-prefixed store key), `meta` carries provenance, and `assets` may
 *   embed the images the document references, base64-encoded inside a flat
 *   JSON document. Images live outside the document as `assetId` references,
 *   so without embedding them a restored script comes back with every image
 *   broken. Still readable (`parseSceneplayAny` sniffs for it).
 * - **v3** — `.sceneplay`/`.odraft` written going forward is a **zip
 *   archive** (`manifest.json` + `content.json` + `assets/<id>.bin`), the
 *   same pattern `.docx`/`.pptx` use. Base64 in JSON adds ~33% overhead and
 *   was never a good fit for binary payloads — this matters once assets grow
 *   beyond small images (e.g. embedded PDFs). `parseOdraft`/`serializeOdraft`
 *   (flat JSON) are kept as the legacy read/write path; `downloadOdraft` (the
 *   `.odraft` exporter) still writes flat JSON deliberately, as an explicit
 *   legacy-format export.
 */

/**
 * The metadata half of a saved script. Previously the server's `ScriptMeta`
 * row; kept as the serializer's input shape so the exported JSON schema is
 * unchanged. Only `title`/`author`/`color`/`page_count` are actually read.
 */
export interface ScriptMeta {
  id: string
  title: string
  author: string
  format: string
  created_at: string
  updated_at: string
  page_count: number
  size_bytes: number
  color: string
  pinned: boolean
  sort_order: number
  preview: string
}

import JSZip from 'jszip'
import { saveFile } from '../fileOps'

export const SCENEPLAY_VERSION = 3
/** Historical name for the same version number — kept so downstream callers
 *  that already import `ODRAFT_VERSION` don't have to be renamed. */
export const ODRAFT_VERSION = SCENEPLAY_VERSION

export const SCENEPLAY_EXTENSION = 'sceneplay'
export const ODRAFT_EXTENSION = 'odraft'

export type BackupKind = 'auto' | 'manual' | 'crash'

export interface OdraftAsset {
  id: string
  filename: string
  mime_type: string
  /** Base64-encoded bytes (no data: prefix). */
  data_base64: string
}

export interface OdraftMeta {
  title: string
  author: string
  color: string
  page_count: number
  /** Provenance — lets a restore offer "put it back where it came from". */
  project_id?: string | null
  script_id?: string | null
  project_title?: string
  app_version?: string
  backup_kind?: BackupKind
  /** True when images were deliberately left out (disabled, or over the cap). */
  assets_omitted?: boolean
}

interface OdraftFile {
  odraft_version: number
  format: 'opendraft-script'
  exported_at: string
  meta: OdraftMeta
  content: Record<string, unknown>
  assets?: OdraftAsset[]
}

export interface ParsedOdraft {
  meta: OdraftMeta
  content: Record<string, unknown>
  assets: OdraftAsset[]
  /** Version the file declared; 0 for a bare payload recovered by parseOdraftLoose. */
  version: number
}

export interface ExportOdraftOptions {
  assets?: OdraftAsset[]
  backupKind?: BackupKind
  projectId?: string | null
  scriptId?: string | null
  projectTitle?: string
  appVersion?: string
  assetsOmitted?: boolean
  /** Injectable for tests; defaults to now. */
  exportedAt?: string
}

/** True for either native extension — `.sceneplay` going forward, `.odraft`
 *  for files written by earlier builds. */
export function isSceneplayFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext === SCENEPLAY_EXTENSION || ext === ODRAFT_EXTENSION
}

/** The `meta` half of the envelope, shared by the flat-JSON and zip writers. */
function buildOdraftMeta(
  meta: ScriptMeta,
  options: ExportOdraftOptions,
): OdraftMeta {
  return {
    title: meta.title,
    author: meta.author,
    color: meta.color,
    page_count: meta.page_count,
    ...(options.projectId !== undefined
      ? { project_id: options.projectId }
      : {}),
    ...(options.scriptId !== undefined ? { script_id: options.scriptId } : {}),
    ...(options.projectTitle ? { project_title: options.projectTitle } : {}),
    ...(options.appVersion ? { app_version: options.appVersion } : {}),
    ...(options.backupKind ? { backup_kind: options.backupKind } : {}),
    ...(options.assetsOmitted ? { assets_omitted: true } : {}),
  }
}

/** Build a native-format JSON blob from script metadata and content. */
export function exportOdraft(
  meta: ScriptMeta,
  content: Record<string, unknown>,
  options: ExportOdraftOptions = {},
): Blob {
  return new Blob([serializeOdraft(meta, content, options)], {
    type: 'application/json',
  })
}

/** The native-format JSON text. Separated from the Blob so callers that write
 *  to a file don't have to round-trip through Blob.text(). */
export function serializeOdraft(
  meta: ScriptMeta,
  content: Record<string, unknown>,
  options: ExportOdraftOptions = {},
): string {
  const data: OdraftFile = {
    odraft_version: SCENEPLAY_VERSION,
    format: 'opendraft-script',
    exported_at: options.exportedAt || new Date().toISOString(),
    meta: buildOdraftMeta(meta, options),
    content,
    ...(options.assets && options.assets.length > 0
      ? { assets: options.assets }
      : {}),
  }
  return JSON.stringify(data, null, 2)
}

const ASSETS_MANIFEST_PATH = 'assets/manifest.json'

function assetBinPath(id: string): string {
  return `assets/${id}.bin`
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000 // chunked so a large asset can't blow the call stack
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

/**
 * Build a zip-archive `.sceneplay`: `manifest.json` (envelope metadata),
 * `content.json` (the document + `_`-prefixed store state), and one
 * `assets/<id>.bin` per embedded binary plus an `assets/manifest.json`
 * listing their filenames/mime types. Assets are decoded from base64 back to
 * raw bytes here — `OdraftAsset`/`packAssets` stay base64-shaped so every
 * existing caller is unchanged, but the persisted zip entry is the raw bytes,
 * not the base64 text, which is the actual size win over v2.
 */
export async function serializeSceneplayZip(
  meta: ScriptMeta,
  content: Record<string, unknown>,
  options: ExportOdraftOptions = {},
): Promise<Blob> {
  const zip = new JSZip()
  const manifest = {
    odraft_version: SCENEPLAY_VERSION,
    format: 'opendraft-script' as const,
    exported_at: options.exportedAt || new Date().toISOString(),
    meta: buildOdraftMeta(meta, options),
  }
  zip.file('manifest.json', JSON.stringify(manifest))
  zip.file('content.json', JSON.stringify(content))

  const assets = options.assets ?? []
  if (assets.length > 0) {
    zip.file(
      ASSETS_MANIFEST_PATH,
      JSON.stringify(
        assets.map(({ id, filename, mime_type }) => ({
          id,
          filename,
          mime_type,
        })),
      ),
    )
    for (const asset of assets) {
      zip.file(assetBinPath(asset.id), fromBase64(asset.data_base64))
    }
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

/** Download a script as an `.odraft` file. Kept for interop with older files. */
export async function downloadOdraft(
  meta: ScriptMeta,
  content: Record<string, unknown>,
  options: ExportOdraftOptions = {},
): Promise<void> {
  const text = serializeOdraft(meta, content, options)
  const filename = `${meta.title || 'Untitled'}.${ODRAFT_EXTENSION}`
  await saveFile(text, filename, [
    { name: 'OpenDraft', extensions: [ODRAFT_EXTENSION] },
  ])
}

/** Download a script as a `.sceneplay` file — a zip archive going forward
 *  (see the module doc's v3 note). */
export async function downloadSceneplay(
  meta: ScriptMeta,
  content: Record<string, unknown>,
  options: ExportOdraftOptions = {},
): Promise<void> {
  const blob = await serializeSceneplayZip(meta, content, options)
  const filename = `${meta.title || 'Untitled'}.${SCENEPLAY_EXTENSION}`
  await saveFile(blob, filename, [
    { name: 'Sceneplay', extensions: [SCENEPLAY_EXTENSION] },
  ])
}

/** The `meta` half of a parsed envelope, shared by the flat-JSON and zip readers. */
function parseOdraftMeta(raw: any): OdraftMeta {
  return {
    title: raw?.title || 'Untitled',
    author: raw?.author || '',
    color: raw?.color || '',
    page_count: raw?.page_count || 0,
    project_id: raw?.project_id ?? null,
    script_id: raw?.script_id ?? null,
    project_title: raw?.project_title,
    app_version: raw?.app_version,
    backup_kind: raw?.backup_kind,
    assets_omitted: raw?.assets_omitted === true,
  }
}

function checkOdraftVersion(version: unknown): number {
  if (typeof version !== 'number') {
    throw new Error('Invalid .sceneplay file: missing version')
  }
  if (version > SCENEPLAY_VERSION) {
    throw new Error(
      `This file was created by a newer version of Sceneplay (format v${version}). Update Sceneplay to open it.`,
    )
  }
  return version
}

/** Parse native-format JSON back into meta + content. */
export function parseOdraft(jsonText: string): ParsedOdraft {
  let data: any
  try {
    data = JSON.parse(jsonText)
  } catch {
    throw new Error('Invalid .sceneplay file: not valid JSON')
  }

  if (data.format !== 'opendraft-script') {
    throw new Error('Invalid .sceneplay file: unrecognized format')
  }
  const version = checkOdraftVersion(data.odraft_version)

  return {
    version,
    meta: parseOdraftMeta(data.meta),
    content: data.content || {},
    assets: Array.isArray(data.assets) ? data.assets : [],
  }
}

const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

function looksLikeZip(bytes: Uint8Array): boolean {
  return ZIP_MAGIC.every((b, i) => bytes[i] === b)
}

/** Parse a zip-archive `.sceneplay` (see the module doc's v3 note) back into
 *  meta + content, re-encoding asset bytes to base64 so the result matches
 *  `ParsedOdraft`'s existing shape — every consumer of `parsed.assets`
 *  (`unpackAssets` et al.) stays unchanged. */
export async function parseSceneplayZip(
  buffer: ArrayBuffer | Blob,
): Promise<ParsedOdraft> {
  const zip = await JSZip.loadAsync(buffer)
  const manifestFile = zip.file('manifest.json')
  const contentFile = zip.file('content.json')
  if (!manifestFile || !contentFile) {
    throw new Error('Invalid .sceneplay file: missing manifest or content')
  }

  const manifest = JSON.parse(await manifestFile.async('string'))
  if (manifest.format !== 'opendraft-script') {
    throw new Error('Invalid .sceneplay file: unrecognized format')
  }
  const version = checkOdraftVersion(manifest.odraft_version)
  const content = JSON.parse(await contentFile.async('string'))

  const assets: OdraftAsset[] = []
  const assetManifestFile = zip.file(ASSETS_MANIFEST_PATH)
  if (assetManifestFile) {
    const assetList = JSON.parse(await assetManifestFile.async('string')) as {
      id: string
      filename: string
      mime_type: string
    }[]
    for (const entry of assetList) {
      const binFile = zip.file(assetBinPath(entry.id))
      if (!binFile) continue
      const bytes = await binFile.async('uint8array')
      assets.push({
        id: entry.id,
        filename: entry.filename,
        mime_type: entry.mime_type,
        data_base64: toBase64(bytes),
      })
    }
  }

  return {
    version,
    meta: parseOdraftMeta(manifest.meta),
    content: content || {},
    assets,
  }
}

/**
 * Read either format transparently — a zip-archive `.sceneplay` (v3) or
 * legacy flat-JSON (v1/v2, and the unversioned crash-backup shape
 * `parseOdraftLoose` recovers). Detected by sniffing the zip local-file-header
 * magic bytes rather than a version number, so pre-feature files keep opening
 * and this survives a hypothetical future v4 changing either shape again.
 */
export async function parseSceneplayAny(
  buffer: ArrayBuffer,
): Promise<ParsedOdraft> {
  const head = new Uint8Array(buffer.slice(0, 4))
  if (looksLikeZip(head)) return parseSceneplayZip(buffer)
  const text = new TextDecoder().decode(buffer)
  return parseOdraftLoose(text)
}

/**
 * Parse a native-format file, falling back to accepting a bare payload.
 *
 * Older builds wrote crash backups as the raw `buildSaveContent()` object with
 * no envelope, which `parseOdraft` rejects — meaning the app could not open its
 * own emergency backup. Any such file already on a user's disk is recoverable
 * here: if the JSON has no envelope but looks like a ProseMirror document,
 * treat the whole object as the content.
 */
export function parseOdraftLoose(jsonText: string): ParsedOdraft {
  let data: any
  try {
    data = JSON.parse(jsonText)
  } catch {
    throw new Error('Invalid .sceneplay file: not valid JSON')
  }

  if (data?.format === 'opendraft-script') return parseOdraft(jsonText)

  if (data?.type === 'doc') {
    return {
      version: 0,
      meta: {
        title: 'Untitled',
        author: '',
        color: '',
        page_count: 0,
        project_id: null,
        script_id: null,
      },
      content: data,
      assets: [],
    }
  }

  throw new Error('Invalid .sceneplay file: unrecognized format')
}
