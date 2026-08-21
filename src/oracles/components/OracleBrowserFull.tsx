import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { FaPencilAlt, FaPlus, FaTrash } from 'react-icons/fa'
import { useOracleStore, USER_ORACLE_SOURCE_ID } from '@/stores/oracleStore'
import type { OracleCollection, OracleCombo, OracleTable } from '../types'
import { buildBrowserRows, type BrowserRow } from '../oracleRows'
import {
  rollTable,
  rollCombo,
  describeTableRoll,
  type TableRollResult,
} from '../rollTable'
import { tableResultToRollValue, comboResultToRollValue } from '../toRollValue'
import type { RollValue } from '../rollTypes'
import OracleBuilderDialog from './OracleBuilderDialog'

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
      <AccordionTrigger className="bg-muted px-2 py-2 font-medium text-sm hover:no-underline">
        {collection.name}
      </AccordionTrigger>
      <AccordionContent className="px-0 pb-1">
        <div className="flex flex-col gap-0.5 p-2">
          {rows.map((row) => {
            const id = row.kind === 'combo' ? row.combo.id : row.table.id
            const name = row.kind === 'combo' ? row.combo.name : row.table.name

            return (
              <Button
                key={id}
                variant="ghost"
                className="group flex justify-between items-center gap-2 px-2 py-1 rounded-md"
                onClick={() => {
                  onSelect(row)
                  onRoll(row)
                }}
              >
                {name}
                {row.kind === 'combo' && (
                  <span className="ml-1.5 text-[10px] text-primary uppercase">
                    combo
                  </span>
                )}
              </Button>
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

interface OracleBrowserFullProps {
  layout?: 'page' | 'dialog'
  onResult?: (value: RollValue) => void
}

export default function OracleBrowserFull({
  layout = 'page',
  onResult,
}: OracleBrowserFullProps = {}) {
  const getAllSources = useOracleStore((s) => s.getAllSources)
  const getAllCollections = useOracleStore((s) => s.getAllCollections)
  const getTableById = useOracleStore((s) => s.getTableById)
  const getComboForTable = useOracleStore((s) => s.getComboForTable)
  const addUserTable = useOracleStore((s) => s.addUserTable)
  const updateUserTable = useOracleStore((s) => s.updateUserTable)
  const removeUserTable = useOracleStore((s) => s.removeUserTable)
  // `getAllSources`/`getAllCollections` are stable function references, so
  // selecting only them wouldn't re-render this component when the user
  // adds/edits/deletes a table — subscribe to the raw state too, purely so
  // Zustand knows to re-render (the getters above still do the actual read).
  useOracleStore((s) => s.userSources)
  useOracleStore((s) => s.userCollections)
  useOracleStore((s) => s.userCombos)

  const sources = getAllSources()
  const collections = getAllCollections()
  const [activeSourceId, setActiveSourceId] = useState(sources[0]?.id)
  const [selection, setSelection] = useState<Selection>(null)
  const [modifier, setModifier] = useState(0)
  const [results, setResults] = useState<
    Record<string, TableRollResult | { text: string; rolls: TableRollResult[] }>
  >({})
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<OracleTable | null>(null)

  const openCreateTable = () => {
    setEditingTable(null)
    setBuilderOpen(true)
  }
  const openEditTable = (table: OracleTable) => {
    setEditingTable(table)
    setBuilderOpen(true)
  }
  const handleSaveTable = (table: OracleTable) => {
    if (editingTable) updateUserTable(table)
    else addUserTable(table)
    setBuilderOpen(false)
    // `selection` holds a snapshot object, not a live store lookup, so an
    // edit to the currently-selected table wouldn't otherwise be reflected
    // in the detail panel (stale name, and a since-cleared roll result
    // still referencing the pre-edit row list).
    setSelection((s) =>
      s?.kind === 'table' && s.table.id === table.id
        ? { kind: 'table', table }
        : s,
    )
    if (editingTable?.id === table.id) {
      setResults((prev) => {
        const next = { ...prev }
        delete next[table.id]
        return next
      })
    }
  }
  const handleDeleteTable = (id: string) => {
    removeUserTable(id)
    setSelection((s) => (s?.kind === 'table' && s.table.id === id ? null : s))
  }

  const rollRow = (row: BrowserRow) => {
    if (row.kind === 'table') {
      const canModify =
        row.table.modifierAllowed &&
        (row.table.dice.kind === 'single' || row.table.dice.kind === 'sum')
      const result = rollTable(
        row.table,
        getTableById,
        0,
        canModify ? modifier : 0,
      )
      setResults((prev) => ({ ...prev, [row.table.id]: result }))
      setSelection({ kind: 'table', table: row.table })
      onResult?.(tableResultToRollValue(result))
    } else {
      const result = rollCombo(row.combo, getTableById)
      setResults((prev) => ({ ...prev, [row.combo.id]: result }))
      setSelection({ kind: 'combo', combo: row.combo })
      onResult?.(comboResultToRollValue(row.combo, result))
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        layout === 'page' && 'h-[70vh] min-h-100',
      )}
    >
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={openCreateTable}>
          <FaPlus size={10} className="mr-1.5" />
          New Table
        </Button>
      </div>

      <Tabs
        value={activeSourceId}
        onValueChange={(v) => v && setActiveSourceId(v)}
      >
        <TabsList>
          {sources.map((source) => (
            <TabsTrigger key={source.id} value={source.id}>
              {source.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {sources.map((source) => (
          <TabsContent key={source.id} value={source.id}>
            <div className="gap-3 grid grid-cols-1 lg:grid-cols-5">
              <ScrollArea className="lg:col-span-2 border rounded-lg h-[50dvh] min-h-0">
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
              </ScrollArea>

              <div className="lg:col-span-3 p-3 border rounded-lg">
                {!selection && (
                  <p className="text-muted-foreground text-sm">
                    Select a table on the left to browse it, or hit Roll.
                  </p>
                )}
                {selection?.kind === 'table' && (
                  <div className="flex flex-col gap-2 min-h-0">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="font-semibold">{selection.table.name}</h3>
                      <div className="flex items-center gap-2">
                        {selection.table.modifierAllowed &&
                          (selection.table.dice.kind === 'single' ||
                            selection.table.dice.kind === 'sum') && (
                            <Input
                              type="number"
                              value={modifier}
                              onChange={(e) =>
                                setModifier(Number(e.target.value) || 0)
                              }
                              className="w-20 h-8"
                              aria-label="Modifier"
                            />
                          )}
                        {selection.table.sourceId === USER_ORACLE_SOURCE_ID && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEditTable(selection.table)}
                              aria-label="Edit table"
                            >
                              <FaPencilAlt size={11} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleDeleteTable(selection.table.id)}
                              aria-label="Delete table"
                            >
                              <FaTrash size={11} />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          onClick={() =>
                            rollRow({ kind: 'table', table: selection.table })
                          }
                        >
                          Roll
                        </Button>
                      </div>
                    </div>
                    {(() => {
                      const result = results[selection.table.id]
                      return (
                        result &&
                        'lookupValue' in result && (
                          <p className="text-sm">
                            <span className="font-medium text-muted-foreground">
                              {result.lookupValue}:
                            </span>{' '}
                            <span className="font-semibold">
                              {describeTableRoll(result)}
                            </span>
                          </p>
                        )
                      )
                    })()}
                    <ScrollArea className="h-[50dvh] min-h-0">
                      <ul className="flex flex-col gap-0.5 text-sm">
                        {selection.table.rows.map((row, i) => (
                          <li
                            key={i}
                            className={cn(
                              'flex gap-2 px-1 py-0.5 rounded',
                              results[selection.table.id] &&
                                'lookupValue' in results[selection.table.id] &&
                                (results[selection.table.id] as TableRollResult)
                                  .row === row &&
                                'bg-primary/10 font-medium',
                            )}
                          >
                            <span className="w-14 text-muted-foreground shrink-0">
                              {row.min === row.max
                                ? row.min
                                : `${row.min}–${row.max}`}
                            </span>
                            <span>{row.text}</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}
                {selection?.kind === 'combo' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{selection.combo.name}</h3>
                      <Button
                        size="sm"
                        onClick={() =>
                          rollRow({ kind: 'combo', combo: selection.combo })
                        }
                      >
                        Roll
                      </Button>
                    </div>
                    {(() => {
                      const result = results[selection.combo.id]
                      return (
                        result &&
                        'text' in result && (
                          <div className="text-sm">
                            <p className="font-semibold text-lg">
                              {result.text}
                            </p>
                            <p className="text-muted-foreground">
                              {result.rolls
                                .map(
                                  (r) =>
                                    `${r.table.name}: ${describeTableRoll(r)}`,
                                )
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

      <OracleBuilderDialog
        open={builderOpen}
        table={editingTable}
        onSave={handleSaveTable}
        onCancel={() => setBuilderOpen(false)}
      />
    </div>
  )
}
