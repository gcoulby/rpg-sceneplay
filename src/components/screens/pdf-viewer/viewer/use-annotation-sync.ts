import { useEffect, useRef } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { usePdfViewerStore } from '../store/usePdfViewerStore'
import type { PdfAnnotation } from '../types'

const ANNOTATION_TYPE_TO_KIND: Record<number, PdfAnnotation['type']> = {
  3: 'freetext', // AnnotationEditorType.FREETEXT
  9: 'highlight', // AnnotationEditorType.HIGHLIGHT
  13: 'stamp', // AnnotationEditorType.STAMP
  15: 'ink', // AnnotationEditorType.INK
}

/**
 * Wires a loaded `PDFDocumentProxy`'s `annotationStorage` to the pdf-viewer
 * store: restores previously-saved form values before first render, then
 * persists new edits as they happen.
 *
 * pdfjs's `annotationStorage` is a single flat key/value map shared by both
 * AcroForm widgets (Fill mode) and drawn annotation editors (Markup mode) —
 * `addToAnnotationStorage()` is the same internal commit path both use
 * (confirmed by reading pdfjs's bundled source). Widget entries are told
 * apart from drawn annotations by cross-referencing each page's
 * `getAnnotations()`, which maps a storage key to the AcroForm field's
 * `fieldName`; everything else in storage is a drawn annotation editor,
 * identified by its own `annotationType`.
 */
export function useAnnotationSync(
  pdfDoc: PDFDocumentProxy | null,
  pdfEmbedId: string,
): void {
  const setFormFieldValue = usePdfViewerStore((s) => s.setFormFieldValue)
  const upsertAnnotation = usePdfViewerStore((s) => s.upsertAnnotation)

  // Read via refs inside the storage callback so the effect below only needs
  // to run once per (pdfDoc, pdfEmbedId) — re-subscribing on every store
  // write would tear down and rebuild the pdfjs-side listener constantly.
  const latestRef = useRef(usePdfViewerStore.getState())
  useEffect(
    () => usePdfViewerStore.subscribe((s) => (latestRef.current = s)),
    [],
  )

  // `doc` is a stable PDFDocumentProxy for the effect's lifetime (this
  // hook, not a memoized component, owns it); the `cancelled` flag guards
  // against committing state from a stale async call after `pdfDoc`
  // changes, which is the safety these rules are otherwise checking for.
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    if (!pdfDoc) return
    const doc = pdfDoc
    let cancelled = false

    void (async () => {
      const idToFieldName = new Map<string, string>()
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const pageAnnotations = await page.getAnnotations()
        for (const a of pageAnnotations as { id: string; fieldName?: string }[]) {
          if (a.fieldName) idToFieldName.set(a.id, a.fieldName)
        }
      }
      if (cancelled) return

      const storage = doc.annotationStorage
      const fieldNameToId = new Map(
        Array.from(idToFieldName, ([id, name]) => [name, id]),
      )
      for (const fv of latestRef.current.formValues) {
        if (fv.pdfEmbedId !== pdfEmbedId) continue
        const id = fieldNameToId.get(fv.fieldName)
        if (id) storage.setValue(id, { value: fv.value })
      }
      // Restoring saved values shouldn't itself count as a new edit.
      storage.resetModified()

      // pdfjs' own .d.ts types `onSetModified` as the literal `null` (its
      // default value, auto-generated from JSDoc) rather than as the
      // assignable callback property it actually is at runtime.
      const storageWithCallback = storage as unknown as {
        onSetModified: (() => void) | null
      }
      storageWithCallback.onSetModified = () => {
        // pdfjs' own source (`#setModified()`) only invokes `onSetModified`
        // on the edge where storage goes from clean to dirty — it does NOT
        // fire again on every subsequent `setValue()` while already dirty.
        // Without resetting here, only the very first keystroke (or ink
        // point) after each reset would ever reach the store — everything
        // typed after that would update pdfjs' internal storage but never
        // notify us, silently truncating every field to its first change.
        // Resetting immediately re-arms it to fire again next time.
        storage.resetModified()
        for (const [key, value] of storage as unknown as Iterable<
          [string, unknown]
        >) {
          const fieldName = idToFieldName.get(key)
          if (fieldName) {
            const raw = value as { value?: unknown }
            setFormFieldValue({
              pdfEmbedId,
              fieldName,
              value: (raw?.value ?? '') as string | boolean,
            })
            continue
          }

          const raw = value as Record<string, unknown>
          const kind = ANNOTATION_TYPE_TO_KIND[raw.annotationType as number]
          if (!kind) continue // an editor type this feature doesn't track
          const existing = latestRef.current.annotations.find(
            (a) => a.id === key && a.pdfEmbedId === pdfEmbedId,
          )
          upsertAnnotation({
            id: key,
            pdfEmbedId,
            page:
              typeof raw.pageIndex === 'number'
                ? (raw.pageIndex as number) + 1
                : 1,
            type: kind,
            // pdfjs' AnnotationEditor.serialize() already reports rect/points
            // in PDF-page coordinate space, not viewport pixels — a
            // pass-through, not a coordinate transform.
            geometry: { rect: raw.rect, rotation: raw.rotation },
            data: raw,
            createdAt: existing?.createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [pdfDoc, pdfEmbedId, setFormFieldValue, upsertAnnotation])
  /* eslint-enable react-hooks/immutability */
}
