import { PDFDocument } from 'pdf-lib'
import { pdfjsLib } from '../pdfjsSetup'
import { saveAsset } from '@/storage/assetStore'
import { uuid } from '@/utils/open-draft/uuid'
import { useProjectStore } from '@/stores/projectStore'
import { usePdfViewerStore } from '../store/usePdfViewerStore'
import type { PdfEmbed } from '../types'

/** Soft warning threshold — no hard cap on PDF size, but everything lives in
 *  the saved document going forward, so flag anything unusually large. Same
 *  order of magnitude as `DEFAULT_ASSET_CAP_BYTES` in assetStore.ts, which
 *  caps *total* export size — this is a per-file sanity anchor, not the same
 *  constant. */
export const PDF_SIZE_WARNING_BYTES = 25 * 1024 * 1024

/** Orchestrates the PDF import flow: persist the binary as an asset, then
 *  create the `PdfEmbed` that makes it a tab. Full-document and single-page
 *  extraction share everything except which bytes get stored. */
export function usePdfImport() {
  const addEmbed = usePdfViewerStore((s) => s.addEmbed)
  const embeds = usePdfViewerStore((s) => s.embeds)

  async function persistAndAddEmbed(
    bytes: Uint8Array,
    fileName: string,
    pageCount: number,
    mode: PdfEmbed['mode'],
    sourcePageIndex?: number,
  ): Promise<PdfEmbed> {
    const assetId = uuid()
    const docId = useProjectStore.getState().currentDocId
    await saveAsset(assetId, new Blob([bytes as BlobPart], { type: 'application/pdf' }), {
      docId,
      filename: fileName,
      original_name: fileName,
      mime_type: 'application/pdf',
    })

    const embed: PdfEmbed = {
      id: uuid(),
      fileName,
      assetRef: assetId,
      importedAt: new Date().toISOString(),
      pageCount,
      mode,
      ...(sourcePageIndex !== undefined ? { sourcePageIndex } : {}),
      order: embeds.length,
    }
    addEmbed(embed)
    return embed
  }

  /** Import the entire source document as-is. */
  async function importFull(file: File): Promise<PdfEmbed> {
    const buf = await file.arrayBuffer()
    const pdfDoc = await pdfjsLib.getDocument({ data: buf.slice(0) }).promise
    const pageCount = pdfDoc.numPages
    await pdfDoc.loadingTask.destroy()
    return persistAndAddEmbed(new Uint8Array(buf), file.name, pageCount, 'full')
  }

  /**
   * Extract exactly one page from the source into a new, genuinely
   * single-page PDF. The extracted bytes are the only thing ever handed to
   * storage — `srcBuf`/`srcDoc` go out of scope here and are never persisted
   * or referenced by the resulting embed, which is what makes "the original
   * multi-page source is not retained" hold structurally.
   */
  async function importSinglePage(
    file: File,
    pageIndex: number,
  ): Promise<PdfEmbed> {
    const srcBuf = await file.arrayBuffer()
    const srcDoc = await PDFDocument.load(srcBuf)
    const newDoc = await PDFDocument.create()
    const [copiedPage] = await newDoc.copyPages(srcDoc, [pageIndex])
    newDoc.addPage(copiedPage)
    const bytes = await newDoc.save()
    return persistAndAddEmbed(bytes, file.name, 1, 'single-page', pageIndex)
  }

  return { importFull, importSinglePage }
}
