import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FaArrowDown, FaArrowUp, FaPlus, FaTrash } from 'react-icons/fa'
import { uuid } from '@/utils/open-draft/uuid'
import { useOracleStore, USER_ORACLE_SOURCE_ID } from '@/stores/oracleStore'
import type { OracleCombo } from '../types'

interface OracleComboBuilderDialogProps {
  open: boolean
  /** The combo being edited, or null to create a new one. */
  combo: OracleCombo | null
  onSave: (combo: OracleCombo) => void
  onCancel: () => void
}

export default function OracleComboBuilderDialog({
  open,
  combo,
  onSave,
  onCancel,
}: OracleComboBuilderDialogProps) {
  const getAllTables = useOracleStore((s) => s.getAllTables)
  const getAllSources = useOracleStore((s) => s.getAllSources)

  const [prevOpen, setPrevOpen] = useState(open)
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [parts, setParts] = useState<string[]>([])
  const [template, setTemplate] = useState('')

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setId(combo?.id ?? uuid())
      setName(combo?.name ?? '')
      setParts(combo?.parts ?? [])
      setTemplate(combo?.template ?? '')
    }
  }

  const tables = getAllTables()
  const tablesById = new Map(tables.map((t) => [t.id, t]))
  const sources = getAllSources()
  const tablesBySource = new Map(
    sources.map((s) => [s.id, tables.filter((t) => t.sourceId === s.id)]),
  )

  const updatePart = (index: number, tableId: string) => {
    setParts((prev) => prev.map((p, i) => (i === index ? tableId : p)))
  }
  const removePart = (index: number) => {
    setParts((prev) => prev.filter((_, i) => i !== index))
  }
  const addPart = () => setParts((prev) => [...prev, tables[0]?.id ?? ''])
  const movePart = (index: number, dir: -1 | 1) => {
    setParts((prev) => {
      const target = index + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const handleSave = () => {
    if (!name.trim() || parts.length === 0 || !template.trim()) return
    onSave({
      id,
      name: name.trim(),
      sourceId: USER_ORACLE_SOURCE_ID,
      parts,
      template: template.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="flex flex-col p-0 sm:max-w-xl max-h-[85dvh] overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>{combo ? 'Edit Combo' : 'New Combo'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-4 overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
              Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Action/Theme"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
              Tables
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Rolled in order, top to bottom — that order is what
              {' {0} '}
              {'{1}'} etc. refer to in the template below.
            </p>
            <div className="flex flex-col gap-1.5">
              {parts.map((partId, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-6 text-xs text-muted-foreground text-right shrink-0">
                    {`{${i}}`}
                  </span>
                  <Select
                    value={partId}
                    onValueChange={(v) => v && updatePart(i, v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Choose a table">
                        {tablesById.get(partId)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map((source) => {
                        const sourceTables = tablesBySource.get(source.id)
                        if (!sourceTables || sourceTables.length === 0)
                          return null
                        return (
                          <SelectGroup key={source.id}>
                            <SelectLabel>{source.name}</SelectLabel>
                            {sourceTables.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => movePart(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                  >
                    <FaArrowUp size={10} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => movePart(i, 1)}
                    disabled={i === parts.length - 1}
                    aria-label="Move down"
                  >
                    <FaArrowDown size={10} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={() => removePart(i)}
                    aria-label="Remove table"
                  >
                    <FaTrash size={11} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={addPart}
                disabled={tables.length === 0}
              >
                <FaPlus size={10} className="mr-1.5" />
                Add table
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
              Template
            </Label>
            <Input
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="e.g. {0} the {1}"
            />
            {parts.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {parts
                  .map((partId, i) => `{${i}} = ${tablesById.get(partId)?.name ?? '?'}`)
                  .join(', ')}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="px-4 py-3 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || parts.length === 0 || !template.trim()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
