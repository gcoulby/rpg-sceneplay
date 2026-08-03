import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Editor, EditorOptions } from '@tiptap/react'

type EditorConfig = Partial<EditorOptions> & { _version: number }

interface EditorContextValue {
  editor: Editor | null
  registerEditor: (editor: Editor | null) => void
  config: EditorConfig | null
  setConfig: (config: Omit<EditorConfig, '_version'>) => void
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const [config, setConfigState] = useState<EditorConfig | null>(null)
  const versionRef = { current: 0 } // per-render is fine; see note below

  const registerEditor = useCallback((e: Editor | null) => setEditor(e), [])

  // Bumping _version forces EditorInitializer's useEditor() to rebuild —
  // same job editorKey did before, just driven from the caller's config
  // instead of local state.
  const setConfig = useCallback((next: Omit<EditorConfig, '_version'>) => {
    setConfigState((prev) => ({ ...next, _version: (prev?._version ?? 0) + 1 }))
  }, [])

  return (
    <EditorContext.Provider
      value={{ editor, registerEditor, config, setConfig }}
    >
      {children}
    </EditorContext.Provider>
  )
}

export function useSharedEditor(): Editor | null {
  const ctx = useContext(EditorContext)
  if (!ctx)
    throw new Error('useSharedEditor must be used inside EditorProvider')
  return ctx.editor
}

/** Called by the component that owns the real useEditor() invocation
 *  (EditorInitializer) to report the instance back up. */
export function useRegisterEditor(editor: Editor | null) {
  const ctx = useContext(EditorContext)
  if (!ctx)
    throw new Error('useRegisterEditor must be used inside EditorProvider')
  ctx.registerEditor(editor)
}

/** Called by ScreenplayEditor (or anything else that needs an editor) to
 *  describe what it wants. EditorInitializer reads this and builds it. */
export function useEditorConfig() {
  const ctx = useContext(EditorContext)
  if (!ctx)
    throw new Error('useEditorConfig must be used inside EditorProvider')
  return { config: ctx.config, setConfig: ctx.setConfig }
}
