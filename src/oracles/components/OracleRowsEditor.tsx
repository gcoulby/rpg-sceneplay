import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FaPlus, FaTrash } from 'react-icons/fa'
import type { OracleRow } from '../types'

export type RowMode = 'single' | 'range'

interface OracleRowsEditorProps {
  rows: OracleRow[]
  onChange: (rows: OracleRow[]) => void
  mode: RowMode
}

/** A row list editor for `OracleRow[]` — shared by the main rows and
 *  match-table rows sections of `OracleBuilderDialog`. `mode` controls
 *  whether each row is entered as one number (min and max kept equal) or as
 *  an independent min/max range. */
export default function OracleRowsEditor({
  rows,
  onChange,
  mode,
}: OracleRowsEditorProps) {
  const updateRow = (index: number, updates: Partial<OracleRow>) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...updates } : r)))
  }
  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index))
  }
  const addRow = () => {
    const prev = rows[rows.length - 1]
    if (!prev) {
      onChange([...rows, { min: 0, max: 0, text: '' }])
      return
    }
    if (mode === 'single') {
      const v = prev.max + 1
      onChange([...rows, { min: v, max: v, text: '' }])
    } else {
      const min = prev.max + 1
      const max = min + (prev.max - prev.min)
      onChange([...rows, { min, max, text: '' }])
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {mode === 'single' ? (
            <span className="w-16 shrink-0">Value</span>
          ) : (
            <>
              <span className="w-16 shrink-0">Min</span>
              <span className="w-16 shrink-0">Max</span>
            </>
          )}
          <span className="flex-1">Result</span>
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {mode === 'single' ? (
            <Input
              type="number"
              value={row.min}
              onChange={(e) => {
                const v = Number(e.target.value) || 0
                updateRow(i, { min: v, max: v })
              }}
              className="w-16 h-8"
              aria-label="Row value"
            />
          ) : (
            <>
              <Input
                type="number"
                value={row.min}
                onChange={(e) =>
                  updateRow(i, { min: Number(e.target.value) || 0 })
                }
                className="w-16 h-8"
                aria-label="Row minimum"
              />
              <Input
                type="number"
                value={row.max}
                onChange={(e) =>
                  updateRow(i, { max: Number(e.target.value) || 0 })
                }
                className="w-16 h-8"
                aria-label="Row maximum"
              />
            </>
          )}
          <Input
            value={row.text ?? ''}
            onChange={(e) => updateRow(i, { text: e.target.value })}
            placeholder="Result text"
            className="flex-1 h-8"
            aria-label="Row text"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => removeRow(i)}
            aria-label="Remove row"
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
        onClick={addRow}
      >
        <FaPlus size={10} className="mr-1.5" />
        Add row
      </Button>
    </div>
  )
}
