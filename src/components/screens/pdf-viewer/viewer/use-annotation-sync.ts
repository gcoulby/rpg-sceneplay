import { useEffect, useRef } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { usePdfViewerStore } from '../store/usePdfViewerStore'
import { saveAsset } from '@/storage/assetStore'
import type { PdfAnnotation } from '../types'

const ANNOTATION_TYPE_TO_KIND: Record<number, PdfAnnotation['type']> = {
  3: 'freetext', // AnnotationEditorType.FREETEXT
  9: 'highlight', // AnnotationEditorType.HIGHLIGHT
  13: 'stamp', // AnnotationEditorType.STAMP
  15: 'ink', // AnnotationEditorType.INK
}

const BAKE_DEBOUNCE_MS = 1500

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
 *
 * Form values round-trip on their own (pdfjs stores those as plain
 * `{value}` objects, so `setValue()` on reload is enough to restore them).
 * Drawn markup (ink/freetext/highlight/stamp) doesn't: pdfjs's viewer
 * library has no supported way to turn a plain serialized annotation back
 * into a live, rendered editor on a freshly-parsed PDF — that only happens
 * through pdfjs-internal flows (page cloning, print) this app never goes
 * through. The robust fix is the same one every PDF viewer relies on: bake
 * edits into the PDF bytes themselves via `PDFDocumentProxy.saveDocument()`
 * (which serializes `annotationStorage` into real PDF-native annotation
 * objects) and persist that as the asset, so a freshly-opened PDF already
 * contains the markup natively — no custom re-hydration needed on load.
 */
export function useAnnotationSync(
  pdfDoc: PDFDocumentProxy | null,
  pdfEmbedId: string,
  assetRef: string,
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

    // Debounced so a burst of ink points or keystrokes collapses into one
    // re-serialize-and-write rather than one per pdfjs `onSetModified` edge.
    // `dirty` tracks whether a bake is actually owed, so the cleanup below
    // doesn't re-bake unchanged bytes on every unrelated unmount.
    let bakeTimer: ReturnType<typeof setTimeout> | null = null
    let dirty = false
    const bakeNow = () => {
      if (bakeTimer) {
        clearTimeout(bakeTimer)
        bakeTimer = null
      }
      if (!dirty) return
      dirty = false
      void doc
        .saveDocument()
        .then((bytes) =>
          saveAsset(assetRef, new Blob([bytes], { type: 'application/pdf' })),
        )
        .catch((err) => {
          console.error('Failed to bake PDF annotations into asset:', err)
        })
    }
    const scheduleBake = () => {
      dirty = true
      if (bakeTimer) clearTimeout(bakeTimer)
      bakeTimer = setTimeout(bakeNow, BAKE_DEBOUNCE_MS)
    }

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
        // Bake this edit (form value or drawn markup alike) into the PDF
        // bytes — see the hook's doc comment for why this is the only
        // reliable way to make drawn markup survive a reload.
        scheduleBake()
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

          // pdfjs' own commit path (`addToAnnotationStorage`) stores the
          // live AnnotationEditor instance itself, not a plain object — it
          // only gets serialized (via `.serialize()`) in a few specific
          // pdfjs-internal flows (page cloning, print/save) that normal
          // markup editing never goes through. Reading `.annotationType`
          // straight off that instance is always undefined, which silently
          // dropped every freshly-drawn annotation. pdfjs' own
          // `AnnotationStorage.serializable` getter has this exact
          // `instanceof AnnotationEditor ? val.serialize(...) : val` check
          // (confirmed by reading pdfjs' bundled source) — mirrored here via
          // duck-typing since `AnnotationEditor` isn't a public export.
          const maybeEditor = value as { serialize?: (isForCopying?: boolean) => unknown }
          const raw = (
            typeof maybeEditor.serialize === 'function'
              ? maybeEditor.serialize(false)
              : value
          ) as Record<string, unknown> | null
          if (!raw) continue // e.g. an empty/in-progress editor with nothing to serialize yet
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
      // Flush rather than let the debounce timer fire later: by then this
      // embed may have switched away (only the active PDF tab stays
      // mounted) and `usePdfDocument`'s ref-counting may have already
      // destroyed this `doc`, which would make a delayed `saveDocument()`
      // call fail silently instead of persisting the last edit.
      bakeNow()
    }
  }, [pdfDoc, pdfEmbedId, assetRef, setFormFieldValue, upsertAnnotation])
  /* eslint-enable react-hooks/immutability */
}
