import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
  type TableRollResult,
} from '../rollTable'
import { flattenCollectionTables, buildBrowserRows } from '../oracleRows'

interface OracleTableBrowserProps {
  compact?: boolean
}

export default function OracleTableBrowser({ compact }: OracleTableBrowserProps) {
  const getAllCollections = useOracleStore((s) => s.getAllCollections)
  const getAllSources = useOracleStore((s) => s.getAllSources)
  const getTableById = useOracleStore((s) => s.getTableById)
  const getComboForTable = useOracleStore((s) => s.getComboForTable)
  const activeCollectionId = useOracleActivityStore((s) => s.activeCollectionId)
  const setActiveCollectionId = useOracleActivityStore((s) => s.setActiveCollectionId)
  const [tableResults, setTableResults] = useState<Record<string, TableRollResult>>({})
  const [comboResults, setComboResults] = useState<
    Record<string, { text: string; rolls: TableRollResult[] }>
  >({})

  const collections = getAllCollections()
  const sourcesById = new Map(getAllSources().map((s) => [s.id, s]))
  const activeCollection =
    collections.find((c) => c.id === activeCollectionId) ?? collections[0]
  const tables = activeCollection ? flattenCollectionTables(activeCollection) : []
  const rows = buildBrowserRows(tables, getComboForTable)

  const rollOneTable = (table: OracleTable) => {
    setTableResults((prev) => ({ ...prev, [table.id]: rollTable(table, getTableById) }))
  }
  const rollOneCombo = (combo: OracleCombo) => {
    setComboResults((prev) => ({ ...prev, [combo.id]: rollCombo(combo, getTableById) }))
  }

  return (
    <div className="flex flex-col gap-3">
      <Select
        value={activeCollection?.id}
        onValueChange={(v) => v && setActiveCollectionId(v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a collection" />
        </SelectTrigger>
        <SelectContent>
          {collections.map((collection) => (
            <SelectItem key={collection.id} value={collection.id}>
              {sourcesById.get(collection.sourceId)?.name ?? collection.sourceId} —{' '}
              {collection.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          if (row.kind === 'combo') {
            const { combo } = row
            const result = comboResults[combo.id]
            return (
              <div key={combo.id} className="flex flex-col gap-1 border-b pb-2">
                <div className="flex flex-row items-center justify-between gap-2">
                  <span className="text-sm font-medium">{combo.name}</span>
                  <Button size={compact ? 'sm' : 'default'} onClick={() => rollOneCombo(combo)}>
                    Roll
                  </Button>
                </div>
                {result && (
                  <span className="text-sm">
                    <span className="font-semibold">{result.text}</span>
                    {!compact && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({result.rolls
                          .map((r) => `${r.table.name}: ${describeTableRoll(r)}`)
                          .join(' · ')})
                      </span>
                    )}
                  </span>
                )}
              </div>
            )
          }

          const { table } = row
          const result = tableResults[table.id]
          return (
            <div key={table.id} className="flex flex-col gap-1 border-b pb-2">
              <div className="flex flex-row items-center justify-between gap-2">
                <span className="text-sm font-medium">{table.name}</span>
                <Button size={compact ? 'sm' : 'default'} onClick={() => rollOneTable(table)}>
                  Roll
                </Button>
              </div>
              {result && (
                <span className="text-sm">
                  <span className="text-muted-foreground">{result.roll}:</span>{' '}
                  {describeTableRoll(result)}
                </span>
              )}
              {!compact && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">
                    {table.rows.length} rows ({table.diceType})
                  </summary>
                  <ul className="mt-1 flex flex-col gap-0.5">
                    {table.rows.map((r, i) => (
                      <li key={i}>
                        {r.min === r.max ? r.min : `${r.min}-${r.max}`}: {r.text}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
