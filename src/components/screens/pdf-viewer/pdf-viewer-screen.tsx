import { useState } from 'react'
import PdfTabBar from './tab-bar/pdf-tab-bar'
import PdfImportDialog from './import/pdf-import-dialog'
import PdfViewer from './viewer/pdf-viewer'

/** Top-level PDF Viewer tab — bring in a PDF, fill its form fields, mark it
 *  up, all persisted inside the `.sceneplay` file. Not character-sheet-
 *  specific: any PDF (roll table, handout, character sheet) works the same
 *  way as a tab within this screen. */
export default function PdfViewerScreen() {
  const [importOpen, setImportOpen] = useState(false)

  return (
    <div className="flex flex-col w-full h-full">
      <PdfTabBar
        onRequestImport={() => setImportOpen(true)}
        renderViewer={(embed) => <PdfViewer key={embed.id} embed={embed} />}
      />
      <PdfImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
