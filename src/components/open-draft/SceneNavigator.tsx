import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Editor } from '@tiptap/react'
import { useDelayedUnmount, useSwipeDismiss } from '@/hooks/useTouch'
import { useEditorStore } from '@/stores/editorStore'
import {
  computeSceneLengths,
  computePageBlocks,
  type PageContentInfo,
} from '@/editor/pagination'
import {
  computeSceneTiming,
  formatSceneDuration,
  getTimingColor,
} from '@/utils/scriptTiming'
import {
  computeScriptStructure,
  sceneActLabel,
  type ScriptStructure,
} from '@/utils/scriptStructure'
import SynopsisModal from './SynopsisModal'
import { showToast } from './Toast'
import { blockContentRange, characterKey, singleLine } from '@/utils/nodeText'

interface SceneNavigatorProps {
  editor: Editor | null
  scrollContainer?: HTMLDivElement | null
  style?: React.CSSProperties
}

type NavTab = 'scenes' | 'pages' | 'locations' | 'structure'

// ── Scene heading parser ────────────────────────────────────────────────

interface ParsedHeading {
  preamble: string
  prefix: string
  location: string
  timeOfDay: string
  raw: string
}

const TIME_WORDS =
  'DAY|NIGHT|DAWN|DUSK|MORNING|AFTERNOON|EVENING|SUNSET|SUNRISE|LATER|CONTINUOUS|SAME TIME|MOMENTS LATER|SAME|MAGIC HOUR'
const PREFIX_RE = /(INT\.?\/?EXT\.?|EXT\.?\/?INT\.?|INT\.?|EXT\.?|I\/E\.?)\s+/i

function normalisePrefix(raw: string): string {
  let p = raw.toUpperCase()
  if (
    p === 'INT/EXT' ||
    p === 'INT/EXT.' ||
    p === 'EXT/INT' ||
    p === 'EXT/INT.' ||
    p === 'I/E' ||
    p === 'I/E.'
  )
    return 'INT./EXT.'
  if (!p.endsWith('.')) p += '.'
  return p
}

function parseHeading(raw: string): ParsedHeading {
  let rest = raw.trim()
  let preamble = ''
  let prefix = ''
  let timeOfDay = ''

  const prefixMatch = rest.match(PREFIX_RE)
  if (prefixMatch && prefixMatch.index !== undefined) {
    preamble = rest.slice(0, prefixMatch.index)
    prefix = normalisePrefix(prefixMatch[1])
    rest = rest.slice(prefixMatch.index + prefixMatch[0].length)
  }

  const dashTime = rest.match(new RegExp(`\\s+-\\s+(${TIME_WORDS})\\.?$`, 'i'))
  if (dashTime) {
    timeOfDay = dashTime[1].toUpperCase()
    rest = rest.slice(0, -dashTime[0].length)
  } else {
    const dotTime = rest.match(new RegExp(`\\.\\s*(${TIME_WORDS})\\.?$`, 'i'))
    if (dotTime) {
      timeOfDay = dotTime[1].toUpperCase()
      rest = rest.slice(0, -dotTime[0].length)
    }
  }

  const location = rest.replace(/^[\s.]+|[\s.]+$/g, '')
  return { preamble, prefix, location, timeOfDay, raw }
}

// ── Location grouping ───────────────────────────────────────────────────

interface LocationGroup {
  name: string
  sceneIndices: number[]
  headings: string[]
  prefixes: string[]
  times: string[]
  preambles: string[]
}

function groupByLocation(scenes: Array<{ heading: string }>): LocationGroup[] {
  const map = new Map<string, LocationGroup>()
  scenes.forEach((scene, index) => {
    const parsed = parseHeading(scene.heading)
    const key = parsed.location.toUpperCase()
    if (!key) return
    let group = map.get(key)
    if (!group) {
      group = {
        name: parsed.location,
        sceneIndices: [],
        headings: [],
        prefixes: [],
        times: [],
        preambles: [],
      }
      map.set(key, group)
    }
    group.sceneIndices.push(index)
    group.headings.push(scene.heading)
    group.prefixes.push(parsed.prefix)
    group.times.push(parsed.timeOfDay)
    group.preambles.push(parsed.preamble.replace(/[\s.]+$/, ''))
  })
  return Array.from(map.values())
}

// ── Search highlight helper ─────────────────────────────────────────────

function highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const qLower = query.toLowerCase()
  const idx = lower.indexOf(qLower)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-[rgba(234,179,8,0.3)] px-px rounded-[2px]">
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  )
}

// ── Scene detail helpers ────────────────────────────────────────────────

interface SceneDetail {
  characters: string[]
  location: string
  prefix: string
  timeOfDay: string
  pageLength: number
}

function formatPageLength(pages: number): string {
  const n = Number(pages.toFixed(2))
  return `${n} ${n <= 1 ? 'page' : 'pages'}`
}

// ── Scene Length Icon ────────────────────────────────────────────────────

function getPageFillStyle(pages: number): { color: string; opacity: number } {
  if (pages <= 1) return { color: 'var(--fd-accent)', opacity: 0.6 }
  const t = Math.min((pages - 1) / 4, 1) // 0 at 1 page, 1 at 5+ pages
  const hue = Math.round(120 * (1 - t)) // green(120) → red(0)
  const sat = 65 + Math.round(t * 25) // 65% → 90%
  const lit = 50 - Math.round(t * 10) // 50% → 40%
  const opacity = 0.65 + t * 0.3 // 0.65 → 0.95
  return { color: `hsl(${hue}, ${sat}%, ${lit}%)`, opacity }
}

