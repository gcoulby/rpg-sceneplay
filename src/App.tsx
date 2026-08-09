import ScreenplayEditor from '@/components/open-draft/ScreenplayEditor'
import { Toaster } from '@/components/ui/toast'
import HeaderPanel from '@/components/header-panel/header-panel'
import StatusBar from '@/components/status-bar'
import { useEditorStore } from './stores/editorStore'

function App() {
  const editor = useEditorStore((s) => s.editor)
  return (
    <main className="w-dvw h-dvh overflow-hidden">
      <HeaderPanel />
      <ScreenplayEditor />
      <StatusBar editorDoc={editor?.getJSON()} />
      <Toaster />
    </main>
  )
}

export default App
