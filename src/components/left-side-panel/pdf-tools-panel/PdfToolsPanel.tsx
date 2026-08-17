import { useState } from 'react'
import { FileStack } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import * as ActivityPanel from '@/components/ui/activity-panel'
import { usePdfViewerStore } from '@/components/screens/pdf-viewer/store/usePdfViewerStore'
import { usePdfDocument } from '@/components/screens/pdf-viewer/viewer/use-pdf-document'
import { usePdfFulltextIndex } from '@/components/screens/pdf-viewer/viewer/use-pdf-fulltext-index'
import PdfToolsPagesTab from './PdfToolsPagesTab'
import PdfToolsSearchTab from './PdfToolsSearchTab'

type PdfToolsTab = 'pages' | 'search'

/** Side panel for the PDF Tools activity — mirrors `TagsPanel`'s two-tab
 *  shape. Operates on whichever embed is currently active in the PDF main
 *  tab (`usePdfViewerStore`'s `activeEmbedId`/`activePage`, mirrored there
 *  by `useLastSelectedTab`/`pdf-viewer.tsx` for exactly this purpose), since
 *  that's already visible in the main content area — no need for this panel
 *  to duplicate the inner PDF tab bar. */
export default function PdfToolsPanel() {
  const [activeTab, setActiveTab] = useState<PdfToolsTab>('pages')
  const embeds = usePdfViewerStore((s) => s.embeds)
  const activeEmbedId = usePdfViewerStore((s) => s.activeEmbedId)
  const activePage = usePdfViewerStore((s) => s.activePage)
  const requestPageJump = usePdfViewerStore((s) => s.requestPageJump)

  const activeEmbed = embeds.find((e) => e.id === activeEmbedId) ?? null
  const { pdfDoc } = usePdfDocument(activeEmbed?.assetRef ?? '')
  const { pages, loading } = usePdfFulltextIndex(activeEmbed ? pdfDoc : null)

  const goToPage = (page: number, highlightText?: string) => {
    if (activeEmbed) requestPageJump(activeEmbed.id, page, highlightText)
  }

  return (
    <ActivityPanel.Shell>
      <ActivityPanel.Header>
        <ActivityPanel.Title>PDF Tools</ActivityPanel.Title>
      </ActivityPanel.Header>

      {!activeEmbed || !pdfDoc ? (
        <div className="flex flex-col flex-1 justify-center items-center gap-2 p-6 text-(--fd-text-muted) text-center">
          <FileStack className="size-8" />
          <p className="text-sm">
            {embeds.length === 0
              ? 'No PDFs imported yet.'
              : 'Loading PDF…'}
          </p>
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as PdfToolsTab)}
          className="flex flex-col flex-1 min-h-0"
        >
          <ActivityPanel.SubHeader>
            <TabsList className="w-full shrink-0 rounded-none border-b border-(--fd-border) bg-transparent h-auto p-0">
              <TabsTrigger
                value="pages"
                className="flex-1 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-(--fd-accent)"
              >
                Pages
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="flex-1 rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-(--fd-accent)"
              >
                Search
              </TabsTrigger>
            </TabsList>
          </ActivityPanel.SubHeader>
          <ActivityPanel.Content headerOffset="8dvh">
            <TabsContent
              value="pages"
              className="flex-1 mt-0 min-h-0 overflow-y-auto"
            >
              <PdfToolsPagesTab
                pdfDoc={pdfDoc}
                currentPage={activePage}
                onSelectPage={goToPage}
              />
            </TabsContent>
            <TabsContent
              value="search"
              className="flex flex-col flex-1 mt-0 min-h-0"
            >
              <PdfToolsSearchTab
                pages={pages}
                loading={loading}
                onSelectPage={goToPage}
              />
            </TabsContent>
          </ActivityPanel.Content>
        </Tabs>
      )}
    </ActivityPanel.Shell>
  )
}
