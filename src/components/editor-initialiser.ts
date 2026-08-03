import { useEditor } from '@tiptap/react' // adjust to your real imports
import Document from '@tiptap/extension-document'
import Text from '@tiptap/extension-text'
import { useEditorConfig, useRegisterEditor } from '@/providers/editor-provider'

// Minimal placeholder so useEditor() is never called with an empty schema
// before ScreenplayEditor has pushed a real config down.
const FALLBACK_CONFIG = {
  extensions: [Document.extend({ content: '' }), Text],
  content: { type: 'doc', content: [{ type: 'paragraph', content: [] }] },
}

export default function EditorInitialiser() {
  const { config } = useEditorConfig()

  const editor = useEditor(
    config ?? FALLBACK_CONFIG,
    [config?._version ?? 0], // rebuild only when ScreenplayEditor bumps version
  )

  useRegisterEditor(editor)

  return null
}
