import { useState } from 'react'
import type { Editor } from '@tiptap/react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FateChartRoller from '@/oracles/components/FateChartRoller'
import FormulaRoller from '@/oracles/components/FormulaRoller'
import OracleBrowserFull from '@/oracles/components/OracleBrowserFull'
import { uuid } from '@/utils/open-draft/uuid'
import { useRollNoteStore } from '@/stores/rollNoteStore'
import type { RollCategory, RollValue } from '@/oracles/rollTypes'
import { formatRollResult } from '@/oracles/rollFormat'

interface RollDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editor: Editor | null
  /** Cursor position to insert the anchor at, captured when the dialog was
   *  triggered (before focus moves into the dialog). */
  insertPos: number | null
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
}: RollDialogProps) {
  const [tab, setTab] = useState<DialogTab>('oracle')
  const [result, setResult] = useState<RollValue | null>(null)
  const addRollNote = useRollNoteStore((s) => s.addRollNote)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setTab('oracle')
      setResult(null)
    }
    onOpenChange(next)
  }

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
        .insertContentAt(insertPos + 1, ` ${resultText}`)
        .run()
    }

    addRollNote({ anchorId, category, value: result })
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Roll</DialogTitle>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            if (!v) return
            setTab(v as DialogTab)
            setResult(null)
          }}
        >
          <TabsList>
            <TabsTrigger value="oracle">Oracle</TabsTrigger>
            <TabsTrigger value="fate">Fate</TabsTrigger>
            <TabsTrigger value="dice">Dice</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="oracle">
            <OracleBrowserFull layout="dialog" onResult={setResult} />
          </TabsContent>
          <TabsContent value="fate">
            <FateChartRoller compact onResult={setResult} />
          </TabsContent>
          <TabsContent value="dice">
            <FormulaRoller compact onResult={setResult} />
          </TabsContent>
          <TabsContent value="manual">
            <ManualTab onResult={setResult} />
          </TabsContent>
        </Tabs>

        {result && (
          <p className="text-muted-foreground text-sm">
            Result:{' '}
            <span className="font-medium">{formatRollResult(result)}</span>
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleInsert(true)} disabled={!result}>
            Insert Anchor + Result
          </Button>
          <Button onClick={() => handleInsert(false)} disabled={!result}>
            Insert Anchor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
