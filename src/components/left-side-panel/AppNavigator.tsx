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
import { useIsMobile } from '@/hooks/use-mobile'

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
    </>
  )

  // Mobile: the panel overlays the content (drawer + backdrop) instead of
  // pushing it aside — there's no room to spare beside the editor on a
  // phone-width screen.
  if (isMobile) {
    return (
      <div className="relative flex h-full w-full">
        <ActivityBar activeView={activeView} onSelectView={setActiveView} />
        <div className="relative h-full min-w-0 flex-1 overflow-hidden">
          {children}
        </div>
        {activeView !== '' && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40"
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
