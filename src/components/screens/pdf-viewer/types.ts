/** A single imported PDF, shown as one tab within the PDF screen. */
export interface PdfEmbed {
  id: string
  /** Original file name, for display. */
  fileName: string
  /** Key into the asset store (see `@/storage/assetStore`) for the PDF binary. */
  assetRef: string
  importedAt: string
  pageCount: number
  mode: 'full' | 'single-page'
  /**
   * Which page of the original source this came from, single-page mode
   * only — kept for the user's own reference (e.g. "p.42 of the Corebook"),
   * not used to re-fetch anything, since the source itself is not retained.
   */
  sourcePageIndex?: number
  /** Tab position within the PDF screen. */
  order: number
}

/** A markup annotation drawn on top of a PDF page (Markup mode). */
export interface PdfAnnotation {
  id: string
  pdfEmbedId: string
  page: number
  type: 'freetext' | 'ink' | 'highlight' | 'stamp'
  /**
   * Position/geometry in PDF-page coordinate space, not viewport pixels, so
   * annotations stay aligned across zoom levels and window resizes.
   */
  geometry: Record<string, unknown>
  /** Text content, ink path, colour, etc. — pdfjs' own serialized shape. */
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/** A filled-in AcroForm field value (Fill mode). Persists separately from
 *  annotations — different PDF mechanism entirely (widget values vs. drawn
 *  markup) — but both key off `pdfEmbedId`. */
export interface PdfFormFieldValue {
  pdfEmbedId: string
  /** Matches the AcroForm field's internal name. */
  fieldName: string
  value: string | boolean
}
