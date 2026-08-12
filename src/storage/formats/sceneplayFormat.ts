/**
 * Sceneplay native format — import/export utilities.
 *
 * A `.sceneplay` file is a JSON document containing the script metadata and
 * TipTap content, designed for lossless round-tripping. `.odraft` is the same
 * schema under the historical extension: both are read and written here, and
 * both parse identically.
 *
 * ## Versions
 *
 * - **v1** — `content` was whatever the caller passed. In practice File →
 *   Export passed the bare editor JSON, so notes, tags, beats and character
 *   profiles were silently dropped. Still readable.
 * - **v2** — `content` is the full `buildSaveContent()` payload (document plus
 *   every `_`-prefixed store key), `meta` carries provenance, and `assets` may
 *   embed the images the document references. Images live outside the document
 *   as `assetId` references, so without embedding them a restored script comes
 *   back with every image broken.
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

import { saveFile } from '../fileOps'

export const SCENEPLAY_VERSION = 2
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
    meta: {
      title: meta.title,
      author: meta.author,
      color: meta.color,
      page_count: meta.page_count,
      ...(options.projectId !== undefined
        ? { project_id: options.projectId }
        : {}),
      ...(options.scriptId !== undefined
        ? { script_id: options.scriptId }
        : {}),
      ...(options.projectTitle ? { project_title: options.projectTitle } : {}),
      ...(options.appVersion ? { app_version: options.appVersion } : {}),
      ...(options.backupKind ? { backup_kind: options.backupKind } : {}),
      ...(options.assetsOmitted ? { assets_omitted: true } : {}),
    },
    content,
    ...(options.assets && options.assets.length > 0
      ? { assets: options.assets }
      : {}),
  }
  return JSON.stringify(data, null, 2)
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

/** Download a script as a `.sceneplay` file — the native format going forward.
 *  Byte-identical payload to `downloadOdraft`, only the extension differs. */
export async function downloadSceneplay(
  meta: ScriptMeta,
  content: Record<string, unknown>,
  options: ExportOdraftOptions = {},
): Promise<void> {
  const text = serializeOdraft(meta, content, options)
  const filename = `${meta.title || 'Untitled'}.${SCENEPLAY_EXTENSION}`
  await saveFile(text, filename, [
    { name: 'Sceneplay', extensions: [SCENEPLAY_EXTENSION] },
  ])
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
  if (typeof data.odraft_version !== 'number') {
    throw new Error('Invalid .sceneplay file: missing version')
  }
  if (data.odraft_version > SCENEPLAY_VERSION) {
    throw new Error(
      `This file was created by a newer version of Sceneplay (format v${data.odraft_version}). Update Sceneplay to open it.`,
    )
  }

  return {
    version: data.odraft_version,
    meta: {
      title: data.meta?.title || 'Untitled',
      author: data.meta?.author || '',
      color: data.meta?.color || '',
      page_count: data.meta?.page_count || 0,
      project_id: data.meta?.project_id ?? null,
      script_id: data.meta?.script_id ?? null,
      project_title: data.meta?.project_title,
      app_version: data.meta?.app_version,
      backup_kind: data.meta?.backup_kind,
      assets_omitted: data.meta?.assets_omitted === true,
    },
    content: data.content || {},
    assets: Array.isArray(data.assets) ? data.assets : [],
  }
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
