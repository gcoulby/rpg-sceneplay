import React, { useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useEditorStore, type NoteColor } from '@/stores/editorStore'
import { useAssetStore } from '@/stores/assetStore'
import { getNoteColorHex } from './noteTypes'
import ScriptNotesTab from './ScriptNotesTab'
import GeneralNotesTab from './GeneralNotesTab'
import * as ActivityPanel from '@/components/ui/activity-panel'

interface NotesPanelProps {
  editor: Editor | null
}

const NotesPanel: React.FC<NotesPanelProps> = ({ editor }) => {
  const {
    notes,
    scenes,
    updateNote,
    deleteNote,
    noteFilter,
    setNoteFilter,
    generalNotes,
    addGeneralNote,
    updateGeneralNote,
    deleteGeneralNote,
    notesActiveTab: activeTab,
    setNotesActiveTab: setActiveTab,
  } = useEditorStore()

  const { assets } = useAssetStore()

  const getSceneName = useCallback(
    (sceneId: string | null) => {
      if (!sceneId) return null
      const scene = scenes.find((s) => s.id === sceneId)
      return scene ? scene.heading : null
    },
    [scenes],
  )

  const handleDeleteNote = useCallback(
    (id: string) => {
      if (editor) {
        const { doc, schema } = editor.state
        const markType = schema.marks.scriptNote
        if (markType) {
          editor
            .chain()
            .focus()
            .command(({ tr }) => {
              doc.descendants((node, pos) => {
                if (!node.isText) return
                const mark = node.marks.find(
                  (m) => m.type === markType && m.attrs.noteId === id,
                )
                if (mark) tr.removeMark(pos, pos + node.nodeSize, mark)
              })
              return true
            })
            .run()
        }
      }
      deleteNote(id)
    },
    [editor, deleteNote],
  )

  const handleColorChange = useCallback(
    (id: string, color: NoteColor) => {
      updateNote(id, { color })
      if (!editor) return
      const hex = getNoteColorHex(color)
      const { doc, schema } = editor.state
      const markType = schema.marks.scriptNote
      if (!markType) return
      editor
        .chain()
        .command(({ tr }) => {
          doc.descendants((node, pos) => {
            if (!node.isText) return
            const mark = node.marks.find(
              (m) => m.type === markType && m.attrs.noteId === id,
            )
            if (mark) {
              tr.removeMark(pos, pos + node.nodeSize, mark)
              tr.addMark(
                pos,
                pos + node.nodeSize,
                markType.create({ noteId: id, color: hex }),
              )
            }
          })
          return true
        })
        .run()
    },
    [editor, updateNote],
  )

  const handleNavigateToNote = useCallback(
    (noteId: string) => {
      if (!editor) return
      const { doc, schema } = editor.state
      const markType = schema.marks.scriptNote
      if (!markType) return

      let targetPos: number | null = null
      doc.descendants((node, pos) => {
        if (targetPos !== null) return false
        if (!node.isText) return
        const mark = node.marks.find(
          (m) => m.type === markType && m.attrs.noteId === noteId,
        )
        if (mark) {
          targetPos = pos
          return false
        }
      })

      if (targetPos !== null) {
        editor.chain().focus().setTextSelection(targetPos).run()
        const coords = editor.view.coordsAtPos(targetPos)
        const editorMain = document.querySelector('.editor-main')
        if (editorMain && coords) {
          const rect = editorMain.getBoundingClientRect()
          const scrollTo =
            editorMain.scrollTop + (coords.top - rect.top) - rect.height / 3
          editorMain.scrollTo({ top: scrollTo, behavior: 'auto' })
        }
      }
    },
    [editor],
  )

  const handleAddGeneralNote = useCallback(() => {
    return addGeneralNote({
      title: '',
      content: '',
      color: 'Yellow' as NoteColor,
    })
  }, [addGeneralNote])

  const formatDate = useCallback((iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  return (
    <ActivityPanel.Shell>
      <ActivityPanel.Header>
        <ActivityPanel.Title>Notes</ActivityPanel.Title>
      </ActivityPanel.Header>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'general' | 'script')}
        className="flex flex-col flex-1 min-h-0"
      >
        <ActivityPanel.SubHeader>
          <TabsList className="w-full shrink-0 rounded-none border-b border-(--fd-border) bg-transparent h-auto p-0">
            <TabsTrigger
              value="general"
              className="flex-1 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-(--fd-accent)"
            >
              General
              {generalNotes.length > 0 ? ` (${generalNotes.length})` : ''}
            </TabsTrigger>
            <TabsTrigger
              value="script"
              className="flex-1 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-(--fd-accent)"
            >
              Script{notes.length > 0 ? ` (${notes.length})` : ''}
            </TabsTrigger>
          </TabsList>
        </ActivityPanel.SubHeader>
        <ActivityPanel.Content headerOffset="8dvh">
          <TabsContent
            value="general"
            className="flex flex-col flex-1 mt-0 min-h-0"
          >
            <GeneralNotesTab
              generalNotes={generalNotes}
              assets={assets}
              onAdd={handleAddGeneralNote}
              onUpdateTitle={(id, title) => updateGeneralNote(id, { title })}
              onUpdateContent={(id, content) =>
                updateGeneralNote(id, { content })
              }
              onUpdateColor={(id, color) => updateGeneralNote(id, { color })}
              onDelete={deleteGeneralNote}
              formatDate={formatDate}
            />
          </TabsContent>

          <TabsContent
            value="script"
            className="flex flex-col flex-1 mt-0 min-h-0"
          >
            <ScriptNotesTab
              notes={notes}
              noteFilter={noteFilter}
              onFilterChange={setNoteFilter}
              getSceneName={getSceneName}
              assets={assets}
              onContentChange={(id, content) => updateNote(id, { content })}
              onColorChange={handleColorChange}
              onDelete={handleDeleteNote}
              onNavigateToNote={handleNavigateToNote}
              formatDate={formatDate}
            />
          </TabsContent>
        </ActivityPanel.Content>
      </Tabs>
    </ActivityPanel.Shell>
  )
}

export default NotesPanel
