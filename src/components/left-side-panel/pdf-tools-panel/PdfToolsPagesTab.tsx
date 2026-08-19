import type { PDFDocumentProxy } from 'pdfjs-dist'
import PdfPageBrowser from '@/components/screens/pdf-viewer/viewer/pdf-page-browser'

interface PdfToolsPagesTabProps {
  pdfDoc: PDFDocumentProxy
  currentPage: number | null
  onSelectPage: (page: number) => void
}

export default function PdfToolsPagesTab({
  pdfDoc,
  currentPage,
  onSelectPage,
}: PdfToolsPagesTabProps) {
  return (
    <PdfPageBrowser
      pdfDoc={pdfDoc}
      currentPage={currentPage ?? 0}
      onSelect={onSelectPage}
    />
  )
}
