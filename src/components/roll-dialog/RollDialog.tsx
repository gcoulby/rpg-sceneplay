import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FateChartRoller from '@/oracles/components/FateChartRoller'
import FormulaRoller from '@/oracles/components/FormulaRoller'
import OracleTableBrowser from '@/oracles/components/OracleTableBrowser'
import { uuid } from '@/utils/open-draft/uuid'
import { useRollNoteStore } from '@/stores/rollNoteStore'
import type { RollCategory, RollValue } from '@/oracles/rollTypes'
import { formatRollResult, formatRawRoll } from '@/oracles/rollFormat'
import { FaTimes } from 'react-icons/fa'

interface RollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editor: Editor | null
  /** Cursor position to insert the anchor at, captured when the dialog was
   *  triggered (before focus moves into the dialog). */
  insertPos: number | null
  /** Pre-fills and auto-rolls the Dice tab, e.g. when triggered by a PDF
   *  link hijack rather than the keyboard shortcut / context menu. */
  initialFormula?: string | null
}

type DialogTab = 'oracle' | 'fate' | 'dice' | 'manual'

const TAB_TO_CATEGORY: Record<DialogTab, RollCategory> = {
  oracle: 'oracle',
  fate: 'fate',
  dice: 'dice',
  manual: 'manual',
}

function ManualTab({ onResult }: { onResult: (value: RollValue) => void }) {
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')

  const update = (nextLabel: string, nextValue: string) => {
    if (nextLabel.trim() && nextValue.trim()) {
      onResult({ kind: 'manual', label: nextLabel, value: nextValue })
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Label</Label>
        <Input
          placeholder="e.g. Physical d20"
          value={label}
          onChange={(e) => {
            setLabel(e.target.value)
            update(e.target.value, value)
          }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Value</Label>
        <Input
          placeholder="e.g. 17, Yes, ..."
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            update(label, e.target.value)
          }}
        />
      </div>
    </div>
  )
}

export default function RollDialog({
  open,
  onOpenChange,
  editor,
  insertPos,
  initialFormula = null,
}: RollDialogProps) {
  const [tab, setTab] = useState<DialogTab>('oracle')
  const [result, setResult] = useState<RollValue | null>(null)
  const addRollNote = useRollNoteStore((s) => s.addRollNote)

  // Reset dialog state on every closed->open transition, adjusted during
  // render rather than in `handleOpenChange` below: that handler only fires
  // for closes the Dialog primitive itself initiates (Escape, backdrop
  // click) — not for `open` being flipped true from outside, which is how
  // every open actually happens here (keyboard shortcut, context menu, or a
  // PDF-link dice-roll hijack, all routed through rollNoteStore).
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setTab(initialFormula ? 'dice' : 'oracle')
      setResult(null)
    }
  }

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
  }

  // Escape closes explicitly here because the Popover's own dismissal is
  // disabled below (onOpenChange is a no-op) — same reasoning as
  // search-replace-comp.tsx: this popover must stay open while the user
  // clicks around elsewhere (e.g. a PDF panel) to read a table before
  // entering a manual result, so outside clicks can't be what closes it.
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleOpenChange(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  const handleInsert = (includeResult: boolean) => {
    if (!result || !editor || insertPos == null) return
    const anchorId = uuid()
    const category = TAB_TO_CATEGORY[tab]
    const resultText = formatRollResult(result)

    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, {
        type: 'rollAnchor',
        attrs: { anchorId, category, resultPreview: resultText },
      })
      .run()

    if (includeResult) {
      // Inline text right after the anchor, same line — not a new block —
      // so it inherits whatever element type the cursor was already in.
      editor
        .chain()
        .focus()
        .insertContentAt(insertPos + 1, `${resultText}`)
        .run()
    }

    addRollNote({ anchorId, category, value: result })
    handleOpenChange(false)
  }

  return (
    // onOpenChange is a no-op: this makes the popover fully controlled by
    // `open`, so Base UI's own outside-click/Escape dismissal never fires —
    // see the Escape handler above for why (reading a PDF table behind it
    // must not close it).
    <Popover open={open} onOpenChange={() => {}}>
      <PopoverTrigger
        tabIndex={-1}
        aria-hidden
        className="top-12 right-5 fixed w-0 h-0 pointer-events-none"
      />
      <PopoverContent
        align="end"
        sideOffset={8}
        className="p-0 w-[34rem] max-w-[90vw] max-h-[80dvh] flex flex-col"
      >
        <div className="flex items-center justify-between py-2 px-3 border-b border-(--fd-border) font-semibold text-xs text-(--fd-text-muted) uppercase tracking-[0.5px] shrink-0">
          <span>Roll</span>
          <button
            className="bg-transparent border-none text-(--fd-text-muted) cursor-pointer hover:text-(--fd-text)"
            onClick={() => handleOpenChange(false)}
            aria-label="Close roll dialog"
          >
            <FaTimes size={12} />
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 p-3 gap-3">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              if (!v) return
              setTab(v as DialogTab)
              setResult(null)
            }}
            className="flex flex-col flex-1 min-h-0"
          >
            <TabsList className="shrink-0">
              <TabsTrigger value="oracle">Oracle</TabsTrigger>
              <TabsTrigger value="fate">Fate</TabsTrigger>
              <TabsTrigger value="dice">Dice</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="oracle" className="flex-1 min-h-0">
              <OracleTableBrowser onResult={setResult} />
            </TabsContent>
            <TabsContent value="fate">
              <FateChartRoller compact onResult={setResult} />
            </TabsContent>
            <TabsContent value="dice">
              <FormulaRoller
                compact
                onResult={setResult}
                initialFormula={tab === 'dice' ? initialFormula : null}
              />
            </TabsContent>
            <TabsContent value="manual">
              <ManualTab onResult={setResult} />
            </TabsContent>
          </Tabs>

          {result && (
            <p className="shrink-0 text-muted-foreground text-sm truncate">
              <span className="font-medium">{formatRollResult(result)}</span>
              <span className="text-xs"> — {formatRawRoll(result)}</span>
            </p>
          )}

          <div className="flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleInsert(true)} disabled={!result}>
              Insert Anchor + Result
            </Button>
            <Button onClick={() => handleInsert(false)} disabled={!result}>
              Insert Anchor
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
