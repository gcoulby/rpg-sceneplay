import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useEditorStore,
  DEFAULT_PAGE_LAYOUT,
  DEFAULT_HEADER_CONTENT,
  DEFAULT_FOOTER_CONTENT,
} from '@/stores/editorStore'
import type { PageLayout, HeaderFooterContent } from '@/stores/editorStore'
import type { PageSetupDialogProps } from '@/types'

const PAGE_SIZES: Array<{ label: string; width: number; height: number }> = [
  { label: 'US Letter (8.5" x 11")', width: 8.5, height: 11 },
  { label: 'A4 (8.27" x 11.69")', width: 8.27, height: 11.69 },
  { label: 'US Legal (8.5" x 14")', width: 8.5, height: 14 },
]

function ptToIn(pt: number): number {
  return +(pt / 72).toFixed(3)
}

function inToPt(inches: number): number {
  return Math.round(inches * 72)
}

export default function PageSetupDialog({
  open,
  onOpenChange,
}: PageSetupDialogProps) {
  const { pageLayout, setPageLayout } = useEditorStore()
  const [layout, setLayout] = useState<PageLayout>({
    ...pageLayout,
    headerContent: pageLayout.headerContent || { ...DEFAULT_HEADER_CONTENT },
    footerContent: pageLayout.footerContent || { ...DEFAULT_FOOTER_CONTENT },
    headerStartPage: pageLayout.headerStartPage ?? 2,
    footerStartPage: pageLayout.footerStartPage ?? 1,
  })

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setLayout({
          ...pageLayout,
          headerContent: pageLayout.headerContent || {
            ...DEFAULT_HEADER_CONTENT,
          },
          footerContent: pageLayout.footerContent || {
            ...DEFAULT_FOOTER_CONTENT,
          },
          headerStartPage: pageLayout.headerStartPage ?? 2,
          footerStartPage: pageLayout.footerStartPage ?? 1,
        })
      }
      onOpenChange(next)
    },
    [pageLayout, onOpenChange],
  )

  const handleApply = useCallback(() => {
    setPageLayout(layout)
    onOpenChange(false)
  }, [layout, setPageLayout, onOpenChange])

  const setField = useCallback(
    <K extends keyof PageLayout>(key: K, value: PageLayout[K]) => {
      setLayout((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const setHeaderField = useCallback(
    (pos: keyof HeaderFooterContent, value: string) => {
      setLayout((prev) => ({
        ...prev,
        headerContent: { ...prev.headerContent, [pos]: value },
      }))
    },
    [],
  )

  const setFooterField = useCallback(
    (pos: keyof HeaderFooterContent, value: string) => {
      setLayout((prev) => ({
        ...prev,
        footerContent: { ...prev.footerContent, [pos]: value },
      }))
    },
    [],
  )

  const currentSizeLabel =
    PAGE_SIZES.find(
      (s) =>
        Math.abs(s.width - layout.pageWidth) < 0.05 &&
        Math.abs(s.height - layout.pageHeight) < 0.05,
    )?.label || 'Custom'

  const handlePageSizeChange = useCallback((value: string | null) => {
    if (!value) return
    const size = PAGE_SIZES.find((s) => s.label === value)
    if (size) {
      setLayout((prev) => ({
        ...prev,
        pageWidth: size.width,
        pageHeight: size.height,
      }))
    }
  }, [])

  const handleReset = useCallback(() => {
    setLayout({ ...DEFAULT_PAGE_LAYOUT })
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Page Setup</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Page Size */}
          <div className="space-y-2">
            <div className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
              Page Size
            </div>
            <div className="flex items-center gap-2">
              <Label className="min-w-20 text-xs shrink-0">Size</Label>
              <Select
                value={currentSizeLabel}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="flex-1 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((s) => (
                    <SelectItem key={s.label} value={s.label}>
                      {s.label}
                    </SelectItem>
                  ))}
                  {currentSizeLabel === 'Custom' && (
                    <SelectItem value="Custom">Custom</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-2">
                <Label className="min-w-15 text-xs shrink-0">Width (in)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="4"
                  max="20"
                  className="h-7 text-xs"
                  value={layout.pageWidth}
                  onChange={(e) =>
                    setField('pageWidth', parseFloat(e.target.value) || 8.5)
                  }
                />
              </div>
              <div className="flex flex-1 items-center gap-2">
                <Label className="min-w-15 text-xs shrink-0">Height (in)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="4"
                  max="30"
                  className="h-7 text-xs"
                  value={layout.pageHeight}
                  onChange={(e) =>
                    setField('pageHeight', parseFloat(e.target.value) || 11)
                  }
                />
              </div>
            </div>
          </div>

          {/* Margins */}
          <div className="space-y-2">
            <div className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
              Margins
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-2">
                <Label className="min-w-15 text-xs shrink-0">Top (in)</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="4"
                  className="h-7 text-xs"
                  value={ptToIn(layout.topMargin)}
                  onChange={(e) =>
                    setField(
                      'topMargin',
                      inToPt(parseFloat(e.target.value) || 0),
                    )
                  }
                />
              </div>
              <div className="flex flex-1 items-center gap-2">
                <Label className="min-w-15 text-xs shrink-0">Bottom (in)</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="4"
                  className="h-7 text-xs"
                  value={ptToIn(layout.bottomMargin)}
                  onChange={(e) =>
                    setField(
                      'bottomMargin',
                      inToPt(parseFloat(e.target.value) || 0),
                    )
                  }
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-2">
                <Label className="min-w-15 text-xs shrink-0">Left (in)</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="4"
                  className="h-7 text-xs"
                  value={layout.leftMargin}
                  onChange={(e) =>
                    setField('leftMargin', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="flex flex-1 items-center gap-2">
                <Label className="min-w-15 text-xs shrink-0">Right (in)</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="4"
                  className="h-7 text-xs"
                  value={layout.rightMargin}
                  onChange={(e) =>
                    setField('rightMargin', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>

          {/* Header / Footer */}
          <div className="space-y-2">
            <div className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
              Header &amp; Footer
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-2">
                <Label className="min-w-15 text-xs shrink-0">
                  Header margin (in)
                </Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="2"
                  className="h-7 text-xs"
                  value={ptToIn(layout.headerMargin)}
                  onChange={(e) =>
                    setField(
                      'headerMargin',
                      inToPt(parseFloat(e.target.value) || 0),
                    )
                  }
                />
              </div>
              <div className="flex flex-1 items-center gap-2">
                <Label className="min-w-15 text-xs shrink-0">
                  Footer margin (in)
                </Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0"
                  max="2"
                  className="h-7 text-xs"
                  value={ptToIn(layout.footerMargin)}
                  onChange={(e) =>
                    setField(
                      'footerMargin',
                      inToPt(parseFloat(e.target.value) || 0),
                    )
                  }
                />
              </div>
            </div>

            <div className="pt-1 font-semibold text-xs">Header Content</div>
            <div className="text-[10px] text-muted-foreground">
              Fields: {'{page}'} {'{pages}'} {'{title}'} {'{date}'}{' '}
              {'{revision}'}
            </div>
            <div className="flex gap-1.5">
              <Input
                className="h-7 text-xs"
                placeholder="Left"
                value={layout.headerContent.left}
                onChange={(e) => setHeaderField('left', e.target.value)}
              />
              <Input
                className="h-7 text-xs"
                placeholder="Center"
                value={layout.headerContent.center}
                onChange={(e) => setHeaderField('center', e.target.value)}
              />
              <Input
                className="h-7 text-xs"
                placeholder="Right"
                value={layout.headerContent.right}
                onChange={(e) => setHeaderField('right', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="min-w-20 text-xs shrink-0">Start on page</Label>
              <Input
                type="number"
                step="1"
                min="1"
                max="999"
                className="w-15 h-7 text-xs"
                value={layout.headerStartPage}
                onChange={(e) =>
                  setField('headerStartPage', parseInt(e.target.value, 10) || 1)
                }
              />
            </div>

            <div className="pt-2 font-semibold text-xs">Footer Content</div>
            <div className="flex gap-1.5">
              <Input
                className="h-7 text-xs"
                placeholder="Left"
                value={layout.footerContent.left}
                onChange={(e) => setFooterField('left', e.target.value)}
              />
              <Input
                className="h-7 text-xs"
                placeholder="Center"
                value={layout.footerContent.center}
                onChange={(e) => setFooterField('center', e.target.value)}
              />
              <Input
                className="h-7 text-xs"
                placeholder="Right"
                value={layout.footerContent.right}
                onChange={(e) => setFooterField('right', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="min-w-20 text-xs shrink-0">Start on page</Label>
              <Input
                type="number"
                step="1"
                min="1"
                max="999"
                className="w-15 h-7 text-xs"
                value={layout.footerStartPage}
                onChange={(e) =>
                  setField('footerStartPage', parseInt(e.target.value, 10) || 1)
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" className="mr-auto" onClick={handleReset}>
            Reset Default
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
