import React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ImageLightboxDialogProps {
  image: { url: string; name: string } | null
  onOpenChange: (open: boolean) => void
}

const ImageLightboxDialog: React.FC<ImageLightboxDialogProps> = ({ image, onOpenChange }) => (
  <Dialog open={image !== null} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center">
      {image && (
        <img
          className="shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-md max-w-[90vw] max-h-[85vh]"
          src={image.url}
          alt={image.name}
        />
      )}
    </DialogContent>
  </Dialog>
)

export default ImageLightboxDialog
