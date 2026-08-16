import React, {
  useCallback,
  useState,
  useRef,
  useEffect,
  useMemo,
  type CSSProperties,
} from 'react'
import { Editor } from '@tiptap/react'
import type { Node as PMNode } from '@tiptap/pm/model'
import { useEditorStore, type SceneInfo } from '@/stores/editorStore'
import { computeSceneLengths } from '@/editor/pagination'
import { computeSceneTiming } from '@/utils/open-draft/scriptTiming'
import { useDocVersion } from '../utils/useDocVersion'
import {
  calcGridInsertIndex,
  calcListInsertIndex,
  getGridInsertIndicatorStyle,
  getListInsertIndicatorStyle,
} from './indexCardsGeometry'
import { useReorderHistory } from './useReorderHistory'
import IndexCardsToolbar from './IndexCardsToolbar'
import IndexCard from './IndexCard'
import DragGhost from './DragGhost'
import SynopsisDialog from '@/components/plugins/synopsis-dialog/synopsis-dialog'
import * as ActivityPanel from '@/components/ui/activity-panel'
import { Button } from '@/components/ui/button'

interface IndexCardsPanelProps {
  editor: Editor | null
}

const IndexCardsPanel: React.FC<IndexCardsPanelProps> = ({ editor }) => {
  const { scenes, updateSceneSynopsis, updateSceneColor, pageLayout } =
    useEditorStore()

  const [fullscreen, setFullscreen] = useState(false)
  const [reorderMode, setDragMode] = useState(false)
  const [pendingScenes, setPendingScenes] = useState<SceneInfo[] | null>(null)
  const [originalScenes, setOriginalScenes] = useState<SceneInfo[] | null>(null)

  const { canUndo, canRedo, reset, clear, push, undo, redo } =
    useReorderHistory(reorderMode, setPendingScenes)

  useEffect(() => {
    if (!reorderMode) return
    const handleKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        e.stopImmediatePropagation()
        undo()
      } else if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        e.stopImmediatePropagation()
        redo()
      } else if (mod && e.key === 'y') {
        e.preventDefault()
        e.stopImmediatePropagation()
        redo()
      }
    }

    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [reorderMode, undo, redo])

  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const [indicatorStyle, setIndicatorStyle] = useState<CSSProperties | null>(
    null,
  )
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const [dragCardSize, setDragCardSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  })
  const [dragCardHtml, setDragCardHtml] = useState<string>('')
  const gridRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollSpeedRef = useRef(0)
  const scrollRafRef = useRef<number>(0)
  const lastClientPosRef = useRef<{ x: number; y: number } | null>(null)

  const [synopsisModal, setSynopsisModal] = useState<{
    sceneIdx: number
    id: string
    heading: string
    synopsis: string
    color: string
  } | null>(null)

  const handleSaveSynopsis = useCallback(
    (synopsis: string, color: string, timingOverride?: number | null) => {
      if (!synopsisModal || !editor) return
      const { sceneIdx, id } = synopsisModal
      updateSceneSynopsis(id, synopsis)
      updateSceneColor(id, color)
      let currentScene = -1
      let targetPos = -1
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'sceneHeading') {
          currentScene++
          if (currentScene === sceneIdx) {
            targetPos = pos
            return false
          }
        }
        return true
      })
      if (targetPos >= 0) {
        const node = editor.state.doc.nodeAt(targetPos)
        if (node) {
          const { tr } = editor.state
          const newAttrs = {
            ...node.attrs,
            synopsis,
            sceneColor: color,
            timingOverride: timingOverride ?? null,
          }
          tr.setNodeMarkup(targetPos, undefined, newAttrs)
          tr.setMeta('addToHistory', false)
          editor.view.dispatch(tr)
        }
      }
    },
    [synopsisModal, editor, updateSceneSynopsis, updateSceneColor],
  )

  const displayScenes = pendingScenes ?? scenes

  const hasChanges = !!(
    pendingScenes &&
    originalScenes &&
    pendingScenes.some((s, i) => s.id !== originalScenes[i]?.id)
  )

  const docVersion = useDocVersion(editor)

  const sceneLengths = useMemo(() => {
    void docVersion
    if (!editor) return []
    try {
      return computeSceneLengths(editor.state.doc, pageLayout)
    } catch {
      return []
    }
  }, [editor, pageLayout, docVersion])

  const sceneTimings = useMemo(() => {
    void docVersion
    if (!editor) return []
    try {
      return computeSceneTiming(editor.getJSON()).scenes
    } catch {
      return []
    }
  }, [editor, docVersion])

  const [originalIndexMap, setOriginalIndexMap] = useState<Map<string, number>>(
    new Map(),
  )

  const updateSynopsisAttr = useCallback(
    (sceneId: string, synopsis: string) => {
      if (!editor) return
      const sceneIndex = parseInt(sceneId.replace('scene-', ''), 10) - 1
      if (isNaN(sceneIndex) || sceneIndex < 0) return

      let currentScene = -1
      let targetPos = -1
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'sceneHeading') {
          currentScene++
          if (currentScene === sceneIndex) {
            targetPos = pos
            return false
          }
        }
        return true
      })

      if (targetPos >= 0) {
        const node = editor.state.doc.nodeAt(targetPos)
        if (node) {
          const { tr } = editor.state
          tr.setNodeMarkup(targetPos, undefined, { ...node.attrs, synopsis })
          tr.setMeta('addToHistory', false)
          editor.view.dispatch(tr)
        }
      }
    },
    [editor],
  )

  const goToScene = useCallback(
    (sceneIndex: number) => {
      if (!editor) return
      const { doc } = editor.state
      let currentScene = -1
      let targetPos = 0

      doc.descendants((node, pos) => {
        if (node.type.name === 'sceneHeading') {
          currentScene++
          if (currentScene === sceneIndex) {
            targetPos = pos
            return false
          }
        }
        return true
      })

      editor
        .chain()
        .focus()
        .setTextSelection(targetPos + 1)
        .run()

      requestAnimationFrame(() => {
        const coords = editor.view.coordsAtPos(targetPos + 1)
        const editorMain = document.querySelector('.editor-main')
        if (editorMain && coords) {
          const rect = editorMain.getBoundingClientRect()
          const scrollTo = editorMain.scrollTop + (coords.top - rect.top) - 60
          editorMain.scrollTo({ top: scrollTo, behavior: 'smooth' })
        }
      })

      if (fullscreen) setFullscreen(false)
    },
    [editor, fullscreen],
  )

  const getSceneRanges = useCallback(() => {
    if (!editor) return []
    const { doc } = editor.state
    const headingPositions: number[] = []

    doc.descendants((node, pos) => {
      if (node.type.name === 'sceneHeading') {
        headingPositions.push(pos)
      }
    })

    const ranges: Array<{ from: number; to: number }> = []
    for (let i = 0; i < headingPositions.length; i++) {
      const from = headingPositions[i]
      const to =
        i + 1 < headingPositions.length
          ? headingPositions[i + 1]
          : doc.content.size
      ranges.push({ from, to })
    }
    return ranges
  }, [editor])

  const enterReorderMode = useCallback(() => {
    const snapshot = [...scenes]
    setPendingScenes(snapshot)
    setOriginalScenes(snapshot)
    const map = new Map<string, number>()
    snapshot.forEach((s, i) => map.set(s.id, i + 1))
    setOriginalIndexMap(map)
    reset(snapshot)
    setDragMode(true)
  }, [scenes, reset])

  const cancelReorder = useCallback(() => {
    setPendingScenes(null)
    setOriginalScenes(null)
    setOriginalIndexMap(new Map())
    clear()
    setDragMode(false)
  }, [clear])

  const applyReorder = useCallback(() => {
    if (!editor || !pendingScenes || !originalScenes) {
      cancelReorder()
      return
    }

    const changed = pendingScenes.some((s, i) => s.id !== originalScenes[i]?.id)
    if (!changed) {
      cancelReorder()
      return
    }

    const ranges = getSceneRanges()
    if (ranges.length === 0 || ranges.length !== originalScenes.length) {
      cancelReorder()
      return
    }

    const { doc, tr } = editor.state
    const sceneStart = ranges[0].from
    const sceneEnd = ranges[ranges.length - 1].to

    const idToOrigIdx = new Map<string, number>()
    originalScenes.forEach((s, i) => idToOrigIdx.set(s.id, i))

    const sliceContents = ranges.map((r) => doc.slice(r.from, r.to).content)

    const nodes: PMNode[] = []
    for (const scene of pendingScenes) {
      const origIdx = idToOrigIdx.get(scene.id)
      if (origIdx === undefined) continue
      sliceContents[origIdx].forEach((node) => nodes.push(node))
    }

    tr.replaceWith(sceneStart, sceneEnd, nodes)
    editor.view.dispatch(tr)

    setPendingScenes(null)
    setOriginalScenes(null)
    setOriginalIndexMap(new Map())
    clear()
    setDragMode(false)
  }, [
    editor,
    pendingScenes,
    originalScenes,
    getSceneRanges,
    cancelReorder,
    clear,
  ])

  const pendingScenesRef = useRef(pendingScenes)
  const pushRef = useRef(push)
  const fullscreenRef = useRef(fullscreen)
  useEffect(() => {
    pendingScenesRef.current = pendingScenes
    pushRef.current = push
    fullscreenRef.current = fullscreen
  })

  const handleDragHandleDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.preventDefault()
      e.stopPropagation()

      const handle = e.currentTarget as HTMLElement
      handle.setPointerCapture(e.pointerId)

      const card = handle.closest('.index-card') as HTMLElement | null
      if (card) {
        const rect = card.getBoundingClientRect()
        setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setDragCardSize({ w: rect.width, h: rect.height })
        setDragCardHtml(card.innerHTML)
      }

      setDragIdx(index)
      setDragPos({ x: e.clientX, y: e.clientY })
      setIndicatorStyle(null)
      scrollSpeedRef.current = 0
      lastClientPosRef.current = { x: e.clientX, y: e.clientY }

      const calcGap = (clientX: number, clientY: number): number | null => {
        if (!gridRef.current) return null
        return fullscreenRef.current
          ? calcGridInsertIndex(gridRef.current, clientX, clientY)
          : calcListInsertIndex(gridRef.current, clientY)
      }

      const updateIndicator = (gap: number | null) => {
        if (gap === null || !gridRef.current) {
          setIndicatorStyle(null)
          return
        }
        const total = (pendingScenesRef.current ?? []).length
        setIndicatorStyle(
          fullscreenRef.current
            ? getGridInsertIndicatorStyle(gridRef.current, index, gap, total)
            : getListInsertIndicatorStyle(gridRef.current, index, gap, total),
        )
      }

      const scrollLoop = () => {
        const container = containerRef.current
        if (container && scrollSpeedRef.current !== 0) {
          container.scrollTop += scrollSpeedRef.current
          if (lastClientPosRef.current) {
            const gap = calcGap(
              lastClientPosRef.current.x,
              lastClientPosRef.current.y,
            )
            updateIndicator(gap)
          }
        }
        scrollRafRef.current = requestAnimationFrame(scrollLoop)
      }
      scrollRafRef.current = requestAnimationFrame(scrollLoop)

      const cleanup = () => {
        handle.removeEventListener('pointermove', handleMove)
        handle.removeEventListener('pointerup', handleUp)
        handle.removeEventListener('pointercancel', handleUp)
        handle.releasePointerCapture(e.pointerId)
        cancelAnimationFrame(scrollRafRef.current)
        scrollSpeedRef.current = 0
        lastClientPosRef.current = null
        document.body.style.cursor = ''
        setDragIdx(null)
        setIndicatorStyle(null)
        setDragPos(null)
      }

      const handleMove = (ev: PointerEvent) => {
        ev.preventDefault()
        setDragPos({ x: ev.clientX, y: ev.clientY })
        lastClientPosRef.current = { x: ev.clientX, y: ev.clientY }
        updateIndicator(calcGap(ev.clientX, ev.clientY))

        const container = containerRef.current
        if (container) {
          const rect = container.getBoundingClientRect()
          const EDGE = 60
          const MAX = 12
          if (ev.clientY < rect.top + EDGE) {
            const t = 1 - Math.max(0, ev.clientY - rect.top) / EDGE
            scrollSpeedRef.current = -(t * MAX)
          } else if (ev.clientY > rect.bottom - EDGE) {
            const t = 1 - Math.max(0, rect.bottom - ev.clientY) / EDGE
            scrollSpeedRef.current = t * MAX
          } else {
            scrollSpeedRef.current = 0
          }
        }
      }

      const handleUp = (ev: PointerEvent) => {
        const gap = calcGap(ev.clientX, ev.clientY)
        cleanup()

        if (gap !== null && pendingScenesRef.current) {
          let toIndex = gap
          if (index < gap && gap <= pendingScenesRef.current.length - 1)
            toIndex--
          if (toIndex !== index) {
            const updated = [...pendingScenesRef.current]
            const [moved] = updated.splice(index, 1)
            updated.splice(toIndex, 0, moved)
            setPendingScenes(updated)
            pushRef.current(updated)
          }
        }
      }

      document.body.style.cursor = 'grabbing'
      handle.addEventListener('pointermove', handleMove)
      handle.addEventListener('pointerup', handleUp)
      handle.addEventListener('pointercancel', handleUp)
    },
    [],
  )

  const containerClass = fullscreen
    ? 'fixed inset-0 z-50 bg-background flex flex-col overflow-hidden'
    : 'flex flex-col h-full bg-background overflow-hidden'

  const gridClass = fullscreen
    ? 'gap-4 grid [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))] p-4 px-6 content-start max-md:[grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]'
    : 'gap-3 grid grid-cols-1 content-start p-3 px-0'

  return (
    <div className={containerClass} ref={containerRef}>
      <ActivityPanel.Shell>
        <ActivityPanel.Header>
          <ActivityPanel.Title>Index Cards</ActivityPanel.Title>
          <ActivityPanel.Meta>{scenes.length} scenes</ActivityPanel.Meta>
          <ActivityPanel.Interactions>
            {reorderMode ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={cancelReorder}
                title="Cancel reorder mode"
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={enterReorderMode}
                title="Enter reorder mode"
              >
                Reorder
              </Button>
            )}
          </ActivityPanel.Interactions>
        </ActivityPanel.Header>
        {reorderMode && (
          <ActivityPanel.SubHeader>
            <IndexCardsToolbar
              sceneCount={scenes.length}
              dragMode={reorderMode}
              fullscreen={fullscreen}
              canUndo={canUndo}
              canRedo={canRedo}
              hasChanges={hasChanges}
              onUndo={undo}
              onRedo={redo}
              onCancelReorder={cancelReorder}
              onApplyReorder={applyReorder}
              onEnterReorderMode={enterReorderMode}
              onToggleFullscreen={() => setFullscreen((v) => !v)}
            />
          </ActivityPanel.SubHeader>
        )}
        <ActivityPanel.Content headerOffset={reorderMode ? '10dvh' : '2dvh'}>
          <div
            className={`${gridClass} flex-1 overflow-y-auto relative px-4`}
            ref={gridRef}
          >
            {displayScenes.length === 0 ? (
              <div className="col-span-full  text-(--fd-text-muted) text-xs italic text-center">
                No scenes yet. Write a scene heading to see index cards here.
              </div>
            ) : (
              <div className="p-0">
                {displayScenes.map((scene, index) => (
                  <IndexCard
                    key={scene.id}
                    scene={scene}
                    index={index}
                    dragMode={reorderMode}
                    isDragging={dragIdx === index}
                    origNum={originalIndexMap.get(scene.id)}
                    pageLength={sceneLengths[index]}
                    finalSeconds={sceneTimings[index]?.finalSeconds}
                    onNavigate={() => goToScene(index)}
                    onSynopsisChange={(value) => {
                      updateSceneSynopsis(scene.id, value)
                      updateSynopsisAttr(scene.id, value)
                    }}
                    onExpandSynopsis={() =>
                      setSynopsisModal({
                        sceneIdx: index,
                        id: scene.id,
                        heading: scene.heading,
                        synopsis: scene.synopsis,
                        color: scene.color,
                      })
                    }
                    onDragHandleDown={(e) => handleDragHandleDown(e, index)}
                  />
                ))}
                {indicatorStyle && (
                  <div
                    className="bg-(--fd-accent) rounded-sm"
                    style={indicatorStyle}
                  >
                    <div
                      className={
                        fullscreen
                          ? 'absolute -top-1 -left-0.75 w-2.25 h-2.25 rounded-full bg-(--fd-accent)'
                          : 'absolute top-1/2 -left-1 -translate-y-1/2 w-2.25 h-2.25 rounded-full bg-(--fd-accent)'
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </ActivityPanel.Content>

        <SynopsisDialog
          key={synopsisModal?.id ?? 'none'}
          open={synopsisModal !== null}
          onOpenChange={(o) => {
            if (!o) setSynopsisModal(null)
          }}
          sceneHeading={synopsisModal?.heading ?? ''}
          synopsis={synopsisModal?.synopsis ?? ''}
          sceneColor={synopsisModal?.color}
          pageLength={
            synopsisModal ? sceneLengths[synopsisModal.sceneIdx] : undefined
          }
          autoTimingSeconds={
            synopsisModal
              ? sceneTimings[synopsisModal.sceneIdx]?.autoEstimateSeconds
              : undefined
          }
          timingOverride={
            synopsisModal
              ? sceneTimings[synopsisModal.sceneIdx]?.overrideSeconds
              : undefined
          }
          onSave={handleSaveSynopsis}
        />

        {dragIdx !== null && dragPos && dragCardHtml && (
          <DragGhost
            html={dragCardHtml}
            x={dragPos.x - dragOffset.x}
            y={dragPos.y - dragOffset.y}
            width={dragCardSize.w}
            height={dragCardSize.h}
          />
        )}
      </ActivityPanel.Shell>
    </div>
  )
}

export default IndexCardsPanel
