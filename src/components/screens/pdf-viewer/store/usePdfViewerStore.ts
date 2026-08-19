import { create } from 'zustand'
import { removeAsset } from '@/storage/assetStore'
import type { PdfEmbed, PdfAnnotation, PdfFormFieldValue } from '../types'

interface PdfViewerState {
  embeds: PdfEmbed[]
  annotations: PdfAnnotation[]
  formValues: PdfFormFieldValue[]

  // Mirrors the tab bar's own `useLastSelectedTab` (localStorage-backed)
  // selection into reactive store state, so components outside the PDF
  // screen's tree — the PDF Tools sidebar panel — can know which embed is
  // currently showing without re-implementing that localStorage lookup.
  activeEmbedId: string | null
  setActiveEmbedId: (id: string | null) => void

  // The active embed's current page, mirrored from its `PDFViewer`'s own
  // `pagechanging` event — lets the PDF Tools sidebar's Pages tab highlight
  // the page currently on screen, same reasoning as `activeEmbedId` above.
  activePage: number | null
  setActivePage: (page: number | null) => void

  // Lets the PDF Tools sidebar's Pages/Search tabs ask the active embed's
  // live `PDFViewer` instance to jump to a page — there's no other channel
  // between that sidebar (outside the PDF screen's component tree) and the
  // viewer instance, which is local state inside pdf-viewer.tsx. `token` is
  // bumped on every request so the same page can be requested twice in a
  // row and still be picked up. `highlightText`, when set (the Search tab's
  // exact matched substring), also briefly flashes that one occurrence via
  // the find controller — `highlightAll: false`, unlike the toolbar's own
  // Find bar, since this is "show me where this specific hit was", not an
  // open-ended search session.
  pageJumpRequest: {
    embedId: string
    page: number
    highlightText?: string
    token: number
  } | null
  requestPageJump: (embedId: string, page: number, highlightText?: string) => void

  // Bulk setters, for hydration from a loaded/imported document.
  setEmbeds: (embeds: PdfEmbed[]) => void
  setAnnotations: (annotations: PdfAnnotation[]) => void
  setFormValues: (formValues: PdfFormFieldValue[]) => void

  // Tab-bar CRUD.
  addEmbed: (embed: PdfEmbed) => void
  renameEmbed: (id: string, fileName: string) => void
  setEmbedZoom: (id: string, zoom: number) => void
  /** Swaps the embed at `id` with its neighbour in the given direction,
   *  mirroring `SheetTabsEditor`'s `moveModule` swap-in-array approach.
   *  No-ops at the array boundaries. */
  reorderEmbeds: (id: string, direction: -1 | 1) => void
  /** Deletes the embed, cascades to any annotations/form values that
   *  reference it, and removes the underlying asset — a tab removal has no
   *  cross-store cleanup to copy from `SheetTabsEditor`, since removing a
   *  character sheet tab doesn't cascade into another store. */
  removeEmbed: (id: string) => void

  // Markup mode.
  upsertAnnotation: (annotation: PdfAnnotation) => void
  removeAnnotation: (id: string) => void

  // Fill mode — upsert by (pdfEmbedId, fieldName).
  setFormFieldValue: (value: PdfFormFieldValue) => void
}

export const usePdfViewerStore = create<PdfViewerState>((set, get) => ({
  embeds: [],
  annotations: [],
  formValues: [],
  activeEmbedId: null,
  activePage: null,
  pageJumpRequest: null,

  setEmbeds: (embeds) => set({ embeds }),
  setActiveEmbedId: (id) => set({ activeEmbedId: id }),
  setActivePage: (page) => set({ activePage: page }),
  requestPageJump: (embedId, page, highlightText) =>
    set((s) => ({
      pageJumpRequest: {
        embedId,
        page,
        highlightText,
        token: (s.pageJumpRequest?.token ?? 0) + 1,
      },
    })),
  setAnnotations: (annotations) => set({ annotations }),
  setFormValues: (formValues) => set({ formValues }),

  addEmbed: (embed) => set((s) => ({ embeds: [...s.embeds, embed] })),

  renameEmbed: (id, fileName) =>
    set((s) => ({
      embeds: s.embeds.map((e) => (e.id === id ? { ...e, fileName } : e)),
    })),

  setEmbedZoom: (id, zoom) =>
    set((s) => ({
      embeds: s.embeds.map((e) => (e.id === id ? { ...e, zoom } : e)),
    })),

  reorderEmbeds: (id, direction) =>
    set((s) => {
      const sorted = [...s.embeds].sort((a, b) => a.order - b.order)
      const index = sorted.findIndex((e) => e.id === id)
      const target = index + direction
      if (index === -1 || target < 0 || target >= sorted.length) return s
      const swapped = [...sorted]
      ;[swapped[index], swapped[target]] = [swapped[target], swapped[index]]
      return { embeds: swapped.map((e, i) => ({ ...e, order: i })) }
    }),

  removeEmbed: (id) => {
    const embed = get().embeds.find((e) => e.id === id)
    set((s) => ({
      embeds: s.embeds.filter((e) => e.id !== id),
      annotations: s.annotations.filter((a) => a.pdfEmbedId !== id),
      formValues: s.formValues.filter((v) => v.pdfEmbedId !== id),
    }))
    if (embed) void removeAsset(embed.assetRef)
  },

  upsertAnnotation: (annotation) =>
    set((s) => {
      const exists = s.annotations.some((a) => a.id === annotation.id)
      return {
        annotations: exists
          ? s.annotations.map((a) => (a.id === annotation.id ? annotation : a))
          : [...s.annotations, annotation],
      }
    }),

  removeAnnotation: (id) =>
    set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) })),

  setFormFieldValue: (value) =>
    set((s) => {
      const exists = s.formValues.some(
        (v) =>
          v.pdfEmbedId === value.pdfEmbedId && v.fieldName === value.fieldName,
      )
      return {
        formValues: exists
          ? s.formValues.map((v) =>
              v.pdfEmbedId === value.pdfEmbedId &&
              v.fieldName === value.fieldName
                ? value
                : v,
            )
          : [...s.formValues, value],
      }
    }),
}))