const SceneLengthIcon: React.FC<{ pages: number }> = React.memo(({ pages }) => {
  const wholePgs = Math.floor(pages)
  const fraction = pages - wholePgs
  const FILL_TOP = 2.5
  const FILL_BOT = 14
  const FILL_H = FILL_BOT - FILL_TOP // 11.5 — full interior height
  const fillH = (fraction > 0 ? fraction : 1) * FILL_H
  const { color: fillColor, opacity: fillOpacity } = getPageFillStyle(pages)
  // For multi-page scenes, fill the remaining top portion with the previous page's color
  const showBg = pages > 1 && fraction > 0
  const bgStyle = showBg ? getPageFillStyle(wholePgs) : null
  return (
    <svg width="14" height="16" viewBox="0 0 14 16" style={{ flexShrink: 0 }}>
      {wholePgs >= 2 && (
        <rect
          x="3.5"
          y="0"
          width="9.5"
          height="13.5"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.2"
        />
      )}
      {wholePgs >= 1 && pages > 1 && (
        <rect
          x="2.5"
          y="0.5"
          width="9.5"
          height="13.5"
          rx="1"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.3"
        />
      )}
      <rect
        x="1"
        y="1.5"
        width="9.5"
        height="13"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.5"
      />
      {bgStyle && (
        <rect
          x="2"
          y={FILL_TOP}
          width="7.5"
          height={FILL_H}
          fill={bgStyle.color}
          opacity={bgStyle.opacity}
          rx="0.5"
        />
      )}
      <rect
        x="2"
        y={FILL_BOT - fillH}
        width="7.5"
        height={fillH}
        fill={fillColor}
        opacity={fillOpacity}
        rx="0.5"
        className="opacity-55 scene-length-fill"
      />
    </svg>
  )
})

// ── Page thumbnail: exact-match layout constants (same as pagination.ts) ─

const FD_INDENTS: Record<string, [number, number]> = {
  sceneHeading: [1.5, 7.5],
  action: [1.5, 7.5],
  character: [3.5, 7.5],
  dialogue: [2.5, 6.0],
  parenthetical: [3.0, 5.5],
  transition: [5.5, 7.5],
  general: [1.5, 7.5],
  shot: [1.5, 7.5],
  newAct: [1.5, 7.5],
  endOfAct: [1.5, 7.5],
  lyrics: [2.5, 6.0],
  showEpisode: [1.5, 7.5],
  castList: [1.5, 7.5],
}

const SPACE_BEFORE: Record<string, number> = {
  sceneHeading: 1,
  action: 1,
  character: 1,
  dialogue: 0,
  parenthetical: 0,
  transition: 1,
  general: 0,
  shot: 1,
  newAct: 2,
  endOfAct: 2,
  lyrics: 0,
  showEpisode: 1,
  castList: 0,
}

const LINE_HEIGHT_PX = 12 * (96 / 72) // 16px — matches pagination LINE_HEIGHT_PT

function pageThumbTypeClasses(typeName: string): string {
  switch (typeName) {
    case 'sceneHeading':
      return 'font-bold'
    case 'character':
      return 'uppercase'
    case 'transition':
      return 'text-right uppercase'
    case 'newAct':
    case 'endOfAct':
      return 'text-center font-bold uppercase'
    case 'lyrics':
      return 'italic'
    default:
      return ''
  }
}

// ── Main component ──────────────────────────────────────────────────────

