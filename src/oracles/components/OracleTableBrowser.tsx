import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOracleStore } from '@/stores/oracleStore'
import { useOracleActivityStore } from '@/stores/oracleActivityStore'
import type { OracleCombo, OracleTable } from '../types'
import {
  rollTable,
  rollCombo,
  describeTableRoll,
  formatDiceSpec,
  type TableRollResult,
} from '../rollTable'
import { flattenCollectionTables, buildBrowserRows } from '../oracleRows'
import { tableResultToRollValue, comboResultToRollValue } from '../toRollValue'
import type { RollValue } from '../rollTypes'

interface OracleTableBrowserProps {
  compact?: boolean
  onResult?: (value: RollValue) => void
}

export default function OracleTableBrowser({
  compact,
  onResult,
}: OracleTableBrowserProps) {
  const getAllCollections = useOracleStore((s) => s.getAllCollections)
  const getAllSources = useOracleStore((s) => s.getAllSources)
  const getTableById = useOracleStore((s) => s.getTableById)
  const getComboForTable = useOracleStore((s) => s.getComboForTable)
  // `getAllSources`/`getAllCollections` are stable function references, so
  // selecting only them wouldn't re-render this component when the user
  // adds/edits/deletes a table elsewhere — subscribe to the raw state too.
  useOracleStore((s) => s.userSources)
  useOracleStore((s) => s.userCollections)
  useOracleStore((s) => s.userCombos)
  const activeCollectionId = useOracleActivityStore((s) => s.activeCollectionId)
  const setActiveCollectionId = useOracleActivityStore(
    (s) => s.setActiveCollectionId,
  )
  const [tableResults, setTableResults] = useState<
    Record<string, TableRollResult>
  >({})
  const [comboResults, setComboResults] = useState<
    Record<string, { text: string; rolls: TableRollResult[] }>
  >({})
  const [modifiers, setModifiers] = useState<Record<string, number>>({})

  const collections = getAllCollections()
  const sources = getAllSources()
  const sourcesById = new Map(sources.map((s) => [s.id, s]))
  const activeCollection =
    collections.find((c) => c.id === activeCollectionId) ?? collections[0]

  const [sourceId, setSourceId] = useState(
    () => activeCollection?.sourceId ?? sources[0]?.id,
  )
  const sourceCollections = collections.filter((c) => c.sourceId === sourceId)
  // Collection belongs to a different source than the one currently picked
  // (e.g. first render before activeCollection settles) — fall back so the
  // dropdown never shows a blank/mismatched value.
  const selectedCollection = sourceCollections.some(
    (c) => c.id === activeCollection?.id,
  )
    ? activeCollection
    : sourceCollections[0]

  const tables = selectedCollection
    ? flattenCollectionTables(selectedCollection)
    : []
  const rows = buildBrowserRows(tables, getComboForTable)

  const rollOneTable = (table: OracleTable) => {
    const canModify =
      table.modifierAllowed &&
      (table.dice.kind === 'single' || table.dice.kind === 'sum')
    const result = rollTable(
      table,
      getTableById,
      0,
      canModify ? (modifiers[table.id] ?? 0) : 0,
    )
    setTableResults((prev) => ({ ...prev, [table.id]: result }))
    onResult?.(tableResultToRollValue(result))
  }
  const rollOneCombo = (combo: OracleCombo) => {
    const result = rollCombo(combo, getTableById)
    setComboResults((prev) => ({ ...prev, [combo.id]: result }))
    onResult?.(comboResultToRollValue(combo, result))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row gap-2">
        <Select
          value={sourceId}
          onValueChange={(v) => {
            if (!v) return
            setSourceId(v)
            const first = collections.find((c) => c.sourceId === v)
            if (first) setActiveCollectionId(first.id)
          }}
        >
          <SelectTrigger className="w-1/2">
            <SelectValue placeholder="Source">
              {sourcesById.get(sourceId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedCollection?.id}
          onValueChange={(v) => v && setActiveCollectionId(v)}
        >
          <SelectTrigger className="w-1/2">
            <SelectValue placeholder="Choose a collection">
              {selectedCollection?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sourceCollections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="max-h-[50dvh]">
        <div className="flex flex-col gap-2 pr-2">
          {rows.map((row) => {
            if (row.kind === 'combo') {
              const { combo } = row
              const result = comboResults[combo.id]
              return (
                <div
                  key={combo.id}
                  className="flex flex-col gap-1 pb-2 border-b"
                >
                  <div className="flex flex-row justify-between items-center gap-2">
                    <span className="font-medium text-sm">{combo.name}</span>
                    <Button
                      variant="secondary"
                      size={compact ? 'sm' : 'default'}
                      onClick={() => rollOneCombo(combo)}
                    >
                      Roll
                    </Button>
                  </div>
                  {result && (
                    <span className="text-sm">
                      <span className="font-semibold">{result.text}</span>
                      {!compact && (
                        <span className="text-muted-foreground">
                          {' '}
                          (
                          {result.rolls
                            .map(
                              (r) => `${r.table.name}: ${describeTableRoll(r)}`,
                            )
                            .join(' · ')}
                          )
                        </span>
                      )}
                    </span>
                  )}
                </div>
              )
            }

            const { table } = row
            const result = tableResults[table.id]
            const canModify =
              table.modifierAllowed &&
              (table.dice.kind === 'single' || table.dice.kind === 'sum')
            return (
              <div key={table.id} className="flex flex-col gap-1 pb-1">
                <div className="flex flex-row justify-between items-center gap-2">
                  <span className="font-medium text-sm">{table.name}</span>
                  <div className="flex items-center gap-1.5">
                    {canModify && (
                      <Input
                        type="number"
                        value={modifiers[table.id] ?? 0}
                        onChange={(e) =>
                          setModifiers((prev) => ({
                            ...prev,
                            [table.id]: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-16 h-8"
                        aria-label={`${table.name} modifier`}
                      />
                    )}
                    <Button
                      variant="secondary"
                      size={compact ? 'sm' : 'default'}
                      onClick={() => rollOneTable(table)}
                    >
                      Roll
                    </Button>
                  </div>
                </div>
                {result && (
                  <span className="text-sm">
                    <span className="text-muted-foreground">
                      {result.lookupValue}:
                    </span>{' '}
                    {describeTableRoll(result)}
                  </span>
                )}
                {!compact && (
                  <details className="text-muted-foreground text-xs">
                    <summary className="cursor-pointer">
                      {table.rows.length} rows ({formatDiceSpec(table.dice)})
                    </summary>
                    <ul className="flex flex-col gap-0.5 mt-1">
                      {table.rows.map((r, i) => (
                        <li key={i}>
                          {r.min === r.max ? r.min : `${r.min}-${r.max}`}:{' '}
                          {r.text}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
