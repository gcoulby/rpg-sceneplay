/**
 * Global Knowledge Graph — Visual Graph
 *
 * SVG-based force-directed graph spanning characters, items, locations, and
 * freeform "other" entities. Deliberately a separate component from
 * `RelationshipMap.tsx` rather than a generalization of it: the physics
 * core (repulsion/spring/damping) is copied and reused, but the
 * leads/supporting/minor tiering in `RelationshipMap`'s layout is
 * character-role-specific and dropped here in favor of loose per-kind
 * clustering, so the tuned Character Relationship Map is never at risk of
 * regressing.
 *
 * Character-to-character edges are still backed by `characterRelationships`
 * (added/edited here get routed there so the Character panel's own map
 * stays in sync); every other edge lives in `graphRelationships`.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import {
  useEditorStore,
  type EntityKind,
  type EntityRef,
  type GraphRelationship,
} from '@/stores/editorStore'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import GraphForm, { type EntityOption } from './GraphForm'
import { groupByLocation } from '@/components/left-side-panel/utils/scene-utils'
import { ENTITY_KIND_COLORS, ENTITY_KIND_ORDER } from './graphConstants'

/* ════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════ */

interface GraphNode {
  key: string // `${kind}:${id}`
  ref: EntityRef
  name: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

interface GraphEdge {
  id: string
  source: string // node key
  target: string // node key
  type: string
  description: string
  /** Which store this edge is persisted in, so delete/edit routes correctly. */
  origin: 'character' | 'graph'
}

interface Props {
  scriptId?: string
  onSelectCharacter?: (name: string) => void
}

const refKey = (ref: EntityRef) => `${ref.kind}:${ref.id}`

/* ════════════════════════════════════════════════════════════════════
   FORCE SIMULATION (generic — no per-kind importance tiers)
   ════════════════════════════════════════════════════════════════════ */

function runGraphForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  iterations: number = 150,
): void {
  const cx = width / 2
  const cy = height / 2
  const clusterRadius = Math.min(width, height) * 0.28

  const kindCenters = new Map<EntityKind, { x: number; y: number }>()
  ENTITY_KIND_ORDER.forEach((kind, i) => {
    const angle = (i / ENTITY_KIND_ORDER.length) * Math.PI * 2 - Math.PI / 2
    kindCenters.set(kind, {
      x: cx + Math.cos(angle) * clusterRadius,
      y: cy + Math.sin(angle) * clusterRadius,
    })
  })

  for (const node of nodes) {
    const c = kindCenters.get(node.ref.kind) || { x: cx, y: cy }
    node.x = c.x + (Math.random() - 0.5) * 80
    node.y = c.y + (Math.random() - 0.5) * 80
    node.vx = 0
    node.vy = 0
  }

  const nodeMap = new Map(nodes.map((n) => [n.key, n]))

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
      const c = kindCenters.get(node.ref.kind) || { x: cx, y: cy }
      node.vx += (c.x - node.x) * strength * 0.012
      node.vy += (c.y - node.y) * strength * 0.012
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

export const GraphView: React.FC<Props> = ({ scriptId, onSelectCharacter }) => {
  const characters = useEditorStore((s) => s.characters)
  const knownItems = useEditorStore((s) => s.knownItems)
  const scenes = useEditorStore((s) => s.scenes)
  const otherEntities = useEditorStore((s) => s.otherEntities)
  const characterRelationships = useEditorStore((s) => s.characterRelationships)
  const graphRelationships = useEditorStore((s) => s.graphRelationships)
  const upsertCharacterRelationship = useEditorStore(
    (s) => s.upsertCharacterRelationship,
  )
  const deleteCharacterRelationship = useEditorStore(
    (s) => s.deleteCharacterRelationship,
  )
  const upsertGraphRelationship = useEditorStore((s) => s.upsertGraphRelationship)
  const deleteGraphRelationship = useEditorStore((s) => s.deleteGraphRelationship)

  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 })
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [dragNode, setDragNode] = useState<string | null>(null)
  const [editingEdge, setEditingEdge] = useState<GraphEdge | null>(null)
  const [addingFrom, setAddingFrom] = useState<string | null>(null)

  const positionsKey = `graph-positions-${scriptId || 'default'}`
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
    const nodeMap = new Map<string, GraphNode>()
    const ensureNode = (kind: EntityKind, id: string, name: string) => {
      const key = refKey({ kind, id })
      if (!nodeMap.has(key)) {
        nodeMap.set(key, {
          key,
          ref: { kind, id },
          name,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          radius: 22,
          color: ENTITY_KIND_COLORS[kind],
        })
      }
      return key
    }

    for (const name of characters) ensureNode('character', name, name)
    for (const key of knownItems) ensureNode('item', key, key)
    for (const loc of groupByLocation(scenes)) {
      ensureNode('location', loc.name.toUpperCase(), loc.name)
    }
    for (const ent of otherEntities) ensureNode('other', ent.id, ent.name)

    const edgeList: GraphEdge[] = []
    for (const rel of characterRelationships) {
      const source = ensureNode('character', rel.characterA, rel.characterA)
      const target = ensureNode('character', rel.characterB, rel.characterB)
      edgeList.push({
        id: rel.id,
        source,
        target,
        type: rel.type,
        description: rel.description,
        origin: 'character',
      })
    }
    for (const rel of graphRelationships) {
      const source = ensureNode(rel.a.kind, rel.a.id, rel.a.id)
      const target = ensureNode(rel.b.kind, rel.b.id, rel.b.id)
      edgeList.push({
        id: rel.id,
        source,
        target,
        type: rel.type,
        description: rel.description,
        origin: 'graph',
      })
    }

    return { nodes: Array.from(nodeMap.values()), edges: edgeList }
  }, [characters, knownItems, scenes, otherEntities, characterRelationships, graphRelationships])

  const entityOptions: EntityOption[] = useMemo(
    () => nodes.map((n) => ({ kind: n.ref.kind, id: n.ref.id, name: n.name })),
    [nodes],
  )

  useEffect(() => {
    if (nodes.length === 0) return
    const w = Math.max(dimensions.width, 500)
    const h = Math.max(dimensions.height, 400)
    const layoutNodes = nodes.map((n) => {
      const saved = nodePositions.get(n.key)
      return { ...n, x: saved?.x ?? 0, y: saved?.y ?? 0 }
    })
    const needsLayout = layoutNodes.some((n) => n.x === 0 && n.y === 0)
    if (!needsLayout) return

    runGraphForceLayout(layoutNodes, edges, w, h)

    const newPositions = new Map<string, { x: number; y: number }>(nodePositions)
    for (const n of layoutNodes) newPositions.set(n.key, { x: n.x, y: n.y })

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

    const t = setTimeout(() => {
      savePositions(newPositions)
      setViewBox(nextViewBox)
    }, 0)
    return () => clearTimeout(t)
  }, [nodes, edges, dimensions.width, dimensions.height, nodePositions, savePositions])

  const positionedNodes = useMemo(() => {
    return nodes.map((n) => {
      const pos = nodePositions.get(n.key)
      return {
        ...n,
        x: pos?.x ?? dimensions.width / 2,
        y: pos?.y ?? dimensions.height / 2,
      }
    })
  }, [nodes, nodePositions, dimensions])

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = containerRef.current?.querySelector('svg') as SVGSVGElement | null
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
    (key: string, e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragNode(key)
      setSelectedNode(key)

      const onMove = (ev: PointerEvent) => {
        const pos = screenToSvg(ev.clientX, ev.clientY)
        setNodePositions((prev) => {
          const next = new Map(prev)
          next.set(key, pos)
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
      const svg = containerRef.current?.querySelector('svg') as SVGSVGElement | null
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

  const handleSaveEdge = useCallback(
    (data: Omit<GraphRelationship, 'id'> & { id?: string }) => {
      const bothCharacters = data.a.kind === 'character' && data.b.kind === 'character'
      if (bothCharacters) {
        upsertCharacterRelationship({
          id: data.id || crypto.randomUUID(),
          characterA: data.a.id,
          characterB: data.b.id,
          type: data.type,
          description: data.description,
          dynamic: '',
        })
      } else {
        upsertGraphRelationship({
          id: data.id || crypto.randomUUID(),
          a: data.a,
          b: data.b,
          type: data.type,
          description: data.description,
        })
      }
      setEditingEdge(null)
      setAddingFrom(null)
    },
    [upsertCharacterRelationship, upsertGraphRelationship],
  )

  const handleDeleteEdge = useCallback(
    (edge: GraphEdge) => {
      if (edge.origin === 'character') deleteCharacterRelationship(edge.id)
      else deleteGraphRelationship(edge.id)
      setEditingEdge(null)
    },
    [deleteCharacterRelationship, deleteGraphRelationship],
  )

  const nodeMap = useMemo(
    () => new Map(positionedNodes.map((n) => [n.key, n])),
    [positionedNodes],
  )

  const editingAsGraphRelationship: GraphRelationship | undefined = editingEdge
    ? {
        id: editingEdge.id,
        a: nodeMap.get(editingEdge.source)?.ref || { kind: 'other', id: '' },
        b: nodeMap.get(editingEdge.target)?.ref || { kind: 'other', id: '' },
        type: editingEdge.type,
        description: editingEdge.description,
      }
    : undefined

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-(--fd-text-muted) text-[13px]">
        <p>No entities yet.</p>
        <p style={{ fontSize: 11, color: 'var(--fd-text-muted)' }}>
          Add characters, [items], or scene locations to your screenplay, or
          add a custom entity here, to start building the graph.
        </p>
      </div>
    )
  }

  return (
    <div
      className="relative flex-1 min-h-0 overflow-hidden"
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
          const relColor = s.color
          const midX = (s.x + t.x) / 2
          const midY = (s.y + t.y) / 2
          const isSelected = selectedNode === edge.source || selectedNode === edge.target

          return (
            <g key={edge.id}>
              <line
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={relColor}
                strokeWidth={isSelected ? 2.5 : 1.5}
                strokeOpacity={isSelected ? 1 : 0.4}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingEdge(edge)
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
                {edge.type}
              </text>
            </g>
          )
        })}

        {positionedNodes.map((node) => {
          const isSelected = selectedNode === node.key
          const initials = node.name.slice(0, 2).toUpperCase()

          return (
            <g
              key={node.key}
              style={{ cursor: dragNode === node.key ? 'grabbing' : 'grab' }}
              onPointerDown={(e) => handlePointerDown(node.key, e)}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation()
                if (node.ref.kind === 'character' && onSelectCharacter) {
                  onSelectCharacter(node.name)
                }
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
                {node.name}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 py-1.5 px-2.5 bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-md text-xs shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        {selectedNode ? (
          <>
            <span className="font-bold text-[13px]">
              {nodeMap.get(selectedNode)?.name}
            </span>
            <button
              className="py-1 px-2.5 rounded text-[11px] cursor-pointer whitespace-nowrap bg-(--fd-accent) border border-(--fd-accent) text-white hover:opacity-90"
              onClick={() => setAddingFrom(selectedNode)}
            >
              + Add Relationship
            </button>
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
          title="Fit all entities to screen"
        >
          Fit
        </button>
      </div>

      <Dialog
        open={!!(addingFrom || editingEdge)}
        onOpenChange={(open) => {
          if (!open) {
            setAddingFrom(null)
            setEditingEdge(null)
          }
        }}
      >
        <DialogContent className="gap-0 bg-transparent shadow-none p-0 border-none max-w-sm">
          {(addingFrom || editingEdge) && (
            <>
              <GraphForm
                entities={entityOptions}
                initialA={
                  addingFrom && addingFrom !== '__BOTH__'
                    ? nodeMap.get(addingFrom)?.ref
                    : undefined
                }
                existing={editingAsGraphRelationship}
                onSave={handleSaveEdge}
                onCancel={() => {
                  setAddingFrom(null)
                  setEditingEdge(null)
                }}
              />
              {editingEdge && (
                <Button
                  variant="outline"
                  className="hover:bg-[rgba(239,83,80,0.1)] mt-2 border-[#ef5350] w-full text-[#ef5350]"
                  onClick={() => handleDeleteEdge(editingEdge)}
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
