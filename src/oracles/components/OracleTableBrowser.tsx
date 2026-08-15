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
import type { OracleCollection, OracleTable } from '../types'
import { rollTable, describeTableRoll, type TableRollResult } from '../rollTable'

function flattenCollectionTables(collection: OracleCollection): OracleTable[] {
  const tables: OracleTable[] = []
  for (const child of collection.children) {
    if ('children' in child) tables.push(...flattenCollectionTables(child))
    else tables.push(child)
  }
  return tables
}

interface OracleTableBrowserProps {
  compact?: boolean
}

export default function OracleTableBrowser({ compact }: OracleTableBrowserProps) {
  const getAllCollections = useOracleStore((s) => s.getAllCollections)
  const getAllSources = useOracleStore((s) => s.getAllSources)
  const getTableById = useOracleStore((s) => s.getTableById)
  const activeCollectionId = useOracleActivityStore((s) => s.activeCollectionId)
  const setActiveCollectionId = useOracleActivityStore((s) => s.setActiveCollectionId)
  const [results, setResults] = useState<Record<string, TableRollResult>>({})

  const collections = getAllCollections()
  const sourcesById = new Map(getAllSources().map((s) => [s.id, s]))
  const activeCollection =
    collections.find((c) => c.id === activeCollectionId) ?? collections[0]
  const tables = activeCollection ? flattenCollectionTables(activeCollection) : []

  const roll = (table: OracleTable) => {
    setResults((prev) => ({ ...prev, [table.id]: rollTable(table, getTableById) }))
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
        {tables.map((table) => {
          const result = results[table.id]
          return (
            <div key={table.id} className="flex flex-col gap-1 border-b pb-2">
              <div className="flex flex-row items-center justify-between gap-2">
                <span className="text-sm font-medium">{table.name}</span>
                <Button size={compact ? 'sm' : 'default'} onClick={() => roll(table)}>
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
                    {table.rows.map((row, i) => (
                      <li key={i}>
                        {row.min === row.max ? row.min : `${row.min}-${row.max}`}:{' '}
                        {row.text}
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