const SceneNavigator: React.FC<SceneNavigatorProps> = ({
  editor,
  scrollContainer,
  style,
}) => {
  const {
    scenes,
    navigatorOpen,
    toggleNavigator,
    updateSceneSynopsis,
    updateSceneColor,
  } = useEditorStore()
  const pageLayout = useEditorStore((s) => s.pageLayout)
  const fontFamily = useEditorStore((s) => s.fontFamily)
  const fontSize = useEditorStore((s) => s.fontSize)
  const [activeTab, setActiveTab] = useState<NavTab>('scenes')
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null)
  const [renamingLocation, setRenamingLocation] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Expanded scene (shows synopsis inline)
  const [expandedSceneIdx, setExpandedSceneIdx] = useState<number | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [scrollingUp, setScrollingUp] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const lastScrollTop = useRef(0)

  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filterCharacters, setFilterCharacters] = useState<string[]>([])
  const [filterLocation, setFilterLocation] = useState('')
  const [filterPrefix, setFilterPrefix] = useState('')
  const [filterTime, setFilterTime] = useState('')
  const [filterColor, setFilterColor] = useState('')
  const [filterSynopsis, setFilterSynopsis] = useState('')

  // Page preview state
  const pageGridRef = useRef<HTMLDivElement>(null)
  const [thumbScale, setThumbScale] = useState(0.35)
  const [currentVisiblePage, setCurrentVisiblePage] = useState(1)

  // Synopsis modal state
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

  const locations = useMemo(() => groupByLocation(scenes), [scenes])

  useEffect(() => {
    if (renamingLocation && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingLocation])

  // Detect scroll direction in the scene list — show search bar on scroll-up.
  // Re-run when the Scenes tab becomes active; the `.navigator-list` div is
  // unmounted while the user is on another tab, so the scroll listener must
  // re-attach to the freshly mounted element when they come back.
  useEffect(() => {
    if (activeTab !== 'scenes') return
    const el = listRef.current
    if (!el) return
    lastScrollTop.current = el.scrollTop
    const onScroll = () => {
      const top = el.scrollTop
      if (top < lastScrollTop.current) {
        setScrollingUp(true)
      } else if (top > lastScrollTop.current) {
        setScrollingUp(false)
      }
      lastScrollTop.current = top
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [activeTab])

  // ── Compute scene details (characters, location, length) ──

  const sceneDetails = useMemo((): SceneDetail[] => {
    if (!editor) return []
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
        // Headings are single-line by definition here — collapse any break so
        // parseHeading sees one line and the displayed label doesn't wrap.
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
  }, [editor, scenes, pageLayout])

  // ── Compute scene timing ──

  const sceneTimings = useMemo(() => {
    if (!editor) return []
    try {
      const doc = editor.getJSON()
      return computeSceneTiming(doc).scenes
    } catch {
      return []
    }
  }, [editor, scenes])

  // ── Compute act/sequence structure ──

  const structure: ScriptStructure = useMemo(() => {
    if (!editor) return { acts: [], sceneActMap: new Map(), totalScenes: 0 }
    try {
      return computeScriptStructure(editor.getJSON())
    } catch {
      return { acts: [], sceneActMap: new Map(), totalScenes: 0 }
    }
  }, [editor, scenes])

  // ── Collapsed acts / sequences (Structure tab state) ──
  const [collapsedActs, setCollapsedActs] = useState<Set<number>>(new Set())
  const [collapsedSequences, setCollapsedSequences] = useState<Set<string>>(
    new Set(),
  )

  const toggleAct = useCallback((actNumber: number) => {
    setCollapsedActs((prev) => {
      const next = new Set(prev)
      if (next.has(actNumber)) next.delete(actNumber)
      else next.add(actNumber)
      return next
    })
  }, [])

  const toggleSequence = useCallback((seqId: string) => {
    setCollapsedSequences((prev) => {
      const next = new Set(prev)
      if (next.has(seqId)) next.delete(seqId)
      else next.add(seqId)
      return next
    })
  }, [])

  // ── Compute page blocks for page preview ──

  const pageContent = useMemo((): PageContentInfo[] => {
    if (!editor) return []
    return computePageBlocks(editor.state.doc, pageLayout)
  }, [editor, scenes, pageLayout])

  // ── Exact-match page layout for thumbnails ──

  // Reference width = actual page width in CSS px (inches × 96 DPI)
  const refWidthPx = useMemo(
    () => pageLayout.pageWidth * 96,
    [pageLayout.pageWidth],
  )

  // Inline style for the page content container — matches editor's .page element
  const pageContentStyle = useMemo(
    (): React.CSSProperties => ({
      width: `${refWidthPx}px`,
      paddingTop: `${pageLayout.topMargin}pt`,
      paddingBottom: `${pageLayout.bottomMargin}pt`,
      paddingLeft: `${pageLayout.leftMargin}in`,
      paddingRight: `${pageLayout.rightMargin}in`,
      fontFamily: `'${fontFamily}', 'Courier New', Courier, monospace`,
      fontSize: `${fontSize}pt`,
      lineHeight: `${LINE_HEIGHT_PX}px`,
    }),
    [refWidthPx, pageLayout, fontFamily, fontSize],
  )

  // Per-element inline style — same indentation as the editor
  const getBlockStyle = useCallback(
    (typeName: string, isFirst: boolean): React.CSSProperties => {
      const [left, right] = FD_INDENTS[typeName] || [1.5, 7.5]
      const padL = Math.max(0, (left - pageLayout.leftMargin) * 96)
      const padR = Math.max(
        0,
        (pageLayout.pageWidth - right - pageLayout.rightMargin) * 96,
      )
      const sb = isFirst ? 0 : (SPACE_BEFORE[typeName] ?? 0)
      return {
        paddingLeft: padL > 0 ? `${padL}px` : undefined,
        paddingRight: padR > 0 ? `${padR}px` : undefined,
        marginTop: sb > 0 ? `${sb * LINE_HEIGHT_PX}px` : undefined,
      }
    },
    [pageLayout],
  )

  // ── ResizeObserver for thumbnail scaling ──

  useEffect(() => {
    if (activeTab !== 'pages' || !pageGridRef.current) return
    const grid = pageGridRef.current
    const observer = new ResizeObserver(() => {
      const firstThumb = grid.querySelector('.page-thumbnail') as HTMLElement
      if (firstThumb) {
        setThumbScale(Math.max(0.05, firstThumb.clientWidth / refWidthPx))
      }
    })
    observer.observe(grid)
    return () => observer.disconnect()
  }, [activeTab, pageContent.length, refWidthPx])

  // ── Scroll sync: highlight current page in editor ──

  useEffect(() => {
    if (
      activeTab !== 'pages' ||
      !scrollContainer ||
      !editor ||
      pageContent.length === 0
    )
      return

    let rafId = 0
    const handleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const rect = scrollContainer.getBoundingClientRect()
        const viewY = rect.top + rect.height / 3
        try {
          const pos = editor.view.posAtCoords({
            left: rect.left + rect.width / 2,
            top: viewY,
          })
          if (!pos) return
          let page = 1
          for (let i = pageContent.length - 1; i >= 0; i--) {
            if (
              pageContent[i].blocks.length > 0 &&
              pageContent[i].blocks[0].docPos <= pos.pos
            ) {
              page = pageContent[i].pageNumber
              break
            }
          }
          if (page !== currentVisiblePage) {
            setCurrentVisiblePage(page)
            const thumbEl = pageGridRef.current?.querySelector(
              `[data-page="${page}"]`,
            ) as HTMLElement
            if (thumbEl)
              thumbEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
          }
        } catch {
          /* editor coords may not be available */
        }
      })
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // initial sync
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [activeTab, scrollContainer, editor, pageContent, currentVisiblePage])

  // ── Filter dropdown options ──

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

  // ── Filtered scene indices ──

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
    const noFilters = !hasActiveFilter && !query
    if (noFilters) return scenes.map((_, i) => i)
    return scenes.reduce((acc, scene, idx) => {
      const detail = sceneDetails[idx]
      if (!detail) return acc
      // Search bar — matches heading or synopsis
      if (query) {
        const headingMatch = scene.heading.toLowerCase().includes(query)
        const synopsisMatch = (scene.synopsis || '')
          .toLowerCase()
          .includes(query)
        if (!headingMatch && !synopsisMatch) return acc
      }
      // Filter panel filters
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

  // ── Navigate to a scene by index ──

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
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect()
          const scrollTo =
            scrollContainer.scrollTop + (coords.top - containerRect.top) - 60
          scrollContainer.scrollTo({ top: scrollTo, behavior: 'auto' })
        }
      })
    },
    [editor, scrollContainer],
  )

  // ── Navigate to a document position ──

  const goToPosition = useCallback(
    (pos: number) => {
      if (!editor) return
      editor
        .chain()
        .focus()
        .setTextSelection(pos + 1)
        .run()
      requestAnimationFrame(() => {
        const coords = editor.view.coordsAtPos(pos + 1)
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect()
          const scrollTo =
            scrollContainer.scrollTop + (coords.top - containerRect.top) - 60
          scrollContainer.scrollTo({ top: scrollTo, behavior: 'auto' })
        }
      })
    },
    [editor, scrollContainer],
  )

  // ── Handle page thumbnail click ──

  const handlePageClick = useCallback(
    (page: PageContentInfo, e: React.MouseEvent<HTMLDivElement>) => {
      if (!editor || page.blocks.length === 0) return
      const contentEl = e.currentTarget.querySelector(
        '.page-thumb-content',
      ) as HTMLElement
      if (!contentEl) return
      const children = Array.from(contentEl.children) as HTMLElement[]
      const clickY = e.clientY
      let bestIdx = 0
      let bestDist = Infinity
      children.forEach((child, idx) => {
        const rect = child.getBoundingClientRect()
        const mid = rect.top + rect.height / 2
        const dist = Math.abs(clickY - mid)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = idx
        }
      })
      const block = page.blocks[bestIdx]
      if (block) goToPosition(block.docPos)
    },
    [editor, goToPosition],
  )

  // ── Batch rename a location across all scene headings ──

  const handleRenameSubmit = useCallback(() => {
    if (!editor || !renamingLocation || !renameValue.trim()) {
      setRenamingLocation(null)
      return
    }
    const oldName = renamingLocation
    const newName = renameValue.trim()
    if (oldName === newName) {
      setRenamingLocation(null)
      return
    }

    const { doc, schema, tr } = editor.state
    const sceneHeadingType = schema.nodes.sceneHeading
    if (!sceneHeadingType) {
      setRenamingLocation(null)
      return
    }

    let skippedBroken = 0
    doc.descendants((node, pos) => {
      if (node.type.name !== 'sceneHeading') return true
      const heading = node.textContent
      // A heading containing a hard break can't be rewritten: insertText over
      // the inline range would flatten the break into plain text. Such a
      // heading is a formatting mistake; silently reformatting it is worse
      // than leaving it, so count it and tell the user.
      if (heading.includes('\n')) {
        if (
          parseHeading(singleLine(heading)).location.toUpperCase() ===
          oldName.toUpperCase()
        ) {
          skippedBroken++
        }
        return true
      }
      const parsed = parseHeading(heading)
      if (parsed.location.toUpperCase() !== oldName.toUpperCase()) return true
      let newHeading = parsed.preamble
      if (parsed.prefix) newHeading += parsed.prefix + ' '
      newHeading += newName
      if (parsed.timeOfDay) {
        const usesDot =
          /\.\s*\w+\.?\s*$/.test(heading) && !/\s-\s/.test(heading)
        newHeading += usesDot
          ? '. ' + parsed.timeOfDay + '.'
          : ' - ' + parsed.timeOfDay
      }
      // Derive the range from nodeSize, never `pos + 1 + heading.length` —
      // the latter is short by one per inline atom and would leave the tail
      // of the heading behind, duplicating it.
      const { from, to } = blockContentRange(node, pos)
      tr.insertText(newHeading, from, to)
      return true
    })

    if (skippedBroken > 0) {
      showToast(
        `Skipped ${skippedBroken} scene heading${skippedBroken === 1 ? '' : 's'} containing a line break`,
        'info',
      )
    }

    if (tr.steps.length > 0) editor.view.dispatch(tr)
    setRenamingLocation(null)
    setExpandedLocation(newName.toUpperCase())
  }, [editor, renamingLocation, renameValue])

  const { shouldRender, animationState } = useDelayedUnmount(navigatorOpen, 250)
  const navPanelRef = useRef<HTMLDivElement>(null)
  useSwipeDismiss(navPanelRef, {
    direction: 'left',
    onDismiss: toggleNavigator,
    enabled: shouldRender,
  })

  if (!shouldRender) return null

  const panelClass =
    animationState === 'entered'
      ? 'panel-open'
      : animationState === 'exiting'
        ? 'panel-closing'
        : ''

  const navTabClass = (tab: NavTab) =>
    `flex-1 shrink-0 bg-transparent border-none border-b-2 text-[11px] font-semibold uppercase tracking-[0.4px] px-2 py-2.5 cursor-pointer transition-all duration-150 min-h-10 whitespace-nowrap hover:text-(--fd-text) ${activeTab === tab ? 'text-(--fd-accent) border-b-(--fd-accent)' : 'text-(--fd-text-muted) border-transparent'}`

  return (
    <>
      <div
        ref={navPanelRef}
        className={`scene-navigator ${panelClass} flex flex-col w-69 min-w-45 bg-(--fd-navigator-bg) border-r border-(--fd-border) overflow-hidden`}
        style={style}
      >
        {/* Tab bar — horizontally scrollable tab strip + pinned close button */}
        <div className="flex items-stretch border-b border-(--fd-border) shrink-0 min-w-0">
          <div className="flex flex-1 min-w-0 overflow-x-auto overflow-y-hidden navigator-tabs-scroll">
            <button
              className={navTabClass('scenes')}
              onClick={() => setActiveTab('scenes')}
            >
              Scenes
            </button>
            <button
              className={navTabClass('pages')}
              onClick={() => setActiveTab('pages')}
            >
              Pages
            </button>
            <button
              className={navTabClass('locations')}
              onClick={() => setActiveTab('locations')}
            >
              Locations
            </button>
            <button
              className={navTabClass('structure')}
              onClick={() => setActiveTab('structure')}
            >
              Structure
            </button>
          </div>
          <button
            className="navigator-close bg-transparent border-none text-(--fd-text-muted) text-xl cursor-pointer px-3 py-0 leading-none shrink-0 flex items-center justify-center min-w-9 min-h-10 border-l border-(--fd-border) hover:text-(--fd-text) hover:bg-(--fd-overlay-subtle)"
            onClick={toggleNavigator}
            title="Close Navigator"
          >
            ×
          </button>
        </div>

        {/* ── Scenes tab ───────────────────────────────────────────────── */}
        {activeTab === 'scenes' && (
          <>
            <div className="flex items-center px-3.5 py-0.75 border-b border-(--fd-border) shrink-0 gap-2">
              <span className="font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)">
                Scenes
              </span>
              <span className="text-xs text-(--fd-text) opacity-70">
                {hasActiveFilter || searchQuery
                  ? `${filteredIndices.length}/`
                  : ''}
                {scenes.length}
              </span>
              <button
                className={`bg-transparent border-none cursor-pointer p-1.5 ml-auto flex items-center transition-colors duration-150 min-w-8 min-h-8 justify-center hover:text-(--fd-accent) ${hasActiveFilter ? 'text-(--fd-accent)' : 'text-(--fd-text-muted)'}`}
                onClick={() => setShowFilters(!showFilters)}
                title="Filter scenes"
              >
                <svg
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  fill={hasActiveFilter ? 'var(--fd-accent)' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <path d="M1.5 2h13l-5 5.5v5l-3-1.5V7.5z" />
                </svg>
              </button>
            </div>

            {showFilters && (
              <div className="px-3.5 pt-2 pb-2.5 border-b border-(--fd-border) flex flex-col gap-1.5 shrink-0">
                <div className="flex flex-col gap-1.5">
                  <select
                    className="scene-filter-select flex-1 min-w-0 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2 py-2 text-[13px] outline-none cursor-pointer min-h-9 pr-6"
                    value=""
                    onChange={(e) => {
                      if (
                        e.target.value &&
                        !filterCharacters.includes(e.target.value)
                      ) {
                        setFilterCharacters([
                          ...filterCharacters,
                          e.target.value,
                        ])
                      }
                    }}
                  >
                    <option value="">Character...</option>
                    {allCharacters
                      .filter((c) => !filterCharacters.includes(c))
                      .map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                  {filterCharacters.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {filterCharacters.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 bg-[rgba(74,158,255,0.15)] text-(--fd-accent) text-xs px-2 py-1 rounded font-medium min-h-7"
                        >
                          {c}
                          <button
                            className="flex justify-center items-center bg-transparent opacity-70 hover:opacity-100 px-0.5 py-0 border-none min-w-5 min-h-5 text-inherit text-sm leading-none cursor-pointer"
                            onClick={() =>
                              setFilterCharacters(
                                filterCharacters.filter((x) => x !== c),
                              )
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <select
                    className="scene-filter-select flex-1 min-w-0 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2 py-2 text-[13px] outline-none cursor-pointer min-h-9 pr-6"
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                  >
                    <option value="">Location...</option>
                    {allLocations.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  <select
                    className="scene-filter-select flex-1 min-w-0 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2 py-2 text-[13px] outline-none cursor-pointer min-h-9 pr-6"
                    value={filterPrefix}
                    onChange={(e) => setFilterPrefix(e.target.value)}
                  >
                    <option value="">INT/EXT...</option>
                    {allPrefixes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-1.5">
                  <select
                    className="scene-filter-select flex-1 min-w-0 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2 py-2 text-[13px] outline-none cursor-pointer min-h-9 pr-6"
                    value={filterTime}
                    onChange={(e) => setFilterTime(e.target.value)}
                  >
                    <option value="">Time of Day...</option>
                    {allTimes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    {[
                      '',
                      '#8b5cf6',
                      '#4f46e5',
                      '#2563eb',
                      '#059669',
                      '#eab308',
                      '#f97316',
                      '#ef4444',
                      '#000000',
                      '#ffffff',
                    ].map((c) => (
                      <button
                        key={c || 'all'}
                        className={`w-4 h-4 rounded-full border-2 cursor-pointer shrink-0 shadow-[inset_0_0_0_1px_rgba(128,128,128,0.3)] ${filterColor === c ? 'border-(--fd-text)' : 'border-transparent'}`}
                        style={{
                          background: c || 'var(--fd-text)',
                          opacity: c ? 1 : 0.25,
                        }}
                        onClick={() => setFilterColor(c)}
                        title={c ? c : 'All colors'}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <input
                    className="flex-1 min-w-0 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded px-2 py-2 text-[13px] outline-none min-h-9 placeholder:text-(--fd-text-muted) placeholder:opacity-60 focus:border-(--fd-accent)"
                    type="text"
                    placeholder="Synopsis contains..."
                    value={filterSynopsis}
                    onChange={(e) => setFilterSynopsis(e.target.value)}
                  />
                </div>
                <div className="flex gap-1.5">
                  {hasActiveFilter && (
                    <button
                      className="bg-transparent border border-(--fd-border) text-(--fd-text-muted) text-[13px] px-3 py-2 rounded cursor-pointer whitespace-nowrap transition-all duration-150 min-h-9 hover:border-(--fd-accent) hover:text-(--fd-accent)"
                      onClick={() => {
                        setFilterCharacters([])
                        setFilterLocation('')
                        setFilterPrefix('')
                        setFilterTime('')
                        setFilterColor('')
                        setFilterSynopsis('')
                      }}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            )}

            <div
              className="flex-1 pb-1 overflow-y-auto navigator-list"
              ref={listRef}
            >
              {/* Search bar — sticky on scroll-up, scrolls away on scroll-down */}
              <div
                className={`flex items-center gap-1.5 px-3.5 py-2 border-b border-(--fd-border) ${scrollingUp ? 'sticky top-0 z-2 bg-(--fd-navigator-bg)' : ''}`}
              >
                <svg
                  className="opacity-40 shrink-0"
                  viewBox="0 0 16 16"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="6.5" cy="6.5" r="5" />
                  <line x1="10" y1="10" x2="14.5" y2="14.5" />
                </svg>
                <input
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-(--fd-text) text-[13px] py-1 placeholder:text-(--fd-text-muted) placeholder:opacity-60"
                  type="text"
                  placeholder="Search headings & synopses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="bg-transparent border-none text-(--fd-text-muted) cursor-pointer text-base leading-none px-0.5 opacity-60 hover:opacity-100 hover:text-(--fd-text)"
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </button>
                )}
              </div>
              {filteredIndices.length === 0 ? (
                <div className="p-6 px-4 text-(--fd-text) opacity-70 text-[13px] italic text-center">
                  {hasActiveFilter || searchQuery
                    ? 'No scenes match the current filters.'
                    : 'No scenes yet. Start writing a scene heading (INT. or EXT.)'}
                </div>
              ) : (
                filteredIndices.map((sceneIdx) => {
                  const scene = scenes[sceneIdx]
                  const detail = sceneDetails[sceneIdx]
                  const isExpanded = expandedSceneIdx === sceneIdx
                  return (
                    <div
                      key={scene.id}
                      className={`navigator-scene flex items-start px-3.5 py-2.5 cursor-pointer border-l-[3px] min-h-10 hover:bg-(--fd-overlay-subtle) hover:border-l-(--fd-accent) active:bg-[rgba(74,158,255,0.12)] ${isExpanded ? 'bg-(--fd-overlay-subtle) border-l-(--fd-accent)' : 'border-transparent'}`}
                    >
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => {
                          setExpandedSceneIdx(isExpanded ? null : sceneIdx)
                          goToScene(sceneIdx)
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0 flex items-center gap-1.5 text-sm [font-family:var(--screenplay-font)] text-(--fd-text) leading-[1.3] font-semibold">
                            {scene.sceneNumber != null && (
                              <span
                                className="inline-flex items-center justify-center w-5.5 h-5.5 rounded-full shrink-0 text-xs font-bold font-inherit bg-(--fd-text-muted) text-(--fd-bg) border-none"
                                style={
                                  scene.color
                                    ? { background: scene.color }
                                    : undefined
                                }
                              >
                                {scene.sceneNumber}
                              </span>
                            )}
                            {(() => {
                              const label = sceneActLabel(structure, sceneIdx)
                              return label ? (
                                <span
                                  className="inline-block text-[9px] font-bold tracking-[0.03em] px-1.25 py-px mr-1.5 rounded-[3px] bg-(--fd-overlay-light) text-(--fd-text-muted) align-middle shrink-0"
                                  title={`Act ${label.slice(1)}`}
                                >
                                  {label}
                                </span>
                              ) : null
                            })()}
                            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                              {highlightText(scene.heading, searchQuery)}
                            </span>
                          </div>
                          {detail && detail.pageLength > 0 && (
                            <div
                              className="scene-length shrink-0 flex items-center text-(--fd-text-muted) cursor-default ml-1 relative"
                              data-tooltip={
                                formatPageLength(detail.pageLength) +
                                (sceneTimings[sceneIdx]?.finalSeconds
                                  ? ` \u00b7 ${formatSceneDuration(sceneTimings[sceneIdx].finalSeconds)}`
                                  : '')
                              }
                            >
                              <SceneLengthIcon pages={detail.pageLength} />
                            </div>
                          )}
                        </div>
                        {!isExpanded && scene.synopsis && (
                          <div className="text-[11px] text-(--fd-text) opacity-50 leading-[1.3] mt-[3px] whitespace-nowrap overflow-hidden text-ellipsis">
                            {highlightText(
                              scene.synopsis.split('\n')[0],
                              searchQuery,
                            )}
                          </div>
                        )}
                        {isExpanded && (
                          <div className="mt-2 pt-1.5 border-t border-(--fd-border)">
                            {(detail || sceneTimings[sceneIdx]) && (
                              <div className="flex gap-2 text-[11px] text-(--fd-text-muted) mb-1 [font-variant-numeric:tabular-nums]">
                                {detail && detail.pageLength > 0 && (
                                  <span className="font-semibold">
                                    {formatPageLength(detail.pageLength)}
                                  </span>
                                )}
                                {sceneTimings[sceneIdx]?.finalSeconds > 0 && (
                                  <span
                                    className="font-semibold"
                                    style={{
                                      color: getTimingColor(
                                        sceneTimings[sceneIdx].finalSeconds,
                                      ),
                                    }}
                                  >
                                    {formatSceneDuration(
                                      sceneTimings[sceneIdx].finalSeconds,
                                    )}
                                    {sceneTimings[sceneIdx].overrideSeconds !=
                                      null && ' *'}
                                  </span>
                                )}
                              </div>
                            )}
                            {scene.synopsis ? (
                              <div className="text-xs text-(--fd-text) opacity-70 leading-[1.5] line-clamp-3">
                                {scene.synopsis}
                              </div>
                            ) : (
                              <div className="text-xs text-(--fd-text-muted) italic opacity-60">
                                No synopsis for this scene available.
                              </div>
                            )}
                            <button
                              className="mt-1.5 px-2.5 py-[3px] text-[11px] bg-transparent border border-(--fd-border) rounded text-(--fd-accent) cursor-pointer hover:bg-(--fd-overlay-subtle)"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSynopsisModal({
                                  sceneIdx,
                                  id: scene.id,
                                  heading: scene.heading,
                                  synopsis: scene.synopsis,
                                  color: scene.color,
                                })
                              }}
                            >
                              {scene.synopsis ? 'Edit' : '+ Add'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* ── Pages tab ────────────────────────────────────────────────── */}
        {activeTab === 'pages' && (
          <div
            className="flex-1 p-0! overflow-y-auto navigator-list"
            ref={pageGridRef}
          >
            {pageContent.length === 0 ? (
              <div className="p-6 px-4 text-(--fd-text) opacity-70 text-[13px] italic text-center">
                No pages yet. Start writing to see page previews.
              </div>
            ) : (
              <div className="gap-0 grid px-2 py-1.5 [grid-template-columns:repeat(auto-fill,minmax(120px,1fr))]">
                {pageContent.map((page, pageIdx) => (
                  <div key={page.pageNumber} className="flex flex-col">
                    <div
                      className={`page-thumbnail flex flex-col cursor-pointer overflow-hidden rounded-[2px] border m-1 transition-[border-color,box-shadow] duration-150 bg-white ${page.pageNumber === currentVisiblePage ? 'border-(--fd-accent) shadow-[0_0_0_2px_rgba(74,158,255,0.4)]' : 'border-(--fd-border) hover:border-(--fd-accent) hover:shadow-[0_0_0_1px_var(--fd-accent)]'}`}
                      data-page={page.pageNumber}
                      onClick={(e) => handlePageClick(page, e)}
                    >
                      <div className="relative w-full overflow-hidden page-thumb-content-clip [aspect-ratio:8.26/11.69]">
                        <div
                          className="top-0 left-0 box-border absolute text-[#222] origin-top-left page-thumb-content"
                          style={{
                            ...pageContentStyle,
                            transform: `scale(${thumbScale})`,
                          }}
                        >
                          {page.blocks.map((block, i) => (
                            <div
                              key={i}
                              className={`break-words [overflow-wrap:break-word] whitespace-pre-wrap ${pageThumbTypeClasses(block.typeName)}`}
                              style={getBlockStyle(block.typeName, i === 0)}
                            >
                              {block.text || '\u00A0'}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`text-center text-[10px] font-semibold text-(--fd-text) opacity-50 pt-[3px] pb-1.5 mx-1 ${pageIdx === pageContent.length - 1 ? '' : 'border-b border-(--fd-border)'}`}
                    >
                      Page {page.pageNumber}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Structure tab ────────────────────────────────────────────── */}
        {activeTab === 'structure' && (
          <>
            <div className="flex items-center px-3.5 py-0.75 border-b border-(--fd-border) shrink-0 gap-2">
              <span className="font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)">
                Structure
              </span>
              <span className="text-xs text-(--fd-text) opacity-70">
                {structure.acts.filter((a) => a.actNumber > 0).length || '—'}{' '}
                acts
              </span>
            </div>
            <div className="flex-1 pb-1 overflow-y-auto">
              {structure.acts.length === 0 ? (
                <div className="p-6 px-4 text-(--fd-text) opacity-70 text-[13px] italic text-center">
                  No structure yet. Insert an Act Break from the element
                  selector, or start writing scenes.
                </div>
              ) : (
                structure.acts.map((act) => {
                  const isCollapsed = collapsedActs.has(act.actNumber)
                  const displayName = act.customName
                    ? `${act.actName}: ${act.customName}`
                    : act.actName
                  return (
                    <div
                      key={`act-${act.actNumber}-${act.docPos}`}
                      className="border-b border-(--fd-overlay-subtle)"
                    >
                      <div
                        className="flex items-center gap-1.5 px-3 py-2.5 cursor-pointer bg-(--fd-overlay-subtle) transition-colors duration-100 hover:bg-(--fd-overlay-light)"
                        onClick={() => toggleAct(act.actNumber)}
                      >
                        <span
                          className={`text-(--fd-text-muted) text-[10px] w-2.5 transition-transform duration-150 shrink-0 ${isCollapsed ? 'rotate-[-90deg]' : 'rotate-0'}`}
                        >
                          &#9662;
                        </span>
                        <span className="flex-1 text-[13px] font-bold tracking-[0.02em] text-(--fd-text) uppercase">
                          {displayName}
                        </span>
                        <span className="text-[11px] text-(--fd-text-muted) bg-(--fd-overlay-light) px-2 py-0.5 rounded-lg shrink-0">
                          {act.scenes.length}
                        </span>
                      </div>
                      {!isCollapsed && (
                        <div className="pb-1">
                          {act.sequences.map((seq) => {
                            const seqCollapsed = collapsedSequences.has(seq.id)
                            return (
                              <div key={seq.id} className="pl-3">
                                <div
                                  className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-(--fd-overlay-subtle)"
                                  onClick={() => toggleSequence(seq.id)}
                                >
                                  <span
                                    className={`text-(--fd-text-muted) text-[10px] w-2.5 transition-transform duration-150 shrink-0 ${seqCollapsed ? 'rotate-[-90deg]' : 'rotate-0'}`}
                                  >
                                    &#9662;
                                  </span>
                                  <span
                                    className="rounded-full w-2 h-2 shrink-0"
                                    style={{ background: seq.color }}
                                  />
                                  <span className="flex-1 text-xs text-(--fd-text) whitespace-nowrap overflow-hidden text-ellipsis">
                                    {seq.name}
                                  </span>
                                  <span className="text-[10px] text-(--fd-text-muted) shrink-0">
                                    {seq.scenes.length}
                                  </span>
                                </div>
                                {!seqCollapsed && (
                                  <div className="pl-3">
                                    {seq.scenes.map((s) => (
                                      <div
                                        key={`seq-scene-${s.sceneIndex}`}
                                        className="flex items-center gap-2 px-3 py-[5px] cursor-pointer transition-colors duration-100 hover:bg-(--fd-overlay-subtle)"
                                        onClick={() => goToScene(s.sceneIndex)}
                                      >
                                        <span className="text-[10px] text-(--fd-text-muted) min-w-[22px] shrink-0">
                                          {s.sceneIndex + 1}
                                        </span>
                                        <span className="text-xs text-(--fd-text) whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                                          {s.heading}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                          {act.orphanScenes.length > 0 && (
                            <div className="pl-3">
                              {act.orphanScenes.map((s) => (
                                <div
                                  key={`orph-scene-${s.sceneIndex}`}
                                  className="flex items-center gap-2 px-3 py-[5px] cursor-pointer transition-colors duration-100 hover:bg-(--fd-overlay-subtle)"
                                  onClick={() => goToScene(s.sceneIndex)}
                                >
                                  <span className="text-[10px] text-(--fd-text-muted) min-w-[22px] shrink-0">
                                    {s.sceneIndex + 1}
                                  </span>
                                  <span className="text-xs text-(--fd-text) whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                                    {s.heading}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* ── Locations tab ────────────────────────────────────────────── */}
        {activeTab === 'locations' && (
          <>
            <div className="flex items-center px-3.5 py-0.75 border-b border-(--fd-border) shrink-0 gap-2">
              <span className="font-bold text-[13px] uppercase tracking-[0.5px] text-(--fd-text)">
                Locations
              </span>
              <span className="text-xs text-(--fd-text) opacity-70">
                {locations.length}
              </span>
            </div>
            <div className="flex-1 pb-1 overflow-y-auto">
              {locations.length === 0 ? (
                <div className="p-6 px-4 text-(--fd-text) opacity-70 text-[13px] italic text-center">
                  No locations yet. Scene headings like &ldquo;INT. COFFEE SHOP
                  - DAY&rdquo; will appear here.
                </div>
              ) : (
                locations.map((loc) => {
                  const key = loc.name.toUpperCase()
                  const isExpanded = expandedLocation === key
                  const isRenaming = renamingLocation === key
                  return (
                    <div
                      key={key}
                      className="border-b border-(--fd-overlay-subtle)"
                    >
                      <div
                        className="flex items-center px-3 py-2 cursor-pointer gap-1.5 transition-colors duration-100 hover:bg-(--fd-overlay-subtle)"
                        onClick={() =>
                          setExpandedLocation(isExpanded ? null : key)
                        }
                      >
                        <span className="flex-1 text-sm [font-family:var(--screenplay-font)] text-(--fd-text) whitespace-nowrap overflow-hidden text-ellipsis font-semibold">
                          {loc.name}
                        </span>
                        <span className="text-[11px] text-(--fd-text) opacity-70 bg-(--fd-overlay-light) px-2 py-0.5 rounded-lg shrink-0 font-medium">
                          {loc.sceneIndices.length}
                        </span>
                        <span
                          className={`text-(--fd-text) opacity-50 text-[10px] transition-transform duration-150 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          &#9662;
                        </span>
                      </div>
                      {isExpanded && (
                        <div className="px-3 pt-0 pb-2">
                          {isRenaming ? (
                            <div className="mb-1.5">
                              <input
                                ref={renameInputRef}
                                className="w-full bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-accent) rounded-[3px] px-1.5 py-1 text-xs [font-family:var(--screenplay-font)] outline-none"
                                value={renameValue}
                                onChange={(e) =>
                                  setRenameValue(e.target.value.toUpperCase())
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameSubmit()
                                  if (e.key === 'Escape')
                                    setRenamingLocation(null)
                                }}
                                onBlur={handleRenameSubmit}
                              />
                            </div>
                          ) : (
                            <button
                              className="bg-transparent border border-(--fd-border) text-(--fd-text-muted) text-[10px] px-2 py-[3px] rounded-[3px] cursor-pointer mb-1.5 transition-all duration-150 hover:border-(--fd-accent) hover:text-(--fd-accent)"
                              onClick={(e) => {
                                e.stopPropagation()
                                setRenamingLocation(key)
                                setRenameValue(loc.name)
                              }}
                            >
                              Rename Location
                            </button>
                          )}
                          <div className="flex flex-col gap-0.5">
                            {loc.sceneIndices.map((sceneIdx, i) => (
                              <div
                                key={sceneIdx}
                                className="flex items-start gap-1.5 px-2 py-1.5 rounded-[3px] cursor-pointer text-xs text-(--fd-text) opacity-80 transition-colors duration-100 min-h-8 hover:bg-[rgba(74,158,255,0.1)] hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  goToScene(sceneIdx)
                                }}
                              >
                                <span className="text-(--fd-accent) font-semibold shrink-0 min-w-5 mt-px">
                                  {sceneIdx + 1}.
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-(--fd-text) opacity-70">
                                      {loc.prefixes[i]}
                                    </span>
                                    {loc.times[i] && (
                                      <span className="text-[11px] text-(--fd-text) opacity-60 ml-auto">
                                        {loc.times[i]}
                                      </span>
                                    )}
                                  </div>
                                  {loc.preambles[i] && (
                                    <div className="text-[11px] text-(--fd-text) opacity-50 whitespace-nowrap overflow-hidden text-ellipsis mt-px">
                                      {loc.preambles[i]}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
      {synopsisModal &&
        createPortal(
          <SynopsisModal
            sceneHeading={synopsisModal.heading}
            synopsis={synopsisModal.synopsis}
            sceneColor={synopsisModal.color}
            pageLength={sceneDetails[synopsisModal.sceneIdx]?.pageLength}
            autoTimingSeconds={
              sceneTimings[synopsisModal.sceneIdx]?.autoEstimateSeconds
            }
            timingOverride={
              sceneTimings[synopsisModal.sceneIdx]?.overrideSeconds
            }
            onSave={handleSaveSynopsis}
            onClose={() => setSynopsisModal(null)}
          />,
          document.body,
        )}
    </>
  )
}

export default SceneNavigator
