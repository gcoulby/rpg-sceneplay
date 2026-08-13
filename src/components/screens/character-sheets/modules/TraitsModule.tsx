import React, { useState } from 'react'
import { Tags, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import ModuleCard from './shared/ModuleCard'
import type { ModuleComponentProps } from './moduleProps'

/** Free-text chip capture for feats/traits/tags — no fixed taxonomy. */
export interface TraitItem {
  id: string
  label: string
}

export interface TraitsConfig {}

export interface TraitsValues {
  items: TraitItem[]
}

export const defaultTraitsConfig: TraitsConfig = {}
export const defaultTraitsValues: TraitsValues = { items: [] }

const TraitsModule: React.FC<
  ModuleComponentProps<TraitsConfig, TraitsValues>
> = ({ module, layout, onChangeLabel, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => {
  const { values } = module
  const [draft, setDraft] = useState('')

  const addTrait = (label: string) => {
    if (!label.trim()) return
    onChangeValues({ items: [...values.items, { id: uuid(), label: label.trim() }] })
    setDraft('')
  }

  return (
    <ModuleCard
      label={module.label}
      icon={Tags}
      layout={layout}
      onChangeLabel={onChangeLabel}
      onChangeLayout={onChangeLayout}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col gap-2.5">
        {values.items.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {values.items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-1 pl-2.5 pr-1 py-1 border border-(--fd-border) rounded-full text-(--fd-accent) text-xs bg-(--fd-accent)/10"
              >
                {item.label}
                <button
                  type="button"
                  onClick={() =>
                    onChangeValues({ items: values.items.filter((i) => i.id !== item.id) })
                  }
                  className="flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full size-3.5 transition-opacity"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTrait(draft)
            }}
            placeholder="Add a trait, press Enter…"
            className="h-8 text-xs"
          />
          <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={() => addTrait(draft)}>
            Add
          </Button>
        </div>
      </div>
    </ModuleCard>
  )
}

export default TraitsModule
