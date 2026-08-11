import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'

export function useDocVersion(editor: Editor | null): number {
  const [docVersion, setDocVersion] = useState(0)
  useEffect(() => {
    if (!editor) return
    const handleUpdate = () => setDocVersion((v) => v + 1)
    editor.on('update', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor])
  return docVersion
}
