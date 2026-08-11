import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import RelationshipForm from './RelationshipForm'
import type { CharacterRelationship } from '@/stores/editorStore'

interface RelationshipListProps {
  characterName: string // uppercase
  allCharacters: string[]
  relationships: CharacterRelationship[]
  onSave: (rel: CharacterRelationship) => void
  onDelete: (id: string) => void
}

const RelationshipList: React.FC<RelationshipListProps> = ({
  characterName,
  allCharacters,
  relationships,
  onSave,
  onDelete,
}) => {
  const [isAdding, setIsAdding] = useState(false)

  return (
    <div className="mt-1.5">
      <div className="flex justify-between items-center mb-1">
        <label className="text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px]">
          Relationships
        </label>
        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            className="h-auto py-0.5 px-2 text-[10px]"
            onClick={() => setIsAdding(true)}
          >
            + Add
          </Button>
        )}
      </div>

      {relationships.map((r) => {
        const other = r.characterA === characterName ? r.characterB : r.characterA
        return (
          <div
            key={r.id}
            className="px-2 py-1.5 border border-(--fd-border) rounded-sm mt-1 text-xs"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-xs">{other}</span>
              <span className="text-[10px] px-1.5 py-px rounded-[3px] bg-(--fd-overlay-light) text-(--fd-text-muted) capitalize">
                {r.type}
              </span>
              {r.dynamic && (
                <span className="text-[10px] text-(--fd-text-muted) italic">{r.dynamic}</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-4 text-(--fd-text-muted) hover:text-[#ef5350]"
                onClick={() => onDelete(r.id)}
                title="Remove relationship"
              >
                <X className="size-3" />
              </Button>
            </div>
            {r.description && (
              <div className="mt-0.75 text-[11px] text-(--fd-text-muted) leading-[1.4]">
                {r.description}
              </div>
            )}
          </div>
        )
      })}

      {relationships.length === 0 && !isAdding && (
        <div className="text-[11px] text-(--fd-text-muted) py-1.5 italic">
          No relationships defined yet
        </div>
      )}

      {isAdding && (
        <RelationshipForm
          characterName={characterName}
          allCharacters={allCharacters}
          onSave={(rel) => {
            onSave({ id: rel.id || crypto.randomUUID(), ...rel } as CharacterRelationship)
            setIsAdding(false)
          }}
          onCancel={() => setIsAdding(false)}
        />
      )}
    </div>
  )
}

export default RelationshipList
