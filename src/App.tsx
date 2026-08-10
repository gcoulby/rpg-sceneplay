import ScreenplayEditor from '@/components/open-draft/ScreenplayEditor'
import { Toaster } from '@/components/ui/toast'
import HeaderPanel from '@/components/header-panel/header-panel'
import StatusBar from '@/components/status-bar'
import { useEditorStore } from './stores/editorStore'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'
import AppNavigator from './components/left-side-panel/AppNavigator'
function App() {
  const editor = useEditorStore((s) => s.editor)
  useGlobalShortcuts()
  return (
    <main className="w-dvw h-dvh overflow-hidden">
      <HeaderPanel />
      <div className="flex flex-row">
        <AppNavigator editor={editor}>
          <ScreenplayEditor />
          <StatusBar editorDoc={editor?.getJSON()} />
        </AppNavigator>
      </div>
      <Toaster />
    </main>
  )
}

export default App
