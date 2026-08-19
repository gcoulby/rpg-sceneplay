import React, { useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import ActivityBar from './ActivityBar'
import ScenesPanel from './scenes-panel/ScenesPanel'
import PagesPanel from './pages-panel/PagesPanel'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../ui/resizable'
import type { PanelImperativeHandle } from 'react-resizable-panels'
import LocationsPanel from './locations-panel/LocationsPanel'
import StructurePanel from './structures-panel/StructurePanel'
import TagsPanel from './tags-panel/TagsPanel'
import NotesPanel from './notes-tab/NotesPanel'
import CharacterProfilesPanel from './character-panel/CharacterProfilesPanel'
import IndexCardsPanel from './index-card-panel/IndexCardsPanel'
import { useActivityBarStore } from '@/stores/activity-bar-store'
import { InspirationPanel } from './oracles/inspiration-panel'
import { RollerPanel } from './oracles/roller-panel'
import { OraclePanel } from './oracles/oracle-panel'
import RollsPanel from './rolls-tab/RollsPanel'
import PdfToolsPanel from './pdf-tools-panel/PdfToolsPanel'
import { useIsMobile } from '@/hooks/use-mobile'
import { useMainTabStore } from '@/stores/mainTabStore'

interface AppNavigatorProps {
  editor: Editor | null
  scrollContainer?: HTMLDivElement | null
  children: React.ReactNode
}

const AppNavigator: React.FC<AppNavigatorProps> = ({
  editor,
  scrollContainer,
  children,
}) => {
  const activeView = useActivityBarStore((state) => state.activeView)
  const setActiveView = useActivityBarStore((state) => state.setActiveView)
  const panelRef = useRef<PanelImperativeHandle>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) return // overlay mode below doesn't use the resizable panel
    if (activeView === '') {
      panelRef.current?.collapse()
    } else {
      panelRef.current?.resize(300)
    }
  }, [activeView, isMobile])

  // Every side panel is a companion to a specific main tab — PDF Tools goes
  // with the PDF viewer, everything else goes with the editor — so selecting
  // one also switches the main content area to match. An empty activeView
  // just means the sidebar was closed, not a new panel selected, so that
  // shouldn't force a tab switch.
  useEffect(() => {
    if (activeView === 'pdf-tools') {
      useMainTabStore.getState().setActiveTab('pdf-viewer')
    } else if (
      ['oracles', 'inspiration', 'dice-roller', 'rolls'].includes(activeView)
    ) {
      // don't switch
    } else if (activeView !== '') {
      useMainTabStore.getState().setActiveTab('editor')
    }
  }, [activeView])

  const panelContent = (
    <>
      {activeView === 'scenes' && (
        <ScenesPanel editor={editor} scrollContainer={scrollContainer} />
      )}
      {activeView === 'pages' && (
        <PagesPanel editor={editor} scrollContainer={scrollContainer} />
      )}
      {activeView === 'locations' && (
        <LocationsPanel editor={editor} scrollContainer={scrollContainer} />
      )}
      {activeView === 'structure' && <StructurePanel editor={editor} />}
      {activeView === 'tags' && <TagsPanel editor={editor} />}
      {activeView === 'notes' && <NotesPanel editor={editor} />}
      {activeView === 'characters' && (
        <CharacterProfilesPanel editor={editor} projectId="" />
      )}
      {activeView === 'index-cards' && <IndexCardsPanel editor={editor} />}
      {activeView === 'oracles' && <OraclePanel />}
      {activeView === 'inspiration' && <InspirationPanel />}
      {activeView === 'dice-roller' && <RollerPanel />}
      {activeView === 'rolls' && <RollsPanel editor={editor} />}
      {activeView === 'pdf-tools' && <PdfToolsPanel />}
    </>
  )

  // Mobile: the panel overlays the content (drawer + backdrop) instead of
  // pushing it aside — there's no room to spare beside the editor on a
  // phone-width screen.
  if (isMobile) {
    return (
      <div className="relative flex w-full h-full">
        <ActivityBar activeView={activeView} onSelectView={setActiveView} />
        <div className="relative flex-1 min-w-0 h-full overflow-hidden">
          {children}
        </div>
        {activeView !== '' && (
          <>
            <div
              className="z-40 fixed inset-0 bg-black/40"
              onClick={() => setActiveView('')}
            />
            <div className="fixed inset-y-0 left-12 z-50 flex w-[85vw] max-w-sm flex-col overflow-hidden border-r bg-(--fd-navigator-bg) shadow-lg">
              {panelContent}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ActivityBar activeView={activeView} onSelectView={setActiveView} />

      <ResizablePanel
        panelRef={panelRef}
        collapsible={true}
        collapsedSize={0}
        defaultSize={300}
        minSize={0}
      >
        {panelContent}
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>{children}</ResizablePanel>
    </ResizablePanelGroup>
  )
}

export default AppNavigator
