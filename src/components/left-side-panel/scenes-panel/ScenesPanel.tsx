import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Filter, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditorStore } from '@/stores/editorStore'
import { computeSceneLengths } from '@/editor/pagination'
import { computeSceneTiming } from '@/utils/open-draft/scriptTiming'
import {
  computeScriptStructure,
  sceneActLabel,
  type ScriptStructure,
} from '@/utils/open-draft/scriptStructure'
import { parseHeading } from '../utils/scene-utils'
import { characterKey, singleLine } from '@/utils/open-draft/nodeText'
import { useGoToScene } from '../utils/useGoToScene'
import SceneFilterPanel from './SceneFilterPanel'
import SceneListItem from './SceneListItem'
import SynopsisDialog from '@/components/plugins/synopsis-dialog/synopsis-dialog'
import * as ActivityPanel from '@/components/ui/activity-panel'

interface ScenesPanelProps {
  editor: Editor | null
  scrollContainer?: HTMLDivElement | null
}

export interface SceneDetail {
  characters: string[]
  location: string
  prefix: string
  timeOfDay: string
  pageLength: number
}

const ScenesPanel: React.FC<ScenesPanelProps> = ({
  editor,
  scrollContainer,
}) => {
  const { scenes, updateSceneSynopsis, updateSceneColor } = useEditorStore()
  const pageLayout = useEditorStore((s) => s.pageLayout)
  const { goToScene } = useGoToScene(editor, scrollContainer)

  const [expandedSceneIdx, setExpandedSceneIdx] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrollingUp, setScrollingUp] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)

  const [showFilters, setShowFilters] = useState(false)
  const [filterCharacters, setFilterCharacters] = useState<string[]>([])
  const [filterLocation, setFilterLocation] = useState('')
  const [filterPrefix, setFilterPrefix] = useState('')
  const [filterTime, setFilterTime] = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [filterSynopsis, setFilterSynopsis] = useState('')

  const [synopsisModal, setSynopsisModal] = useState<{
    sceneIdx: number
    id: string
    heading: string
    synopsis: string
    color: string
  } | null>(null)

  const [docVersion, setDocVersion] = useState(0)
  useEffect(() => {
    if (!editor) return
    const handleUpdate = () => setDocVersion((v) => v + 1)
    editor.on('update', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor])

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

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    lastScrollTop.current = el.scrollTop
    const onScroll = () => {
      const top = el.scrollTop
      if (top < lastScrollTop.current) setScrollingUp(true)
      else if (top > lastScrollTop.current) setScrollingUp(false)
      lastScrollTop.current = top
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const sceneDetails = useMemo((): SceneDetail[] => {
    if (!editor) return []
    void docVersion
    void scenes
    const doc = editor.state.doc
    const lengths = computeSceneLengths(doc, pageLayout)
    const details: SceneDetail[] = []
    let currentChars = new Set<string>()
    let currentHeading = ''
    let inScene = false

    doc.forEach((node) => {
      if (node.type.name === 'sceneHeading') {
        if (inScene) {
          const parsed = parseHeading(currentHeading)
          details.push({
            characters: Array.from(currentChars),
            location: parsed.location,
            prefix: parsed.prefix,
            timeOfDay: parsed.timeOfDay,
            pageLength: lengths[details.length] || 0,
          })
        }
        currentHeading = singleLine(node.textContent || '')
        currentChars = new Set()
        inScene = true
      } else if (node.type.name === 'character' && inScene) {
        const base = characterKey(node.textContent)
        if (base) currentChars.add(base)
      }
    })

    if (inScene) {
      const parsed = parseHeading(currentHeading)
      details.push({
        characters: Array.from(currentChars),
        location: parsed.location,
        prefix: parsed.prefix,
        timeOfDay: parsed.timeOfDay,
        pageLength: lengths[details.length] || 0,
      })
    }
    return details
  }, [editor, scenes, pageLayout, docVersion])

  const sceneTimings = useMemo(() => {
    if (!editor) return []
    void docVersion
    void scenes
    try {
      return computeSceneTiming(editor.getJSON()).scenes
    } catch {
      return []
    }
  }, [editor, scenes, docVersion])

  const structure: ScriptStructure = useMemo(() => {
    if (!editor) return { acts: [], sceneActMap: new Map(), totalScenes: 0 }
    void docVersion
    void scenes
    try {
      return computeScriptStructure(editor.getJSON())
    } catch {
      return { acts: [], sceneActMap: new Map(), totalScenes: 0 }
    }
  }, [editor, scenes, docVersion])

  const allCharacters = useMemo(() => {
    const chars = new Set<string>()
    sceneDetails.forEach((d) => d.characters.forEach((c) => chars.add(c)))
    return Array.from(chars).sort()
  }, [sceneDetails])

  const allLocations = useMemo(() => {
    const locs = new Set<string>()
    sceneDetails.forEach((d) => {
      if (d.location) locs.add(d.location.toUpperCase())
    })
    return Array.from(locs).sort()
  }, [sceneDetails])

  const allPrefixes = useMemo(() => {
    const p = new Set<string>()
    sceneDetails.forEach((d) => {
      if (d.prefix) p.add(d.prefix)
    })
    return Array.from(p).sort()
  }, [sceneDetails])

  const allTimes = useMemo(() => {
    const t = new Set<string>()
    sceneDetails.forEach((d) => {
      if (d.timeOfDay) t.add(d.timeOfDay)
    })
    return Array.from(t).sort()
  }, [sceneDetails])

  const hasActiveFilter =
    filterCharacters.length > 0 ||
    !!filterLocation ||
    !!filterPrefix ||
    !!filterTime ||
    !!filterColor ||
    !!filterSynopsis

  const filteredIndices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const synopsisPhrase = filterSynopsis.trim().toLowerCase()
    if (!hasActiveFilter && !query) return scenes.map((_, i) => i)
    return scenes.reduce((acc, scene, idx) => {
      const detail = sceneDetails[idx]
      if (!detail) return acc
      if (query) {
        const headingMatch = scene.heading.toLowerCase().includes(query)
        const synopsisMatch = (scene.synopsis || '')
          .toLowerCase()
          .includes(query)
        if (!headingMatch && !synopsisMatch) return acc
      }
      if (
        filterCharacters.length > 0 &&
        !filterCharacters.every((c) => detail.characters.includes(c))
      )
        return acc
      if (filterLocation && detail.location.toUpperCase() !== filterLocation)
        return acc
      if (filterPrefix && detail.prefix !== filterPrefix) return acc
      if (filterTime && detail.timeOfDay !== filterTime) return acc
      if (filterColor && (scene.color || '') !== filterColor) return acc
      if (
        synopsisPhrase &&
        !(scene.synopsis || '').toLowerCase().includes(synopsisPhrase)
      )
        return acc
      acc.push(idx)
      return acc
    }, [] as number[])
  }, [
    scenes,
    sceneDetails,
    searchQuery,
    filterCharacters,
    filterLocation,
    filterPrefix,
    filterTime,
    filterColor,
    filterSynopsis,
    hasActiveFilter,
  ])

  const clearAllFilters = useCallback(() => {
    setFilterCharacters([])
    setFilterLocation('')
    setFilterPrefix('')
    setFilterTime('')
    setFilterColor('')
    setFilterSynopsis('')
  }, [])

  return (
    <ActivityPanel.Shell>
      <ActivityPanel.Header>
        <ActivityPanel.Title>Scenes</ActivityPanel.Title>
        <ActivityPanel.Meta>
          {hasActiveFilter || searchQuery ? `${filteredIndices.length}/` : ''}
          {scenes.length}
        </ActivityPanel.Meta>
        <ActivityPanel.Interactions>
          <Button
            variant="ghost"
            size="icon"
            className={`ml-auto size-8 ${hasActiveFilter ? 'text-(--fd-accent)' : 'text-(--fd-text-muted)'}`}
            onClick={() => setShowFilters((v) => !v)}
            title="Filter scenes"
          >
            <Filter
              className="size-4"
              fill={hasActiveFilter ? 'currentColor' : 'none'}
            />
          </Button>
        </ActivityPanel.Interactions>
      </ActivityPanel.Header>
      <ActivityPanel.SubHeader>
        {showFilters && (
          <SceneFilterPanel
            allCharacters={allCharacters}
            allLocations={allLocations}
            allPrefixes={allPrefixes}
            allTimes={allTimes}
            filterCharacters={filterCharacters}
            filterLocation={filterLocation}
            filterPrefix={filterPrefix}
            filterTime={filterTime}
            filterColor={filterColor}
            filterSynopsis={filterSynopsis}
            hasActiveFilter={hasActiveFilter}
            onAddCharacter={(c) =>
              setFilterCharacters((prev) =>
                prev.includes(c) ? prev : [...prev, c],
              )
            }
            onRemoveCharacter={(c) =>
              setFilterCharacters((prev) => prev.filter((x) => x !== c))
            }
            onLocationChange={setFilterLocation}
            onPrefixChange={setFilterPrefix}
            onTimeChange={setFilterTime}
            onColorChange={setFilterColor}
            onSynopsisChange={setFilterSynopsis}
            onClearAll={clearAllFilters}
          />
        )}
        <div className="flex-1 pb-1 overflow-y-auto" ref={listRef}>
          <div
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b border-(--fd-border) ${scrollingUp ? 'sticky top-0 z-2 bg-(--fd-navigator-bg)' : ''}`}
          >
            <Search className="opacity-40 size-3.5 shrink-0" />
            <Input
              className="flex-1 min-w-0 h-auto bg-transparent border-none shadow-none text-(--fd-text) text-[13px] py-1 px-0 focus-visible:ring-0"
              type="text"
              placeholder="Search headings & synopses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-(--fd-text-muted) hover:text-(--fd-text)"
                onClick={() => setSearchQuery('')}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </ActivityPanel.SubHeader>
      <ActivityPanel.Content headerOffset={showFilters ? '22dvh' : '10dvh'}>
        {filteredIndices.length === 0 ? (
          <div className="p-6 px-4 text-(--fd-text) opacity-70 text-[13px] italic text-center">
            {hasActiveFilter || searchQuery
              ? 'No scenes match the current filters.'
              : 'No scenes yet. Start writing a scene heading (INT. or EXT.)'}
          </div>
        ) : (
          filteredIndices.map((sceneIdx) => (
            <SceneListItem
              key={scenes[sceneIdx].id}
              scene={scenes[sceneIdx]}
              detail={sceneDetails[sceneIdx]}
              timing={sceneTimings[sceneIdx]}
              actLabel={sceneActLabel(structure, sceneIdx)}
              isExpanded={expandedSceneIdx === sceneIdx}
              searchQuery={searchQuery}
              onToggle={() => {
                setExpandedSceneIdx(
                  expandedSceneIdx === sceneIdx ? null : sceneIdx,
                )
                goToScene(sceneIdx)
              }}
              onEditSynopsis={() =>
                setSynopsisModal({
                  sceneIdx,
                  id: scenes[sceneIdx].id,
                  heading: scenes[sceneIdx].heading,
                  synopsis: scenes[sceneIdx].synopsis,
                  color: scenes[sceneIdx].color,
                })
              }
            />
          ))
        )}
        {/* </ScrollArea> */}
        {/* </div> */}

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
            synopsisModal
              ? sceneDetails[synopsisModal.sceneIdx]?.pageLength
              : undefined
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
      </ActivityPanel.Content>
    </ActivityPanel.Shell>
  )
}

export default ScenesPanel
