import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FaPencilAlt, FaPlus, FaTrash } from 'react-icons/fa'
import { useOracleStore, USER_ORACLE_SOURCE_ID } from '@/stores/oracleStore'
import { rollCombo, type TableRollResult, describeTableRoll } from '../rollTable'
import type { OracleCombo } from '../types'
import OracleComboBuilderDialog from './OracleComboBuilderDialog'

interface ComboRollerProps {
  compact?: boolean
}

/** Every bundled combo (Action/Theme, Descriptor/Focus, Aspect/Focus, Sector
 *  Name, ...) as quick inspiration rolls — not just Ironsworn's. Authoring
 *  (New/Edit/Delete) only appears in the full (non-compact) view, matching
 *  where table authoring lives in `OracleBrowserFull`. */
export default function ComboRoller({ compact }: ComboRollerProps) {
  const getAllCombos = useOracleStore((s) => s.getAllCombos)
  const getAllSources = useOracleStore((s) => s.getAllSources)
  const getTableById = useOracleStore((s) => s.getTableById)
  const addUserCombo = useOracleStore((s) => s.addUserCombo)
  const updateUserCombo = useOracleStore((s) => s.updateUserCombo)
  const removeUserCombo = useOracleStore((s) => s.removeUserCombo)
  // `getAllCombos` is a stable function reference — subscribe to the raw
  // state too so this component re-renders when combos change.
  useOracleStore((s) => s.userCombos)

  const [results, setResults] = useState<
    Record<string, { text: string; rolls: TableRollResult[] }>
  >({})
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingCombo, setEditingCombo] = useState<OracleCombo | null>(null)

  const combos = getAllCombos()
  const sourcesById = new Map(getAllSources().map((s) => [s.id, s]))

  const roll = (comboId: string) => {
    const combo = combos.find((c) => c.id === comboId)
    if (!combo) return
    setResults((prev) => ({ ...prev, [combo.id]: rollCombo(combo, getTableById) }))
  }

  const openCreateCombo = () => {
    setEditingCombo(null)
    setBuilderOpen(true)
  }
  const openEditCombo = (combo: OracleCombo) => {
    setEditingCombo(combo)
    setBuilderOpen(true)
  }
  const handleSaveCombo = (combo: OracleCombo) => {
    if (editingCombo) updateUserCombo(combo)
    else addUserCombo(combo)
    setBuilderOpen(false)
  }
  const handleDeleteCombo = (id: string) => {
    removeUserCombo(id)
    setResults((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  if (combos.length === 0 && compact) return null

  return (
    <div className="flex flex-col gap-3">
      {!compact && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Combos</span>
          <Button variant="outline" size="sm" onClick={openCreateCombo}>
            <FaPlus size={10} className="mr-1.5" />
            New Combo
          </Button>
        </div>
      )}
      {combos.map((combo) => {
        const result = results[combo.id]
        return (
          <div key={combo.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm">
                {combo.name}
                {!compact && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {sourcesById.get(combo.sourceId)?.name}
                  </span>
                )}
              </span>
              <div className="flex items-center gap-1">
                {!compact && combo.sourceId === USER_ORACLE_SOURCE_ID && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEditCombo(combo)}
                      aria-label="Edit combo"
                    >
                      <FaPencilAlt size={11} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleDeleteCombo(combo.id)}
                      aria-label="Delete combo"
                    >
                      <FaTrash size={11} />
                    </Button>
                  </>
                )}
                <Button size={compact ? 'sm' : 'default'} onClick={() => roll(combo.id)}>
                  Roll
                </Button>
              </div>
            </div>
            {result && (
              <div className="text-sm">
                <span className="font-semibold">{result.text}</span>
                {!compact && (
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    ({result.rolls
                      .map((r) => `${r.table.name}: ${describeTableRoll(r)}`)
                      .join(' · ')})
                  </span>
                )}
              </div>
            )}
          </div>
        )
      })}

      {!compact && (
        <OracleComboBuilderDialog
          open={builderOpen}
          combo={editingCombo}
          onSave={handleSaveCombo}
          onCancel={() => setBuilderOpen(false)}
        />
      )}
    </div>
  )
}
