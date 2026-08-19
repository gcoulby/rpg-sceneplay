import { useState, type ReactNode } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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
import { usePdfViewerStore } from '../store/usePdfViewerStore'
import { useLastSelectedTab } from './use-last-selected-tab'
import type { PdfEmbed } from '../types'

interface PdfTabBarProps {
  onRequestImport: () => void
  renderViewer: (embed: PdfEmbed) => ReactNode
}

/** The PDF screen's inner tab bar — one tab per embedded PDF. Mirrors
 *  `character-sheets/panel/SheetTabsEditor.tsx`'s add/remove/rename shape
 *  over the same shadcn `Tabs` primitive, plus tab reordering (which
 *  `SheetTabsEditor` doesn't have — sheet tabs aren't reorderable). */
export default function PdfTabBar({
  onRequestImport,
  renderViewer,
}: PdfTabBarProps) {
  const embeds = usePdfViewerStore((s) => s.embeds)
  const renameEmbed = usePdfViewerStore((s) => s.renameEmbed)
  const reorderEmbeds = usePdfViewerStore((s) => s.reorderEmbeds)
  const removeEmbed = usePdfViewerStore((s) => s.removeEmbed)
  const [activeId, setActiveId] = useLastSelectedTab(embeds)
  const [pendingDelete, setPendingDelete] = useState<PdfEmbed | null>(null)

  const sorted = [...embeds].sort((a, b) => a.order - b.order)

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-(--fd-text-muted)">
        <FileText className="size-8" />
        <p className="text-sm">No PDFs imported yet.</p>
        <Button variant="outline" size="sm" onClick={onRequestImport}>
          <Plus className="mr-1 size-3.5" />
          Import PDF
        </Button>
      </div>
    )
  }

  return (
    <Tabs
      value={activeId}
      onValueChange={(v) => setActiveId(v as string)}
      className="flex flex-col gap-0 w-full h-full"
    >
      <div className="flex items-center gap-2 border-(--fd-border) px-2 border-b shrink-0">
        <TabsList className="max-w-full overflow-x-auto">
          {sorted.map((embed) => (
            <TabsTrigger key={embed.id} value={embed.id} className="shrink-0">
              <span className="max-w-40 truncate">{embed.fileName}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto size-7 shrink-0"
          onClick={onRequestImport}
          title="Import PDF"
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {sorted.map((embed, index) => (
        <TabsContent
          key={embed.id}
          value={embed.id}
          keepMounted
          className="flex flex-col flex-1 gap-0 min-h-0"
        >
          <div className="flex items-center gap-2 bg-(--fd-navigator-bg) px-3 py-1.5 border-(--fd-border) border-b shrink-0">
            <input
              value={embed.fileName}
              onChange={(e) => renameEmbed(embed.id, e.target.value)}
              className="flex-1 bg-transparent hover:border-(--fd-border) focus-visible:border-ring border border-transparent rounded outline-none min-w-0 h-6 text-xs"
              title="Rename tab"
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => reorderEmbeds(embed.id, -1)}
              disabled={index === 0}
              title="Move tab left"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => reorderEmbeds(embed.id, 1)}
              disabled={index === sorted.length - 1}
              title="Move tab right"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-(--fd-text-muted) hover:text-destructive"
              onClick={() => setPendingDelete(embed)}
              title="Remove PDF"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          {/* The viewer only mounts for the active tab — switching tabs means
              switching documents (a new PDFViewer instance), so there's no
              benefit to keeping inactive tabs' viewers alive, and doing so
              would run one heavy pdfjs instance per embed simultaneously. */}
          <div className="flex-1 min-h-0">
            {embed.id === activeId ? renderViewer(embed) : null}
          </div>
        </TabsContent>
      ))}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove &quot;{pendingDelete?.fileName}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This removes the PDF, its form field values and markup from
              this document. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) removeEmbed(pendingDelete.id)
                setPendingDelete(null)
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  )
}
