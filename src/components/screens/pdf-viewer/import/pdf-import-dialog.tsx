import { useState } from 'react'
import { FileText, FileStack } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { showToast } from '@/actions/show-toast'
import PdfPagePicker from './pdf-page-picker'
import { usePdfImport, PDF_SIZE_WARNING_BYTES } from './use-pdf-import'

type Step = 'pick-file' | 'choose-mode' | 'pick-page'

interface PdfImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** File picker → full-vs-single-page mode choice → (single-page only) page
 *  picker → import. Reset to the first step every time the dialog reopens. */
export default function PdfImportDialog({
  open,
  onOpenChange,
}: PdfImportDialogProps) {
  const { importFull, importSinglePage } = usePdfImport()
  const [step, setStep] = useState<Step>('pick-file')
  const [file, setFile] = useState<File | null>(null)
  const [pageIndex, setPageIndex] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)

  const reset = () => {
    setStep('pick-file')
    setFile(null)
    setPageIndex(null)
    setBusy(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleFileChosen = (picked: File) => {
    if (picked.type !== 'application/pdf' && !picked.name.toLowerCase().endsWith('.pdf')) {
      showToast({ description: 'Please choose a PDF file.', type: 'error' })
      return
    }
    if (picked.size > PDF_SIZE_WARNING_BYTES) {
      showToast({
        description: `${picked.name} is large (${(picked.size / (1024 * 1024)).toFixed(1)}MB) — it will be embedded in the saved document.`,
        type: 'info',
      })
    }
    setFile(picked)
    setStep('choose-mode')
  }

  const handleImportFull = async () => {
    if (!file) return
    setBusy(true)
    try {
      await importFull(file)
      handleOpenChange(false)
    } catch (err) {
      showToast({
        description: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      })
      setBusy(false)
    }
  }

  const handleImportSinglePage = async () => {
    if (!file || pageIndex === null) return
    setBusy(true)
    try {
      await importSinglePage(file, pageIndex)
      handleOpenChange(false)
    } catch (err) {
      showToast({
        description: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
        type: 'error',
      })
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import PDF</DialogTitle>
          <DialogDescription>
            {step === 'pick-file' &&
              'Choose a PDF to bring into this document.'}
            {step === 'choose-mode' && file?.name}
            {step === 'pick-page' &&
              'Pick the page to keep — the rest of the source is discarded.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'pick-file' && (
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              const picked = e.target.files?.[0]
              if (picked) handleFileChosen(picked)
            }}
            className="file:bg-(--fd-dropdown-bg) file:hover:bg-(--fd-accent)/15 file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-md w-full text-xs file:text-xs"
          />
        )}

        {step === 'choose-mode' && (
          <div className="gap-3 grid grid-cols-1 sm:grid-cols-2">
            <Card
              className="group hover:bg-(--fd-dropdown-bg) cursor-pointer transition-colors"
              onClick={() => void handleImportFull()}
            >
              <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
                <div className="flex justify-center items-center bg-(--fd-accent)/15 rounded-md size-8 text-(--fd-accent) shrink-0">
                  <FileStack className="size-4" />
                </div>
                <CardTitle className="text-xs">Full document</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-[11px] text-(--fd-text-muted) leading-relaxed">
                  Embed every page, viewable and fillable.
                </p>
              </CardContent>
            </Card>
            <Card
              className="group hover:bg-(--fd-dropdown-bg) cursor-pointer transition-colors"
              onClick={() => setStep('pick-page')}
            >
              <CardHeader className="flex flex-row items-center gap-2.5 pb-2">
                <div className="flex justify-center items-center bg-(--fd-accent)/15 rounded-md size-8 text-(--fd-accent) shrink-0">
                  <FileText className="size-4" />
                </div>
                <CardTitle className="text-xs">Single page</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-[11px] text-(--fd-text-muted) leading-relaxed">
                  Pull one page out (e.g. a character sheet from a rulebook) —
                  the rest of the source isn't kept.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'pick-page' && file && (
          <PdfPagePicker
            file={file}
            selectedIndex={pageIndex}
            onSelect={setPageIndex}
          />
        )}

        <DialogFooter>
          {step === 'pick-page' && (
            <Button
              size="sm"
              disabled={pageIndex === null || busy}
              onClick={() => void handleImportSinglePage()}
            >
              Import Page
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
