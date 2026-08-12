/**
 * Persistence for user-created formatting templates.
 *
 * Much lower stakes than assets — small JSON documents, no binaries — so this is
 * a thin wrapper over the `templates` object store, one row per template keyed
 * by id. System templates are code, not data, and never appear here.
 */
import { idbGetAll, idbSet, idbDelete, STORES } from './idb'
import type { FormattingTemplate } from '@/stores/formattingTypes'

/** Every user template, oldest first, so the list order is stable. */
export async function listTemplates(): Promise<FormattingTemplate[]> {
  const rows = await idbGetAll<FormattingTemplate>(STORES.templates)
  return rows.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
}

/** Insert or replace a template. */
export async function putTemplate(
  template: FormattingTemplate,
): Promise<void> {
  await idbSet(STORES.templates, template.id, template)
}

export async function deleteTemplate(id: string): Promise<void> {
  await idbDelete(STORES.templates, id)
}
