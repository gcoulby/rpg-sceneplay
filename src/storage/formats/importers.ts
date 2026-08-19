/**
 * Format-agnostic read path — sniffs the extension and picks the right parser,
 * reusing the existing parsers rather than duplicating them.
 */
import { parseFDXFull } from '@/utils/open-draft/fdxParser'
import { parseFountain } from '@/utils/open-draft/fountainParser'
import { parseDocx } from '@/utils/open-draft/docxImporter'
import {
  parseOdraftLoose,
  parseSceneplayAny,
  isSceneplayFile,
  type ParsedOdraft,
} from './sceneplayFormat'

export type SourceFormat = 'sceneplay' | 'fdx' | 'docx' | 'fountain' | 'txt'

export interface ImportedDocument {
  format: SourceFormat
  doc: unknown
  parsedOdraft?: ParsedOdraft
  title: string
}

export function detectFormat(filename: string): SourceFormat {
  if (isSceneplayFile(filename)) return 'sceneplay'
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext === 'fdx') return 'fdx'
  if (ext === 'docx') return 'docx'
  if (ext === 'fountain') return 'fountain'
  return 'txt'
}

function titleFromFilename(filename: string): string {
  return filename.replace(/\.\w+$/, '') || 'Untitled'
}

/**
 * Text-based read path. `.sceneplay`/`.odraft` here means the legacy flat-JSON
 * shape (v1/v2) — a v3 zip archive isn't valid text and belongs in
 * `importBinaryDocument` instead; callers with raw file bytes should prefer
 * that regardless of format.
 */
export function importTextDocument(
  filename: string,
  text: string,
): ImportedDocument {
  const format = detectFormat(filename)
  if (format === 'sceneplay') {
    const parsed = parseOdraftLoose(text)
    return {
      format,
      doc: parsed.content,
      parsedOdraft: parsed,
      title: parsed.meta.title || titleFromFilename(filename),
    }
  }
  if (format === 'fdx') {
    const parsed = parseFDXFull(text)
    return { format, doc: parsed.doc, title: titleFromFilename(filename) }
  }
  return {
    format: 'fountain',
    doc: parseFountain(text),
    title: titleFromFilename(filename),
  }
}

export async function importBinaryDocument(
  filename: string,
  bytes: ArrayBuffer,
): Promise<ImportedDocument> {
  if (isSceneplayFile(filename)) {
    const parsed = await parseSceneplayAny(bytes)
    return {
      format: 'sceneplay',
      doc: parsed.content,
      parsedOdraft: parsed,
      title: parsed.meta.title || titleFromFilename(filename),
    }
  }
  const result = await parseDocx(bytes)
  return {
    format: 'docx',
    doc: result.doc,
    title: result.scriptTitle || titleFromFilename(filename),
  }
}
