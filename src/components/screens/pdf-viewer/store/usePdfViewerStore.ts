import { create } from 'zustand'
import { removeAsset } from '@/storage/assetStore'
import type { PdfEmbed, PdfAnnotation, PdfFormFieldValue } from '../types'

interface PdfViewerState {
  embeds: PdfEmbed[]
  annotations: PdfAnnotation[]
  formValues: PdfFormFieldValue[]

  // Bulk setters, for hydration from a loaded/imported document.
  setEmbeds: (embeds: PdfEmbed[]) => void
  setAnnotations: (annotations: PdfAnnotation[]) => void
  setFormValues: (formValues: PdfFormFieldValue[]) => void

  // Tab-bar CRUD.
  addEmbed: (embed: PdfEmbed) => void
  renameEmbed: (id: string, fileName: string) => void
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

  setEmbeds: (embeds) => set({ embeds }),
  setAnnotations: (annotations) => set({ annotations }),
  setFormValues: (formValues) => set({ formValues }),

  addEmbed: (embed) => set((s) => ({ embeds: [...s.embeds, embed] })),

  renameEmbed: (id, fileName) =>
    set((s) => ({
      embeds: s.embeds.map((e) => (e.id === id ? { ...e, fileName } : e)),
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
