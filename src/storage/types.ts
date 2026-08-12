import type { OdraftMeta, OdraftAsset } from './formats/sceneplayFormat'

export type StorageMode = 'disk' | 'memory' | 'browser'

export interface StorageDoc {
  id: string
  meta: OdraftMeta
  content: Record<string, unknown>
  assets?: OdraftAsset[]
  updatedAt: string
}

export interface StorageDocSummary {
  id: string
  title: string
  updatedAt: string
  sizeBytes: number
}

export interface StorageProvider {
  readonly mode: StorageMode
  readonly label: string
  isReady(): boolean
  list(): Promise<StorageDocSummary[]>
  load(id?: string): Promise<StorageDoc | null>
  save(doc: StorageDoc): Promise<void>
  remove?(id: string): Promise<void>
  /** Acquire whatever the provider needs (a file picker for disk/memory,
   *  nothing for browser). Must run from a user gesture for `disk` — the
   *  browser requires it for showSaveFilePicker, not a choice made here. */
  connect(suggestedTitle?: string): Promise<boolean>
  disconnect(): void
}
