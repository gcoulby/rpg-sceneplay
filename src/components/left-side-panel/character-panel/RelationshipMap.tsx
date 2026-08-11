/**
 * Character Relationship Map — Visual Graph
 *
 * SVG-based force-directed graph showing character relationships.
 * Characters are nodes sized by importance (dialogue count / role).
 * Edges show relationship type and dynamic.
 *
 * Only change from the original: REL_TYPES/REL_DYNAMICS/ROLE_IMPORTANCE/
 * REL_COLORS/DEFAULT_NODE_COLORS now come from characterConstants.ts
 * (previously duplicated here and in CharacterProfiles.tsx), and the local
 * RelForm component has been replaced with the shared RelationshipForm
 * (previously ~90% identical to CharacterProfiles.tsx's InlineRelForm).
 * The force simulation, drag/pan/zoom, and SVG rendering are unchanged.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  useEditorStore,
  type CharacterProfile,
  type CharacterRelationship,
} from '@/stores/editorStore'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import RelationshipForm from './RelationshipForm'
import {
  ROLE_IMPORTANCE,
  REL_COLORS,
  DEFAULT_NODE_COLORS,
} from './characterConstants'

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */

interface GraphNode {
  id: string // uppercase character name
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  role: string
  dialogueCount: number
  profile: CharacterProfile | null
  imageUrl?: string
}

interface GraphEdge {
  id: string
  source: string
  target: string
  rel: CharacterRelationship
}

interface Props {
  /** Used to scope localStorage positions and force remount on file switch */
  scriptId?: string
  onSelectCharacter?: (name: string) => void
}

/* ════════════════════════════════════════════════════════════════════
   FORCE SIMULATION
   ════════════════════════════════════════════════════════════════════ */

function runForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  iterations: number = 150,
): void {
  const cx = width / 2
  const cy = height / 3 // Top-center for important characters

  const leads: GraphNode[] = []
  const supporting: GraphNode[] = []
  const minor: GraphNode[] = []
  const edgeSet = new Set<string>()
  for (const e of edges) {
    edgeSet.add(e.source)
    edgeSet.add(e.target)
  }

  for (const node of nodes) {
    const importance = ROLE_IMPORTANCE[node.role] || 1
    if (importance >= 4) leads.push(node)
    else if (importance >= 2 || edgeSet.has(node.id)) supporting.push(node)
    else minor.push(node)
  }

  const leadSpacing = Math.min(140, (width - 100) / Math.max(1, leads.length))
  const leadStartX = cx - ((leads.length - 1) * leadSpacing) / 2
  leads.forEach((node, i) => {
    node.x = leadStartX + i * leadSpacing
    node.y = cy
    node.vx = 0
    node.vy = 0
  })

  const supportArc = Math.PI * 0.7
  const supportRadius = Math.min(180, Math.max(100, width * 0.25))
  supporting.forEach((node, i) => {
    const angle =
      -supportArc / 2 + (i / Math.max(1, supporting.length - 1)) * supportArc
    node.x = cx + Math.sin(angle) * supportRadius
    node.y = cy + 80 + Math.cos(angle) * supportRadius * 0.5
    node.vx = 0
    node.vy = 0
  })

  const minorSpacing = Math.min(100, (width - 60) / Math.max(1, minor.length))
  const minorStartX = cx - ((minor.length - 1) * minorSpacing) / 2
  minor.forEach((node, i) => {
    node.x = minorStartX + i * minorSpacing
    node.y = height * 0.8 + (Math.random() - 0.5) * 20
    node.vx = 0
    node.vy = 0
  })

  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations
    const strength = alpha * 0.35

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i],
          b = nodes[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
        const minDist = (a.radius + b.radius) * 2.8
        const force = ((minDist * minDist) / (dist * dist)) * strength * 1.5
        dx /= dist
        dy /= dist
        a.vx -= dx * force
        a.vy -= dy * force
        b.vx += dx * force
        b.vy += dy * force
      }
    }

    for (const edge of edges) {
      const a = nodeMap.get(edge.source)
      const b = nodeMap.get(edge.target)
      if (!a || !b) continue
      let dx = b.x - a.x
      let dy = b.y - a.y
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy))
      const idealDist = (a.radius + b.radius) * 3.5
      const force = (dist - idealDist) * strength * 0.06
      dx /= dist
      dy /= dist
      a.vx += dx * force
      a.vy += dy * force
      b.vx -= dx * force
      b.vy -= dy * force
    }

    for (const node of nodes) {
      const importance = ROLE_IMPORTANCE[node.role] || 1
      const targetY =
        importance >= 4 ? cy : importance >= 2 ? cy + 100 : height * 0.7
      node.vy += (targetY - node.y) * strength * 0.015
      node.vx += (cx - node.x) * strength * 0.008
    }

    for (const node of nodes) {
      node.vx *= 0.65
      node.vy *= 0.65
      node.x += node.vx
      node.y += node.vy
    }
  }
}

