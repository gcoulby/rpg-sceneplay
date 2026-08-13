import ScreenplayEditor from '@/components/open-draft/ScreenplayEditor'
import { Toaster } from '@/components/ui/toast'
import HeaderPanel from '@/components/header-panel/header-panel'
import StatusBar from '@/components/status-bar'
import { useEditorStore } from './stores/editorStore'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'
import AppNavigator from './components/left-side-panel/AppNavigator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { ChartAreaIcon, MapIcon, PencilLine, SquareKanban } from 'lucide-react'
import BeatBoard from './components/screens/beat-board'
import ScriptStatistics from './components/screens/analytics/ScriptStatistics'
import { ScriptContextMenuController } from '@/components/context-menu/ScriptContextMenuController'
import { MapScreen } from './components/screens/map/map-screen'
import { useMainTabStore, type MainTab } from '@/stores/mainTabStore'
function App() {
  const editor = useEditorStore((s) => s.editor)
  const activeTab = useMainTabStore((s) => s.activeTab)
  const setActiveTab = useMainTabStore((s) => s.setActiveTab)
  useGlobalShortcuts()
  return (
    <main className="w-dvw h-dvh overflow-hidden">
      <HeaderPanel />
      <div className="flex flex-row gap-0!">
        <AppNavigator editor={editor}>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as MainTab)}
            className="gap-0 bg-background"
          >
            <TabsList className="h-(--tabbar-h)! p-0 gap-2 bg-background">
              <TabsTrigger
                value="editor"
                className="data-active:bg-primary data-active:text-primary-foreground"
              >
                <PencilLine />
                Editor
              </TabsTrigger>
              <TabsTrigger value="map">
                <MapIcon />
                Map
              </TabsTrigger>
              <TabsTrigger value="beat-board">
                <SquareKanban />
                Beat Board
              </TabsTrigger>
              <TabsTrigger value="statistics">
                <ChartAreaIcon />
                Script Statistics
              </TabsTrigger>
            </TabsList>
            <TabsContent value="editor" keepMounted>
              <div className="h-(--app-h)! w-full overflow-hidden">
                <ScreenplayEditor />
              </div>
            </TabsContent>
            <TabsContent value="map">
              <div className="h-(--app-h)! w-full overflow-hidden">
                <MapScreen />
              </div>
            </TabsContent>
            <TabsContent value="beat-board">
              <div className="h-(--app-h)! w-full overflow-hidden">
                <BeatBoard />
              </div>
            </TabsContent>
            <TabsContent value="statistics">
              <div className="h-(--app-h)! w-full overflow-hidden">
                {editor && <ScriptStatistics editor={editor} />}
              </div>
            </TabsContent>
          </Tabs>
          <StatusBar editorDoc={editor?.getJSON()} />
        </AppNavigator>
      </div>
      <Toaster />
      <ScriptContextMenuController />
    </main>
  )
}

export default App
