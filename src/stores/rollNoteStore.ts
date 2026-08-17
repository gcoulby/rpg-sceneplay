import { create } from 'zustand'
import type { RollNote } from '@/oracles/rollTypes'

interface RollNoteState {
  rollNotes: RollNote[]
  rollsOpen: boolean
  // Set when the user clicks a roll anchor glyph in the editor, so the
  // Rolls sidebar can scroll to / highlight the matching card. Cleared by
  // the panel once it's done reacting to it.
  focusedRollId: string | null
  // Set by the Mod-0 / Numpad0 keyboard shortcut to ask
  // ScriptContextMenuController to open the Roll dialog at a doc position.
  // `token` is bumped on every request so the same `pos` can be requested
  // twice in a row and still be picked up by the controller's effect.
  // `formula` is set instead of `pos` when the request comes from somewhere
  // with no doc position to insert at (e.g. a PDF link hijack) — the dialog
  // opens on the Dice tab pre-rolled, and its Insert buttons become no-ops
  // since `insertPos` stays null.
  rollDialogRequest: { pos: number | null; formula?: string; token: number } | null
  // `note.anchorId` doubles as the RollNote's `id` — it's a 1:1 link to the
  // RollAnchorNode inserted into the doc, so callers (context menu delete,
  // sidebar jump/delete) only ever need to know the anchorId.
  addRollNote: (note: Omit<RollNote, 'id' | 'timestamp'>) => void
  deleteRollNote: (anchorId: string) => void
  setRollNotes: (notes: RollNote[]) => void
  toggleRolls: () => void
  setFocusedRollId: (id: string | null) => void
  requestRollDialog: (pos: number) => void
  requestDiceRoll: (formula: string) => void
}

export const useRollNoteStore = create<RollNoteState>((set) => ({
  rollNotes: [],
  rollsOpen: false,
  focusedRollId: null,
  rollDialogRequest: null,

  addRollNote: (note) => {
    set((s) => ({
      rollNotes: [
        ...s.rollNotes,
        { ...note, id: note.anchorId, timestamp: new Date().toISOString() },
      ],
    }))
  },

  deleteRollNote: (anchorId) =>
    set((s) => ({
      rollNotes: s.rollNotes.filter((n) => n.anchorId !== anchorId),
    })),

  setRollNotes: (rollNotes) => set({ rollNotes }),

  toggleRolls: () => set((s) => ({ rollsOpen: !s.rollsOpen })),

  setFocusedRollId: (id) => set({ focusedRollId: id }),

  requestRollDialog: (pos) =>
    set((s) => ({
      rollDialogRequest: { pos, token: (s.rollDialogRequest?.token ?? 0) + 1 },
    })),

  requestDiceRoll: (formula) =>
    set((s) => ({
      rollDialogRequest: {
        pos: null,
        formula,
        token: (s.rollDialogRequest?.token ?? 0) + 1,
      },
    })),
}))