/* ════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════ */

export const RelationshipMap: React.FC<Props> = ({
  scriptId,
  onSelectCharacter,
}) => {
  const characters = useEditorStore((s) => s.characters)
  const characterProfiles = useEditorStore((s) => s.characterProfiles)
  const characterRelationships = useEditorStore((s) => s.characterRelationships)
  const upsertCharacterRelationship = useEditorStore(
    (s) => s.upsertCharacterRelationship,
  )
  const deleteCharacterRelationship = useEditorStore(
    (s) => s.deleteCharacterRelationship,
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [dragNode, setDragNode] = useState<string | null>(null)
  const [editingRel, setEditingRel] = useState<CharacterRelationship | null>(
    null,
  )
  const [addingFrom, setAddingFrom] = useState<string | null>(null)

  const positionsKey = `rel-map-positions-${scriptId || 'default'}`
  const loadSavedPositions = (): Map<string, { x: number; y: number }> => {
    try {
      const raw = localStorage.getItem(positionsKey)
      if (raw) return new Map(JSON.parse(raw))
    } catch {
      /* ignore */
    }
    return new Map()
  }
  const [nodePositions, setNodePositions] =
    useState<Map<string, { x: number; y: number }>>(loadSavedPositions)

  const savePositionsRef = useRef(nodePositions)
  useEffect(() => {
    savePositionsRef.current = nodePositions
  })
  useEffect(() => {
    return () => {
      try {
        localStorage.setItem(
          positionsKey,
          JSON.stringify(Array.from(savePositionsRef.current.entries())),
        )
      } catch {
        /* ignore */
      }
    }
  }, [positionsKey])
  const savePositions = useCallback(
    (positions: Map<string, { x: number; y: number }>) => {
      setNodePositions(positions)
      try {
        localStorage.setItem(
          positionsKey,
          JSON.stringify(Array.from(positions.entries())),
        )
      } catch {
        /* ignore */
      }
    },
    [positionsKey],
  )

  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 600, h: 400 })
  const [isPanning, setIsPanning] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        setDimensions({ width, height })
        setViewBox((prev) =>
          prev.w === 600 && prev.h === 400
            ? { x: -50, y: -50, w: width + 100, h: height + 100 }
            : prev,
        )
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const { nodes, edges } = useMemo(() => {
    const profileMap = new Map(characterProfiles.map((p) => [p.name, p]))

    const charStats = new Map<string, number>()
    for (const name of characters) {
      const profile = profileMap.get(name)
      const role = profile?.role || ''
      charStats.set(name, ROLE_IMPORTANCE[role] || 1)
    }

    const includeSet = new Set<string>(characters)
    for (const rel of characterRelationships) {
      includeSet.add(rel.characterA)
      includeSet.add(rel.characterB)
    }

    const nodeList: GraphNode[] = Array.from(includeSet).map((name, i) => {
      const profile = profileMap.get(name) || null
      const importance = charStats.get(name) || 1
      const radius = 18 + importance * 6
      const color =
        profile?.color || DEFAULT_NODE_COLORS[i % DEFAULT_NODE_COLORS.length]

      return {
        id: name,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius,
        color,
        role: profile?.role || '',
        dialogueCount: importance,
        profile,
      }
    })

    const edgeList: GraphEdge[] = characterRelationships.map((rel) => ({
      id: rel.id,
      source: rel.characterA,
      target: rel.characterB,
      rel,
    }))

    return { nodes: nodeList, edges: edgeList }
  }, [characters, characterProfiles, characterRelationships])

  useEffect(() => {
    if (nodes.length === 0) return
    const w = Math.max(dimensions.width, 500)
    const h = Math.max(dimensions.height, 400)
    const layoutNodes = nodes.map((n) => {
      const saved = nodePositions.get(n.id)
      return { ...n, x: saved?.x ?? 0, y: saved?.y ?? 0 }
    })
    const needsLayout = layoutNodes.some((n) => n.x === 0 && n.y === 0)
    if (!needsLayout) return

    runForceLayout(layoutNodes, edges, w, h)

    const newPositions = new Map<string, { x: number; y: number }>(
      nodePositions,
    )
    for (const n of layoutNodes) newPositions.set(n.id, { x: n.x, y: n.y })

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const n of layoutNodes) {
      minX = Math.min(minX, n.x - n.radius - 30)
      minY = Math.min(minY, n.y - n.radius - 30)
      maxX = Math.max(maxX, n.x + n.radius + 30)
      maxY = Math.max(maxY, n.y + n.radius + 30)
    }
    const pad = 60
    const nextViewBox = {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    }

    // Defer both state commits into a callback rather than the effect
    // body's synchronous path — same fix used for the timing-report
    // scroll effect elsewhere in this app. The needsLayout guard above is
    // what keeps this from looping now that nodePositions/savePositions
    // are real dependencies: once positions exist, needsLayout is false
    // and the effect returns early instead of recomputing.
    const t = setTimeout(() => {
      savePositions(newPositions)
      setViewBox(nextViewBox)
    }, 0)
    return () => clearTimeout(t)
  }, [
    nodes,
    edges,
    dimensions.width,
    dimensions.height,
    nodePositions,
    savePositions,
  ])

  const positionedNodes = useMemo(() => {
    return nodes.map((n) => {
      const pos = nodePositions.get(n.id)
      return {
        ...n,
        x: pos?.x ?? dimensions.width / 2,
        y: pos?.y ?? dimensions.height / 2,
      }
    })
  }, [nodes, nodePositions, dimensions])

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = containerRef.current?.querySelector(
      'svg',
    ) as SVGSVGElement | null
    if (!svg) return { x: clientX, y: clientY }
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return { x: clientX, y: clientY }
    const svgPt = pt.matrixTransform(ctm.inverse())
    return { x: svgPt.x, y: svgPt.y }
  }, [])

  const handlePointerDown = useCallback(
    (name: string, e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragNode(name)
      setSelectedNode(name)

      const onMove = (ev: PointerEvent) => {
        const pos = screenToSvg(ev.clientX, ev.clientY)
        setNodePositions((prev) => {
          const next = new Map(prev)
          next.set(name, pos)
          return next
        })
      }
      const onUp = () => {
        setDragNode(null)
        savePositions(savePositionsRef.current)
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
      }
      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
    },
    [screenToSvg, savePositions],
  )

  const handleSvgPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as Element
    if (target.tagName !== 'svg') return
    e.preventDefault()
    setIsPanning(true)
    let lastX = e.clientX
    let lastY = e.clientY

    const onMove = (ev: PointerEvent) => {
      const svg = containerRef.current?.querySelector(
        'svg',
      ) as SVGSVGElement | null
      if (!svg) return
      const rect = svg.getBoundingClientRect()
      const dx = ev.clientX - lastX
      const dy = ev.clientY - lastY
      lastX = ev.clientX
      lastY = ev.clientY
      setViewBox((v) => ({
        ...v,
        x: v.x - dx * (v.w / rect.width),
        y: v.y - dy * (v.h / rect.height),
      }))
    }
    const onUp = () => {
      setIsPanning(false)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 1.1 : 0.9
    const svg = containerRef.current?.querySelector('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / rect.width
    const my = (e.clientY - rect.top) / rect.height
    setViewBox((v) => {
      const newW = v.w * factor
      const newH = v.h * factor
      return {
        x: v.x + (v.w - newW) * mx,
        y: v.y + (v.h - newH) * my,
        w: newW,
        h: newH,
      }
    })
  }, [])

  const handleSaveRel = useCallback(
    (data: Omit<CharacterRelationship, 'id'> & { id?: string }) => {
      const rel: CharacterRelationship = {
        id: data.id || crypto.randomUUID(),
        characterA: data.characterA,
        characterB: data.characterB,
        type: data.type,
        description: data.description,
        dynamic: data.dynamic,
      }
      upsertCharacterRelationship(rel)
      setEditingRel(null)
      setAddingFrom(null)
    },
    [upsertCharacterRelationship],
  )

  const nodeMap = useMemo(
    () => new Map(positionedNodes.map((n) => [n.id, n])),
    [positionedNodes],
  )

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-(--fd-text-muted) text-[13px]">
        <p>No characters in the screenplay yet.</p>
        <p style={{ fontSize: 11, color: 'var(--fd-text-muted)' }}>
          Add character elements to your screenplay to see them here.
        </p>
      </div>
    )
  }

  return (
    <div
      className="relative flex-1 min-h-0 overflow-hidden rel-map-container"
      ref={containerRef}
      onWheel={handleWheel}
    >
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="block w-full h-full"
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
        onClick={() => {
          setSelectedNode(null)
          setAddingFrom(null)
        }}
        onPointerDown={handleSvgPointerDown}
      >
        {edges.map((edge) => {
          const s = nodeMap.get(edge.source)
          const t = nodeMap.get(edge.target)
          if (!s || !t) return null
          const relColor = REL_COLORS[edge.rel.type] || '#666'
          const midX = (s.x + t.x) / 2
          const midY = (s.y + t.y) / 2
          const isSelected =
            selectedNode === edge.source || selectedNode === edge.target

          return (
            <g key={edge.id}>
              <line
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={relColor}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeOpacity={isSelected ? 1 : 0.5}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingRel(edge.rel)
                }}
              />
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                fontSize={9}
                fill={relColor}
                fontWeight={600}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {edge.rel.type}
              </text>
              {edge.rel.dynamic && (
                <text
                  x={midX}
                  y={midY + 5}
                  textAnchor="middle"
                  fontSize={8}
                  fill="var(--fd-text-muted, #888)"
                  fontStyle="italic"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {edge.rel.dynamic}
                </text>
              )}
            </g>
          )
        })}

        {positionedNodes.map((node) => {
          const isSelected = selectedNode === node.id
          const initials = node.id.slice(0, 2)
          const roleLabel = node.role || ''

          return (
            <g
              key={node.id}
              style={{ cursor: dragNode === node.id ? 'grabbing' : 'grab' }}
              onPointerDown={(e) => handlePointerDown(node.id, e)}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation()
                if (onSelectCharacter) onSelectCharacter(node.id)
              }}
            >
              {isSelected && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius + 4}
                  fill="none"
                  stroke={node.color}
                  strokeWidth={2}
                  strokeOpacity={0.5}
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={node.color}
                fillOpacity={0.15}
                stroke={node.color}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={node.radius * 0.65}
                fontWeight={700}
                fill={node.color}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {initials}
              </text>
              <text
                x={node.x}
                y={node.y + node.radius + 12}
                textAnchor="middle"
                fontSize={10}
                fontWeight={600}
                fill="var(--fd-text, #ccc)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {node.id}
              </text>
              {roleLabel && (
                <text
                  x={node.x}
                  y={node.y + node.radius + 22}
                  textAnchor="middle"
                  fontSize={8}
                  fill="var(--fd-text-muted, #888)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {roleLabel}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 py-1.5 px-2.5 bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-md text-xs shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        {selectedNode ? (
          <>
            <span className="font-bold text-[13px]">{selectedNode}</span>
            <button
              className="py-1 px-2.5 rounded text-[11px] cursor-pointer whitespace-nowrap bg-(--fd-accent) border border-(--fd-accent) text-white hover:opacity-90"
              onClick={() => setAddingFrom(selectedNode)}
            >
              + Add Relationship
            </button>
            {onSelectCharacter && (
              <button
                className="py-1 px-2.5 border border-(--fd-border) rounded text-(--fd-text) text-[11px] cursor-pointer whitespace-nowrap bg-transparent hover:bg-(--fd-overlay-light)"
                onClick={() => onSelectCharacter(selectedNode)}
              >
                View Profile
              </button>
            )}
          </>
        ) : (
          <>
            <span className="text-(--fd-text-muted) text-[11px]">
              Scroll to zoom. Drag background to pan.
            </span>
            {nodes.length >= 2 && (
              <button
                className="py-1 px-2.5 rounded text-[11px] cursor-pointer whitespace-nowrap bg-(--fd-accent) border border-(--fd-accent) text-white hover:opacity-90"
                onClick={() => setAddingFrom('__BOTH__')}
              >
                + Add Relationship
              </button>
            )}
          </>
        )}
        <button
          className="py-1 px-2.5 border border-(--fd-border) rounded text-(--fd-text) text-[11px] cursor-pointer whitespace-nowrap bg-transparent hover:bg-(--fd-overlay-light)"
          style={{ marginLeft: 'auto' }}
          onClick={() => {
            if (positionedNodes.length === 0) return
            let minX = Infinity,
              minY = Infinity,
              maxX = -Infinity,
              maxY = -Infinity
            for (const n of positionedNodes) {
              minX = Math.min(minX, n.x - n.radius - 30)
              minY = Math.min(minY, n.y - n.radius - 30)
              maxX = Math.max(maxX, n.x + n.radius + 30)
              maxY = Math.max(maxY, n.y + n.radius + 30)
            }
            const pad = 60
            setViewBox({
              x: minX - pad,
              y: minY - pad,
              w: maxX - minX + pad * 2,
              h: maxY - minY + pad * 2,
            })
          }}
          title="Fit all characters to screen"
        >
          Fit
        </button>
      </div>

      <Dialog
        open={!!(addingFrom || editingRel)}
        onOpenChange={(open) => {
          if (!open) {
            setAddingFrom(null)
            setEditingRel(null)
          }
        }}
      >
        <DialogContent className="gap-0 bg-transparent shadow-none p-0 border-none max-w-sm">
          {(addingFrom || editingRel) && (
            <>
              <RelationshipForm
                characterName={
                  addingFrom === '__BOTH__'
                    ? ''
                    : addingFrom || editingRel!.characterA
                }
                selectBoth={addingFrom === '__BOTH__'}
                allCharacters={characters}
                existing={editingRel || undefined}
                onSave={handleSaveRel}
                onCancel={() => {
                  setAddingFrom(null)
                  setEditingRel(null)
                }}
              />
              {editingRel && (
                <Button
                  variant="outline"
                  className="hover:bg-[rgba(239,83,80,0.1)] mt-2 border-[#ef5350] w-full text-[#ef5350]"
                  onClick={() => {
                    deleteCharacterRelationship(editingRel.id)
                    setEditingRel(null)
                  }}
                >
                  Delete Relationship
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
