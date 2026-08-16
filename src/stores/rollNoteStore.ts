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
  rollDialogRequest: { pos: number; token: number } | null
  // `note.anchorId` doubles as the RollNote's `id` — it's a 1:1 link to the
  // RollAnchorNode inserted into the doc, so callers (context menu delete,
  // sidebar jump/delete) only ever need to know the anchorId.
  addRollNote: (note: Omit<RollNote, 'id' | 'timestamp'>) => void
  deleteRollNote: (anchorId: string) => void
  toggleRolls: () => void
  setFocusedRollId: (id: string | null) => void
  requestRollDialog: (pos: number) => void
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

  toggleRolls: () => set((s) => ({ rollsOpen: !s.rollsOpen })),

  setFocusedRollId: (id) => set({ focusedRollId: id }),

  requestRollDialog: (pos) =>
    set((s) => ({
      rollDialogRequest: { pos, token: (s.rollDialogRequest?.token ?? 0) + 1 },
    })),
}))
