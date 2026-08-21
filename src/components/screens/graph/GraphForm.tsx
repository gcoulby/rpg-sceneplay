import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ALL_REL_TYPES,
  ENTITY_KIND_LABELS,
  ENTITY_KIND_ORDER,
  relTypesForPair,
} from './graphConstants'
import type { EntityKind, EntityRef, GraphRelationship } from '@/stores/editorStore'

export interface EntityOption {
  kind: EntityKind
  id: string
  name: string
}

const refKey = (ref: EntityRef) => `${ref.kind}:${ref.id}`
const parseKey = (key: string): EntityRef => {
  const idx = key.indexOf(':')
  return { kind: key.slice(0, idx) as EntityKind, id: key.slice(idx + 1) }
}

interface GraphFormProps {
  entities: EntityOption[]
  initialA?: EntityRef
  existing?: GraphRelationship
  onSave: (
    rel: Omit<GraphRelationship, 'id'> & { id?: string },
  ) => void
  onCancel: () => void
}

const LABEL_CLASS =
  'block text-[10px] font-semibold uppercase tracking-[0.3px] text-(--fd-text-muted) mb-1'

const EntitySelect: React.FC<{
  label: string
  entities: EntityOption[]
  value: string
  onChange: (v: string) => void
  exclude?: string
}> = ({ label, entities, value, onChange, exclude }) => (
  <div className="mb-2">
    <label className={LABEL_CLASS}>{label}</label>
    <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
      <SelectTrigger className="w-full text-xs">
        <SelectValue placeholder="Select...">
          {(v: string | null) =>
            v ? entities.find((e) => refKey({ kind: e.kind, id: e.id }) === v)?.name ?? v : 'Select...'
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ENTITY_KIND_ORDER.map((kind) => {
          const opts = entities.filter(
            (e) => e.kind === kind && refKey({ kind, id: e.id }) !== exclude,
          )
          if (opts.length === 0) return null
          return (
            <SelectGroup key={kind}>
              <SelectLabel>{ENTITY_KIND_LABELS[kind]}</SelectLabel>
              {opts.map((e) => (
                <SelectItem key={refKey({ kind, id: e.id })} value={refKey({ kind, id: e.id })}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )
        })}
      </SelectContent>
    </Select>
  </div>
)

const GraphForm: React.FC<GraphFormProps> = ({
  entities,
  initialA,
  existing,
  onSave,
  onCancel,
}) => {
  const [aKey, setAKey] = useState(
    existing ? refKey(existing.a) : initialA ? refKey(initialA) : '',
  )
  const [bKey, setBKey] = useState(existing ? refKey(existing.b) : '')
  const [relType, setRelType] = useState(existing?.type || '')
  const [desc, setDesc] = useState(existing?.description || '')

  // The set of sensible relationship types depends on what kinds of entity
  // are on each end — a character can be "allies" with another character,
  // not with a rock. Recomputed whenever either endpoint's kind changes.
  const availableTypes = useMemo(() => {
    const aKind = aKey ? parseKey(aKey).kind : null
    const bKind = bKey ? parseKey(bKey).kind : null
    if (aKind && bKind) return relTypesForPair(aKind, bKind)
    return ALL_REL_TYPES
  }, [aKey, bKey])

  // If a change to either endpoint invalidates the current type selection,
  // fall back to the first type that's actually valid for the new pairing
  // rather than silently saving a type that no longer makes sense.
  useEffect(() => {
    if (!availableTypes.includes(relType)) setRelType(availableTypes[0] ?? '')
  }, [availableTypes, relType])

  const handleSubmit = () => {
    if (!aKey || !bKey || aKey === bKey) return
    onSave({
      id: existing?.id,
      a: parseKey(aKey),
      b: parseKey(bKey),
      type: relType,
      description: desc,
    })
  }

  return (
    <div className="border border-(--fd-border) rounded-md p-3 bg-background">
      <EntitySelect
        label="Entity A"
        entities={entities}
        value={aKey}
        onChange={(v) => {
          setAKey(v)
          if (v === bKey) setBKey('')
        }}
      />
      <EntitySelect
        label="Entity B"
        entities={entities}
        value={bKey}
        onChange={setBKey}
        exclude={aKey}
      />

      <label className={LABEL_CLASS}>Type</label>
      <Select value={relType} onValueChange={(v) => setRelType(v ?? availableTypes[0] ?? '')}>
        <SelectTrigger className="w-full text-xs mb-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableTypes.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className={LABEL_CLASS}>Description</label>
      <Textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={2}
        placeholder="Describe the relationship..."
        className="text-[11px]"
      />

      <div className="flex justify-end gap-1.5 mt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!aKey || !bKey || aKey === bKey}
        >
          {existing ? 'Update' : 'Add'}
        </Button>
      </div>
    </div>
  )
}

export default GraphForm
