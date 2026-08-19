import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import pkg from '@/../package.json'
import icon from '@/assets/icon.png'

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Adjust this shape to match whatever you put in package.json's metadata block.
interface PackageMetadata {
  title?: string
  author?: string
  homepage?: string
  [key: string]: unknown
}

const metadata = (pkg as { metadata?: PackageMetadata }).metadata ?? {}

export default function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-center">
            <div className="flex justify-center items-center mx-auto mb-3 rounded-[10px] w-12 h-12 font-bold text-[18px] text-white tracking-[1px]">
              <img src={icon} alt="logo" className="rounded-[10px] w-full" />
            </div>
            {metadata.title || pkg.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 py-2">
          <p className="text-muted-foreground text-sm">{pkg.description}</p>
          <p className="text-muted-foreground text-xs">Version {pkg.version}</p>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
