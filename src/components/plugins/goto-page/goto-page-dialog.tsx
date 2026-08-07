// src/components/plugins/go-to-page-dialog.tsx
import { useState, useCallback, useEffect, useRef } from 'react'
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
import { useEditorStore } from '@/stores/editorStore'

interface GoToPageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoToPage: (page: number) => void
}

export default function GoToPageDialog({
  open,
  onOpenChange,
  onGoToPage,
}: GoToPageDialogProps) {
  const { pageCount } = useEditorStore()
  const [pageNum, setPageNum] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset the field whenever the dialog opens, same as PageSetupDialog
  // re-seeds `layout` from the store on open.
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) setPageNum('')
      onOpenChange(next)
    },
    [onOpenChange],
  )

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const num = parseInt(pageNum, 10)
  const isValid = pageNum !== '' && num >= 1 && num <= pageCount

  const handleGo = useCallback(() => {
    if (!isValid) return
    onGoToPage(num)
    onOpenChange(false)
  }, [isValid, num, onGoToPage, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Go to Page</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Label className="min-w-20 text-xs shrink-0">
            Page (1-{pageCount})
          </Label>
          <Input
            ref={inputRef}
            type="number"
            min={1}
            max={pageCount}
            className="h-7 text-xs"
            value={pageNum}
            onChange={(e) => setPageNum(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleGo()
              }
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGo} disabled={!isValid}>
            Go
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
