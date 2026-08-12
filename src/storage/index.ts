/**
 * Public surface of the local-first storage layer.
 *
 * Everything the rest of the app needs is re-exported here so call sites import
 * from `@/storage` rather than reaching into individual modules.
 */

// Types
export type {
  StorageMode,
  StorageDoc,
  StorageDocSummary,
  StorageProvider,
} from './types'

// Native format (.sceneplay / .odraft)
export {
  SCENEPLAY_VERSION,
  ODRAFT_VERSION,
  SCENEPLAY_EXTENSION,
  ODRAFT_EXTENSION,
  isSceneplayFile,
  exportOdraft,
  serializeOdraft,
  downloadOdraft,
  downloadSceneplay,
  parseOdraft,
  parseOdraftLoose,
} from './formats/sceneplayFormat'
export type {
  ScriptMeta,
  OdraftAsset,
  OdraftMeta,
  ParsedOdraft,
  ExportOdraftOptions,
  BackupKind,
} from './formats/sceneplayFormat'

// Import sniffing
export {
  detectFormat,
  importTextDocument,
  importBinaryDocument,
} from './formats/importers'
export type { SourceFormat, ImportedDocument } from './formats/importers'

// Save payload helpers
export {
  buildSaveContent,
  stripSaveMetadata,
  hasSaveMetadata,
  SAVE_METADATA_KEYS,
} from './saveContent'
export type { SaveMetadataKey } from './saveContent'
export { hydrateEditorStoresFromContent } from './hydrateStores'

// File dialogs / downloads
export { saveFile, openTextFile, openBinaryFile } from './fileOps'

// Low-level IndexedDB access
export {
  STORES,
  idbGet,
  idbSet,
  idbDelete,
  idbGetAll,
  supportsIndexedDb,
  requestPersistentStorage,
} from './idb'
export type { StoreName } from './idb'

// Providers
export {
  diskHandleProvider,
  supportsDiskPersistence,
} from './providers/diskHandleProvider'
export { memoryProvider } from './providers/memoryProvider'
export { indexedDbProvider } from './providers/indexedDbProvider'

// Manager
export {
  getActiveMode,
  getActiveProvider,
  getProvider,
  availableModes,
  restoreStorageOnBoot,
  chooseMode,
  reconnectDisk,
  saveActiveDoc,
  loadActiveDoc,
} from './storageManager'
export type { BootStatus } from './storageManager'

// Autosave + UI
export { useStorageAutoSave } from './useStorageAutoSave'
export type { StorageAutoSaveOptions } from './useStorageAutoSave'
export { default as StorageModeDialog } from './StorageModeDialog'
export type { StorageModeDialogProps } from './StorageModeDialog'
