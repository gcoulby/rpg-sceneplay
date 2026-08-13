import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { SheetTemplate } from '../types'

interface TemplateChangeDialogProps {
  pendingTemplate: SheetTemplate | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/** Confirms before swapping a sheet's template/theme. Per spec: no partial
 *  migration of values across mismatched templates — clean slate, clearly
 *  warned, every time. */
const TemplateChangeDialog: React.FC<TemplateChangeDialogProps> = ({
  pendingTemplate,
  onOpenChange,
  onConfirm,
}) => (
  <AlertDialog open={pendingTemplate !== null} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Switch to "{pendingTemplate?.name}"?</AlertDialogTitle>
        <AlertDialogDescription>
          This replaces the sheet's tabs and modules with this template's layout.
          All current module values on this sheet will be cleared — this cannot be
          undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Switch & Clear Values</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

export default TemplateChangeDialog
