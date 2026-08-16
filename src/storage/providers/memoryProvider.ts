/**
 * "Import File without Persistence" — loads a `.sceneplay`/`.odraft` once,
 * holds it in memory, and never writes anywhere on its own. Saving out of this
 * mode is File → Export, same as always.
 */
import type { StorageDoc, StorageDocSummary, StorageProvider } from '../types'
import { openBinaryFile } from '../fileOps'
import { parseSceneplayAny } from '../formats/sceneplayFormat'

const DOC_ID = 'memory-doc'

class MemoryProvider implements StorageProvider {
  readonly mode = 'memory' as const
  readonly label = 'Import File without Persistence'
  private doc: StorageDoc | null = null
  private sourceName: string | null = null

  isReady(): boolean {
    return this.doc !== null
  }
  get filename(): string | null {
    return this.sourceName
  }
  async list(): Promise<StorageDocSummary[]> {
    return []
  }

  async connect(): Promise<boolean> {
    const result = await openBinaryFile([
      { name: 'Sceneplay', extensions: ['sceneplay', 'odraft'] },
    ])
    if (!result) return false
    const parsed = await parseSceneplayAny(result.content)
    this.doc = {
      id: DOC_ID,
      meta: parsed.meta,
      content: parsed.content,
      assets: parsed.assets,
      updatedAt: new Date().toISOString(),
    }
    this.sourceName = result.name
    return true
  }

  disconnect(): void {
    this.doc = null
    this.sourceName = null
  }
  async load(): Promise<StorageDoc | null> {
    return this.doc
  }
  async save(doc: StorageDoc): Promise<void> {
    this.doc = doc
  }
}

export const memoryProvider = new MemoryProvider()
