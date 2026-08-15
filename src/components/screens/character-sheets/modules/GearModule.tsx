import React, { useState } from 'react'
import { Backpack, Dices, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { uuid } from '@/utils/open-draft/uuid'
import { resolveReferences } from '../formula/resolveReferences'
import { rollFormula } from '../formula/rollFormula'
import ModuleCard from './shared/ModuleCard'
import NumberField from './shared/NumberField'
import AddTile from './shared/AddTile'
import type { ModuleComponentProps } from './moduleProps'

export interface GearItem {
  id: string
  name: string
  /** Free-form, user-defined category — not a fixed system taxonomy. Used to
   *  derive filter chips dynamically from whatever tags are actually in use. */
  tag: string
  qty: number
  weight: number
  /** Optional roll formula, e.g. a weapon's damage — reuses the same
   *  {Label} reference syntax as Custom Buttons. */
  formula: string
  notes: string
}

/** User-named currency counter — deliberately not a fixed GP/SP/CP set so
 *  the module stays system-agnostic. */
export interface CurrencyItem {
  id: string
  label: string
  value: number
}

export interface GearConfig {
  /** Optional carry-weight cap. 0/undefined means "don't show a limit". */
  carryCapacity?: number
}

export interface GearValues {
  items: GearItem[]
  currencies?: CurrencyItem[]
}

export const defaultGearConfig: GearConfig = {}
export const defaultGearValues: GearValues = { items: [], currencies: [] }

function newItem(): GearItem {
  return { id: uuid(), name: 'New Item', tag: '', qty: 1, weight: 0, formula: '', notes: '' }
}

/** Sheets saved before tag/formula existed on GearItem have those fields
 *  undefined — fill in defaults rather than assume the current shape. */
function normalizeItem(item: Partial<GearItem> & { id: string }): GearItem {
  return {
    id: item.id,
    name: item.name ?? '',
    tag: item.tag ?? '',
    qty: item.qty ?? 0,
    weight: item.weight ?? 0,
    formula: item.formula ?? '',
    notes: item.notes ?? '',
  }
}

const GearModule: React.FC<
  ModuleComponentProps<GearConfig, GearValues>
> = ({
  module,
  valueMap,
  layout,
  onChangeLabel,
  onChangeConfig,
  onChangeValues,
  onChangeLayout,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const { config, values } = module
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [lastRoll, setLastRoll] = useState<Record<string, number>>({})

  const items = (values.items ?? []).map(normalizeItem)
  const currencies = values.currencies ?? []

  const tags = Array.from(
    new Set(items.map((i) => i.tag.trim()).filter(Boolean)),
  ).sort()

  const totalWeight = items.reduce((sum, i) => sum + i.qty * i.weight, 0)
  const capacity = config.carryCapacity ?? 0
  const overCapacity = capacity > 0 && totalWeight > capacity

  const visibleItems = items.filter((item) => {
    if (filterTag && item.tag.trim() !== filterTag) return false
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const updateItem = (id: string, updates: Partial<GearItem>) =>
    onChangeValues({
      ...values,
      items: items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    })

  const updateCurrency = (id: string, updates: Partial<CurrencyItem>) =>
    onChangeValues({
      ...values,
      currencies: currencies.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })

  return (
    <ModuleCard
      label={module.label}
      icon={Backpack}
      layout={layout}
      onChangeLabel={onChangeLabel}
      onChangeLayout={onChangeLayout}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
    >
      <div className="flex flex-col gap-2.5">
        {(currencies.length > 0 || items.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {currencies.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-1 bg-black/10 px-1.5 py-0.5 border border-(--fd-border) rounded-md"
              >
                <input
                  value={c.label}
                  onChange={(e) => updateCurrency(c.id, { label: e.target.value })}
                  className="bg-transparent w-10 font-medium text-[10px] text-(--fd-text-muted) uppercase outline-none"
                />
                <NumberField
                  value={c.value}
                  min={0}
                  onChange={(v) => updateCurrency(c.id, { value: v })}
                  inputClassName="h-6 w-12 text-[10px]"
                />
                <button
                  type="button"
                  onClick={() =>
                    onChangeValues({ ...values, currencies: currencies.filter((x) => x.id !== c.id) })
                  }
                  className="text-(--fd-text-muted) hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                onChangeValues({
                  ...values,
                  currencies: [...currencies, { id: uuid(), label: 'GP', value: 0 }],
                })
              }
              className="px-2 py-1 border border-(--fd-border) border-dashed rounded-md text-[10px] text-(--fd-text-muted) hover:border-(--fd-accent) hover:text-(--fd-accent) transition-colors"
            >
              + Currency
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 text-[10px] text-(--fd-text-muted)">
          <span className="uppercase tracking-wide">Carry</span>
          <span className={overCapacity ? 'font-semibold text-destructive' : ''}>
            {totalWeight}
            {capacity > 0 ? ` / ${capacity}` : ''}
          </span>
          {capacity > 0 ? (
            <div className="flex-1 bg-black/30 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-[width] duration-200 ${overCapacity ? 'bg-destructive' : 'bg-(--fd-accent)'}`}
                style={{ width: `${Math.min(100, (totalWeight / capacity) * 100)}%` }}
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}
          <NumberField
            value={capacity}
            min={0}
            onChange={(v) => onChangeConfig({ ...config, carryCapacity: v || undefined })}
            inputClassName="h-6 w-14 text-[10px]"
            title="Carry capacity (0 = no limit shown)"
          />
        </div>

        {(items.length > 3 || tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setFilterTag(null)}
                  className={`px-2 py-0.5 rounded-full border text-[10px] transition-colors ${
                    filterTag === null
                      ? 'bg-(--fd-accent) border-(--fd-accent) text-white'
                      : 'border-(--fd-border) text-(--fd-text-muted) hover:border-(--fd-text-muted)'
                  }`}
                >
                  All
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setFilterTag(tag)}
                    className={`px-2 py-0.5 rounded-full border text-[10px] transition-colors ${
                      filterTag === tag
                        ? 'bg-(--fd-accent) border-(--fd-accent) text-white'
                        : 'border-(--fd-border) text-(--fd-text-muted) hover:border-(--fd-text-muted)'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </>
            )}
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="flex-1 min-w-20 h-6 text-[10px]"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-1.5 bg-black/10 p-2 border border-(--fd-border) rounded-md"
            >
              <div className="flex items-center gap-1.5">
                <Input
                  value={item.tag}
                  onChange={(e) => updateItem(item.id, { tag: e.target.value })}
                  placeholder="Tag"
                  className="h-7 w-20 text-[10px] uppercase"
                />
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  placeholder="Item name"
                  className="flex-1 h-7 font-medium text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-(--fd-text-muted) shrink-0"
                  onClick={() => onChangeValues({ ...values, items: items.filter((i) => i.id !== item.id) })}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-1.5">
                <NumberField
                  value={item.qty}
                  min={0}
                  withSteppers
                  onChange={(v) => updateItem(item.id, { qty: v })}
                  inputClassName="h-7 w-10"
                  title="Quantity"
                />
                <NumberField
                  value={item.weight}
                  min={0}
                  onChange={(v) => updateItem(item.id, { weight: v })}
                  inputClassName="h-7 w-12"
                  title="Weight (each)"
                />
                <Input
                  value={item.formula}
                  onChange={(e) => updateItem(item.id, { formula: e.target.value })}
                  placeholder="Roll formula (optional)"
                  className="flex-1 h-7 text-xs"
                />
                {item.formula && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7 shrink-0"
                    title="Roll"
                    onClick={() => {
                      const resolved = resolveReferences(item.formula, valueMap)
                      setLastRoll((s) => ({ ...s, [item.id]: rollFormula(resolved).total }))
                    }}
                  >
                    <Dices className="size-3.5" />
                  </Button>
                )}
                {lastRoll[item.id] !== undefined && (
                  <span className="w-6 text-(--fd-accent) text-xs text-center shrink-0">
                    {lastRoll[item.id]}
                  </span>
                )}
              </div>
              <Input
                value={item.notes}
                onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                placeholder="Notes"
                className="h-7 text-[11px] text-(--fd-text-muted)"
              />
            </div>
          ))}
          {visibleItems.length === 0 && items.length > 0 && (
            <p className="py-2 text-(--fd-text-muted) text-xs text-center">
              No items match this filter.
            </p>
          )}
        </div>

        <AddTile label="Add Gear" onClick={() => onChangeValues({ ...values, items: [...items, newItem()] })} />
      </div>
    </ModuleCard>
  )
}

export default GearModule
