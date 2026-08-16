import React, { useEffect, useState } from 'react'
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

interface NewCharacterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingNames: string[]
  onCreate: (name: string) => void
}

/** Lets a writer create a character before the script mentions them, so a
 *  sheet can be built ahead of time — the resulting profile has no script
 *  presence yet and shows up as "orphaned" until it's used. */
const NewCharacterDialog: React.FC<NewCharacterDialogProps> = ({
  open,
  onOpenChange,
  existingNames,
  onCreate,
}) => {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setError('')
    }
  }, [open])

  const handleCreate = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Enter a name.')
      return
    }
    const upper = trimmed.toUpperCase()
    if (existingNames.includes(upper)) {
      setError('A character with this name already exists.')
      return
    }
    onCreate(upper)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>New Character</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Name</Label>
          <Input
            autoFocus
            placeholder="e.g. JANE DOE"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default NewCharacterDialog
