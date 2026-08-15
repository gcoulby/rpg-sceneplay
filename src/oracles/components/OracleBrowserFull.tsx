import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useOracleStore } from '@/stores/oracleStore'
import type { OracleCollection, OracleCombo, OracleTable } from '../types'
import { buildBrowserRows, type BrowserRow } from '../oracleRows'
import {
  rollTable,
  rollCombo,
  describeTableRoll,
  type TableRollResult,
} from '../rollTable'

type Selection =
  | { kind: 'table'; table: OracleTable }
  | { kind: 'combo'; combo: OracleCombo }
  | null

interface CollectionNodeProps {
  collection: OracleCollection
  getComboForTable: (id: string) => OracleCombo | undefined
  onSelect: (row: BrowserRow) => void
  onRoll: (row: BrowserRow) => void
  results: Record<string, TableRollResult | { text: string }>
}

function CollectionNode({
  collection,
  getComboForTable,
  onSelect,
  onRoll,
  results,
}: CollectionNodeProps) {
  const nestedCollections = collection.children.filter(
    (c): c is OracleCollection => 'children' in c,
  )
  const directTables = collection.children.filter(
    (c): c is OracleTable => 'rows' in c,
  )
  const rows = buildBrowserRows(directTables, getComboForTable)

  return (
    <AccordionItem value={collection.id} className="border-b">
      <AccordionTrigger className="px-2 py-2 text-sm font-medium hover:no-underline">
        {collection.name}
      </AccordionTrigger>
      <AccordionContent className="px-0 pb-1">
        <div className="flex flex-col gap-0.5 pl-2">
          {rows.map((row) => {
            const id = row.kind === 'combo' ? row.combo.id : row.table.id
            const name = row.kind === 'combo' ? row.combo.name : row.table.name
            const result = results[id]
            return (
              <div
                key={id}
                className="group flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-muted"
              >
                <button
                  className="flex-1 truncate text-left text-sm"
                  onClick={() => onSelect(row)}
                >
                  {name}
                  {row.kind === 'combo' && (
                    <span className="ml-1.5 text-[10px] uppercase text-primary">combo</span>
                  )}
                </button>
                {result && (
                  <span className="truncate text-xs text-muted-foreground">
                    {'roll' in result ? describeTableRoll(result) : result.text}
                  </span>
                )}
                <Button
                  size="xs"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => onRoll(row)}
                >
                  Roll
                </Button>
              </div>
            )
          })}
        </div>
        {nestedCollections.length > 0 && (
          <Accordion className="pl-3">
            {nestedCollections.map((nested) => (
              <CollectionNode
                key={nested.id}
                collection={nested}
                getComboForTable={getComboForTable}
                onSelect={onSelect}
                onRoll={onRoll}
                results={results}
              />
            ))}
          </Accordion>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

export default function OracleBrowserFull() {
  const getAllSources = useOracleStore((s) => s.getAllSources)
  const getAllCollections = useOracleStore((s) => s.getAllCollections)
  const getTableById = useOracleStore((s) => s.getTableById)
  const getComboForTable = useOracleStore((s) => s.getComboForTable)

  const sources = getAllSources()
  const collections = getAllCollections()
  const [activeSourceId, setActiveSourceId] = useState(sources[0]?.id)
  const [selection, setSelection] = useState<Selection>(null)
  const [results, setResults] = useState<
    Record<string, TableRollResult | { text: string; rolls: TableRollResult[] }>
  >({})

  const rollRow = (row: BrowserRow) => {
    if (row.kind === 'table') {
      const result = rollTable(row.table, getTableById)
      setResults((prev) => ({ ...prev, [row.table.id]: result }))
      setSelection({ kind: 'table', table: row.table })
    } else {
      const result = rollCombo(row.combo, getTableById)
      setResults((prev) => ({ ...prev, [row.combo.id]: result }))
      setSelection({ kind: 'combo', combo: row.combo })
    }
  }

  return (
    <div className="flex h-[70vh] min-h-100 flex-col gap-3">
      <Tabs value={activeSourceId} onValueChange={(v) => v && setActiveSourceId(v)}>
        <TabsList>
          {sources.map((source) => (
            <TabsTrigger key={source.id} value={source.id}>
              {source.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {sources.map((source) => (
          <TabsContent key={source.id} value={source.id}>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
              <div className="overflow-y-auto rounded-lg border lg:col-span-2 lg:max-h-[60vh]">
                <Accordion>
                  {collections
                    .filter((c) => c.sourceId === source.id && !c.parentId)
                    .map((collection) => (
                      <CollectionNode
                        key={collection.id}
                        collection={collection}
                        getComboForTable={getComboForTable}
                        onSelect={(row) =>
                          setSelection(
                            row.kind === 'table'
                              ? { kind: 'table', table: row.table }
                              : { kind: 'combo', combo: row.combo },
                          )
                        }
                        onRoll={rollRow}
                        results={results}
                      />
                    ))}
                </Accordion>
              </div>

              <div className="rounded-lg border p-3 lg:col-span-3 lg:max-h-[60vh] lg:overflow-y-auto">
                {!selection && (
                  <p className="text-sm text-muted-foreground">
                    Select a table on the left to browse it, or hit Roll.
                  </p>
                )}
                {selection?.kind === 'table' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{selection.table.name}</h3>
                      <Button size="sm" onClick={() => rollRow({ kind: 'table', table: selection.table })}>
                        Roll
                      </Button>
                    </div>
                    {(() => {
                      const result = results[selection.table.id]
                      return (
                        result &&
                        'roll' in result && (
                          <p className="text-sm">
                            <span className="font-medium text-muted-foreground">
                              {result.roll}:
                            </span>{' '}
                            <span className="font-semibold">{describeTableRoll(result)}</span>
                          </p>
                        )
                      )
                    })()}
                    <ul className="flex flex-col gap-0.5 text-sm">
                      {selection.table.rows.map((row, i) => (
                        <li
                          key={i}
                          className={cn(
                            'flex gap-2 rounded px-1 py-0.5',
                            results[selection.table.id] &&
                              'roll' in results[selection.table.id] &&
                              (results[selection.table.id] as TableRollResult).row === row &&
                              'bg-primary/10 font-medium',
                          )}
                        >
                          <span className="w-14 shrink-0 text-muted-foreground">
                            {row.min === row.max ? row.min : `${row.min}–${row.max}`}
                          </span>
                          <span>{row.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selection?.kind === 'combo' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{selection.combo.name}</h3>
                      <Button size="sm" onClick={() => rollRow({ kind: 'combo', combo: selection.combo })}>
                        Roll
                      </Button>
                    </div>
                    {(() => {
                      const result = results[selection.combo.id]
                      return (
                        result &&
                        'text' in result && (
                          <div className="text-sm">
                            <p className="text-lg font-semibold">{result.text}</p>
                            <p className="text-muted-foreground">
                              {result.rolls
                                .map((r) => `${r.table.name}: ${describeTableRoll(r)}`)
                                .join(' · ')}
                            </p>
                          </div>
                        )
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
