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
import StoryCubes from './story-cubes/story-cubes'

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

  useEffect(() => {
    if (activeView === '') {
      panelRef.current?.collapse()
    } else {
      panelRef.current?.resize(300)
    }
  }, [activeView])

  return (
    <>
      <ResizablePanelGroup orientation="horizontal">
        <ActivityBar activeView={activeView} onSelectView={setActiveView} />

        <ResizablePanel
          panelRef={panelRef}
          collapsible={true}
          collapsedSize={0}
          defaultSize={300}
          minSize={0}
        >
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
          {activeView === 'story-cubes' && <StoryCubes />}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>{children}</ResizablePanel>
      </ResizablePanelGroup>
    </>
  )
}

export default AppNavigator
