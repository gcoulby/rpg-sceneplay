import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import type { ConfirmationConfig } from '@/types'

interface ConfirmationDialogProps extends ConfirmationConfig {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

const DEFAULTS: Required<ConfirmationConfig> = {
  title: 'Are you sure?',
  description: 'This action cannot be undone.',
  confirmLabel: 'Continue',
  cancelLabel: 'Cancel',
}

export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title ?? DEFAULTS.title}</DialogTitle>
          <DialogDescription>
            {description ?? DEFAULTS.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel ?? DEFAULTS.cancelLabel}
          </Button>
          <Button onClick={onConfirm}>
            {confirmLabel ?? DEFAULTS.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
