import { useEditorStore } from '@/stores/editorStore'
import { useSheetStore } from './useSheetStore'

export type LinkResult = { ok: true } | { ok: false; reason: 'already-linked' }

/**
 * Links a sheet to a character. Blocks (rather than silently reassigning)
 * when the sheet is already linked to a different character — per the
 * sheet<->character spec, reassignment must be an explicit unlink-then-link,
 * never implicit.
 */
export function linkSheetToCharacter(sheetId: string, characterName: string): LinkResult {
  const sheet = useSheetStore.getState().sheets.find((s) => s.id === sheetId)
  const upperName = characterName.toUpperCase()
  if (sheet?.characterName && sheet.characterName !== upperName) {
    return { ok: false, reason: 'already-linked' }
  }
  useSheetStore.getState().updateSheet(sheetId, { characterName: upperName })
  useEditorStore.getState().upsertCharacterProfile(upperName, { sheetId })
  return { ok: true }
}

/** Clears both sides of the link. Safe to call on an already-unlinked sheet. */
export function unlinkSheetFromCharacter(sheetId: string): void {
  const sheet = useSheetStore.getState().sheets.find((s) => s.id === sheetId)
  if (!sheet) return
  useSheetStore.getState().updateSheet(sheetId, { characterName: null })
  if (sheet.characterName) {
    useEditorStore.getState().upsertCharacterProfile(sheet.characterName, { sheetId: null })
  }
}

/**
 * Deletes a character while preserving its sheet: unlinks first (sheet
 * becomes orphaned, stays in useSheetStore), then removes the profile.
 * Both the manual "Remove" confirm flow and the auto-cleanup-on-rename path
 * in CharacterProfilesPanel must call this instead of deleteCharacterProfile
 * directly.
 */
export function deleteCharacterCascade(characterName: string): void {
  const upperName = characterName.toUpperCase()
  const profile = useEditorStore
    .getState()
    .characterProfiles.find((p) => p.name === upperName)
  if (profile?.sheetId) {
    unlinkSheetFromCharacter(profile.sheetId)
  }
  useEditorStore.getState().deleteCharacterProfile(upperName)
}

/**
 * Deletes a sheet while preserving its character: unlinks first (clears
 * CharacterProfile.sheetId), then removes the sheet record.
 */
export function deleteSheet(sheetId: string): void {
  unlinkSheetFromCharacter(sheetId)
  useSheetStore.getState().removeSheet(sheetId)
}
