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
import { Toggle } from '@/components/ui/toggle'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { uuid } from '@/utils/open-draft/uuid'
import { USER_ORACLE_SOURCE_ID } from '@/stores/oracleStore'
import type { DiceSpec, OracleRow, OracleTable } from '../types'
import OracleRowsEditor, { type RowMode } from './OracleRowsEditor'

type DiceKind = 'single' | 'positional' | 'sum'

function inferRowMode(rows: OracleRow[]): RowMode {
  return rows.length > 0 && rows.every((r) => r.min === r.max)
    ? 'single'
    : 'range'
}

interface OracleBuilderDialogProps {
  open: boolean
  /** The table being edited, or null to create a new one. */
  table: OracleTable | null
  onSave: (table: OracleTable) => void
  onCancel: () => void
}

const EMPTY_ROWS: OracleRow[] = []

function diceKindOf(dice: DiceSpec): DiceKind {
  return dice.kind === 'formula' ? 'single' : dice.kind
}

export default function OracleBuilderDialog({
  open,
  table,
  onSave,
  onCancel,
}: OracleBuilderDialogProps) {
  const [prevOpen, setPrevOpen] = useState(open)
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [diceKind, setDiceKind] = useState<DiceKind>('single')
  const [singleSides, setSingleSides] = useState(100)
  const [multiDice, setMultiDice] = useState<number[]>([6, 6])
  const [rowMode, setRowMode] = useState<RowMode>('single')
  const [rows, setRows] = useState<OracleRow[]>([])
  const [modifierAllowed, setModifierAllowed] = useState(false)
  const [hasMatch, setHasMatch] = useState(false)
  const [matchId, setMatchId] = useState('')
  const [matchRows, setMatchRows] = useState<OracleRow[]>([])

  // Re-hydrate local edit state exactly once per closed→open transition —
  // same pattern as template-editor-dialog.tsx.
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setId(table?.id ?? uuid())
      setName(table?.name ?? '')
      const dice = table?.dice ?? { kind: 'single', sides: 100 }
      setDiceKind(diceKindOf(dice))
      setSingleSides(dice.kind === 'single' ? dice.sides : 100)
      setMultiDice(
        dice.kind === 'positional' || dice.kind === 'sum' ? dice.dice : [6, 6],
      )
      const initialRows = table?.rows ?? [{ min: 1, max: 1, text: '' }]
      setRows(initialRows)
      setRowMode(inferRowMode(initialRows))
      setModifierAllowed(table?.modifierAllowed ?? false)
      setHasMatch(!!table?.matchTable)
      setMatchId(table?.matchTable?.id ?? uuid())
      setMatchRows(table?.matchTable?.rows ?? EMPTY_ROWS)
    }
  }

  const canModify = diceKind === 'single' || diceKind === 'sum'

  const updateDieAt = (index: number, sides: number) => {
    setMultiDice((prev) => prev.map((s, i) => (i === index ? sides : s)))
  }
  const removeDieAt = (index: number) => {
    setMultiDice((prev) => prev.filter((_, i) => i !== index))
  }
  const addDie = () => setMultiDice((prev) => [...prev, 6])

  const buildDice = (): DiceSpec => {
    if (diceKind === 'single') return { kind: 'single', sides: singleSides }
    return { kind: diceKind, dice: multiDice }
  }

  const handleSave = () => {
    if (!name.trim() || rows.length === 0) return
    const dice = buildDice()
    onSave({
      id,
      name: name.trim(),
      sourceId: USER_ORACLE_SOURCE_ID,
      dice,
      rows,
      modifierAllowed: canModify ? modifierAllowed : false,
      matchTable: hasMatch
        ? {
            id: matchId,
            name: `${name.trim()} (Match)`,
            sourceId: USER_ORACLE_SOURCE_ID,
            dice,
            rows: matchRows,
          }
        : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="flex flex-col p-0 sm:max-w-2xl max-h-[85dvh] overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>{table ? 'Edit Table' : 'New Oracle Table'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="w-full h-[65dvh]">
          <div className="flex flex-col gap-4 p-4">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Table name"
              />
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Dice
                </Label>
                <Select
                  value={diceKind}
                  onValueChange={(v) => v && setDiceKind(v as DiceKind)}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">
                      Single die (e.g. d100)
                    </SelectItem>
                    <SelectItem value="positional">
                      Positional (e.g. d66)
                    </SelectItem>
                    <SelectItem value="sum">Sum (e.g. 2d6)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {diceKind === 'single' ? (
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    Sides
                  </Label>
                  <Input
                    type="number"
                    value={singleSides}
                    onChange={(e) =>
                      setSingleSides(Number(e.target.value) || 0)
                    }
                    className="w-24"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                    Dice sides
                  </Label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {multiDice.map((sides, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={sides}
                          onChange={(e) =>
                            updateDieAt(i, Number(e.target.value) || 0)
                          }
                          className="w-16 h-8"
                          aria-label={`Die ${i + 1} sides`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => removeDieAt(i)}
                          aria-label={`Remove die ${i + 1}`}
                        >
                          <FaTrash size={10} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={addDie}
                      aria-label="Add die"
                    >
                      <FaPlus size={10} />
                    </Button>
                  </div>
                </div>
              )}

              <Toggle
                pressed={modifierAllowed}
                onPressedChange={setModifierAllowed}
                disabled={!canModify}
                className="h-9"
              >
                Modifier allowed
              </Toggle>
            </div>
            <p className="-mt-2 text-[11px] text-muted-foreground">
              Formula notation ("2d6+1") is for the standalone Dice Roller only
              — oracle tables need a numeric lookup value, so it isn't offered
              here.
            </p>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Rows
                </Label>
                <div className="flex items-center gap-1">
                  <Toggle
                    size="sm"
                    pressed={rowMode === 'single'}
                    onPressedChange={(v) => v && setRowMode('single')}
                  >
                    Single number
                  </Toggle>
                  <Toggle
                    size="sm"
                    pressed={rowMode === 'range'}
                    onPressedChange={(v) => v && setRowMode('range')}
                  >
                    Range
                  </Toggle>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {rowMode === 'single'
                  ? 'Each row applies to exactly one roll (e.g. a 7).'
                  : 'Each row can span several rolls (e.g. 5–8) — use this for uneven odds, where some results are more likely than others.'}
              </p>
              <OracleRowsEditor rows={rows} onChange={setRows} mode={rowMode} />
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Toggle pressed={hasMatch} onPressedChange={setHasMatch}>
                Has a match result (e.g. Ironsworn doubles)
              </Toggle>
              {hasMatch && (
                <OracleRowsEditor
                  rows={matchRows}
                  onChange={setMatchRows}
                  mode={rowMode}
                />
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="py-6 pe-8 pb-8 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || rows.length === 0}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
