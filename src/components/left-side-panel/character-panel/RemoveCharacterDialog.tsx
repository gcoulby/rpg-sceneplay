import React from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

interface RemoveCharacterDialogProps {
  characterName: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

const RemoveCharacterDialog: React.FC<RemoveCharacterDialogProps> = ({
  characterName,
  onOpenChange,
  onConfirm,
}) => (
  <AlertDialog open={characterName !== null} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Remove Character</AlertDialogTitle>
        <AlertDialogDescription>
          Remove &ldquo;{characterName}&rdquo; from the character list?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          className="bg-[#c0392b] hover:bg-[#c0392b]/90 text-white"
          onClick={onConfirm}
        >
          Remove
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

export default RemoveCharacterDialog
