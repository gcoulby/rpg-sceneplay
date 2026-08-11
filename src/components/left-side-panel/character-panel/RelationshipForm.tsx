import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { REL_TYPES, REL_DYNAMICS } from './characterConstants'
import type { CharacterRelationship } from '@/stores/editorStore'

interface RelationshipFormProps {
  characterName: string
  allCharacters: string[]
  selectBoth?: boolean
  existing?: CharacterRelationship
  onSave: (rel: Omit<CharacterRelationship, 'id'> & { id?: string }) => void
  onCancel: () => void
}

const LABEL_CLASS =
  'block text-[10px] font-semibold uppercase tracking-[0.3px] text-(--fd-text-muted) mb-1'

const RelationshipForm: React.FC<RelationshipFormProps> = ({
  characterName,
  allCharacters,
  selectBoth,
  existing,
  onSave,
  onCancel,
}) => {
  const [charA, setCharA] = useState(
    existing?.characterA || (selectBoth ? '' : characterName),
  )
  const [otherChar, setOtherChar] = useState(
    existing
      ? existing.characterA === characterName
        ? existing.characterB
        : existing.characterA
      : '',
  )
  const [relType, setRelType] = useState(existing?.type || 'allies')
  const [dynamic, setDynamic] = useState(existing?.dynamic || 'Stable')
  const [desc, setDesc] = useState(existing?.description || '')

  const effectiveA = selectBoth ? charA : characterName
  const othersForB = allCharacters.filter((c) => c !== effectiveA)

  const handleSubmit = () => {
    if (!effectiveA || !otherChar) return
    onSave({
      id: existing?.id,
      characterA: effectiveA,
      characterB: otherChar,
      type: relType,
      dynamic,
      description: desc,
    })
  }

  return (
    <div className="border border-(--fd-border) rounded-md p-3 bg-background">
      {selectBoth && (
        <div className="mb-2">
          <label className={LABEL_CLASS}>Character A</label>
          <Select
            value={charA}
            onValueChange={(v) => {
              setCharA(v ?? '')
              setOtherChar('')
            }}
          >
            <SelectTrigger className="w-full text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {allCharacters.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="mb-2">
        <label className={LABEL_CLASS}>
          {selectBoth ? 'Character B' : 'Character'}
        </label>
        <Select value={otherChar} onValueChange={(v) => setOtherChar(v ?? '')}>
          <SelectTrigger className="w-full text-xs">
            <SelectValue placeholder="Select character..." />
          </SelectTrigger>
          <SelectContent>
            {othersForB.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <label className={LABEL_CLASS}>Type</label>
          <Select
            value={relType}
            onValueChange={(v) => setRelType(v ?? 'allies')}
          >
            <SelectTrigger className="w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-0">
          <label className={LABEL_CLASS}>Dynamic</label>
          <Select
            value={dynamic}
            onValueChange={(v) => setDynamic(v ?? 'Stable')}
          >
            <SelectTrigger className="w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REL_DYNAMICS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
          disabled={!effectiveA || !otherChar}
        >
          {existing ? 'Update' : 'Add'}
        </Button>
      </div>
    </div>
  )
}

export default RelationshipForm
