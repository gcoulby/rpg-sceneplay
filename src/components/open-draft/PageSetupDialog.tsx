import React, { useState, useCallback } from 'react'
import {
  useEditorStore,
  DEFAULT_PAGE_LAYOUT,
  DEFAULT_HEADER_CONTENT,
  DEFAULT_FOOTER_CONTENT,
} from '@/stores/editorStore'
import type { PageLayout, HeaderFooterContent } from '@/stores/editorStore'

interface PageSetupDialogProps {
  onClose: () => void
}

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

const PageSetupDialog: React.FC<PageSetupDialogProps> = ({ onClose }) => {
  const { pageLayout, setPageLayout } = useEditorStore()

  // Backwards-compatible: fill in missing headerContent/footerContent for old layouts
  const [layout, setLayout] = useState<PageLayout>({
    ...pageLayout,
    headerContent: pageLayout.headerContent || { ...DEFAULT_HEADER_CONTENT },
    footerContent: pageLayout.footerContent || { ...DEFAULT_FOOTER_CONTENT },
    headerStartPage: pageLayout.headerStartPage ?? 2,
    footerStartPage: pageLayout.footerStartPage ?? 1,
  })

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

  // Detect current page size label
  const currentSizeLabel =
    PAGE_SIZES.find(
      (s) =>
        Math.abs(s.width - layout.pageWidth) < 0.05 &&
        Math.abs(s.height - layout.pageHeight) < 0.05,
    )?.label || 'Custom'

  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const size = PAGE_SIZES.find((s) => s.label === e.target.value)
      if (size) {
        setLayout((prev) => ({
          ...prev,
          pageWidth: size.width,
          pageHeight: size.height,
        }))
      }
    },
    [],
  )

  const handleApply = useCallback(() => {
    setPageLayout(layout)
    onClose()
  }, [layout, setPageLayout, onClose])

  const handleReset = useCallback(() => {
    setLayout({ ...DEFAULT_PAGE_LAYOUT })
  }, [])

  return (
    <div
      className="dialog-overlay fixed inset-x-0 top-0 z-3000 flex items-start justify-center h-(--vv-height,100dvh) px-4 pt-[5vh] pb-4 overflow-y-auto bg-black/50 text-(--fd-text-muted)"
      onClick={onClose}
    >
      <div
        className="dialog-box page-setup-dialog flex flex-col min-w-95 max-w-105 max-h-[calc(var(--vv-height,100dvh)-48px)] bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-lg shadow-[0_8px_32px_rgba(0,0,0,.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header py-3.5 px-5 border-b border-(--fd-border) font-semibold text-base shrink-0">
          Page Setup
        </div>
        <div className="flex-1 p-5 overflow-y-auto dialog-body">
          {/* Page Size */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.4px] text-(--fd-text-muted) mb-2">
              Page Size
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-xs text-(--fd-text) min-w-20 shrink-0">
                Size
              </label>
              <select
                className="flex-1 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent)"
                value={currentSizeLabel}
                onChange={handlePageSizeChange}
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s.label} value={s.label}>
                    {s.label}
                  </option>
                ))}
                {currentSizeLabel === 'Custom' && (
                  <option value="Custom">Custom</option>
                )}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-2 mb-1.5">
                <label className="text-xs text-(--fd-text) min-w-15 shrink-0">
                  Width (in)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="4"
                  max="20"
                  className="flex-1 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent)"
                  value={layout.pageWidth}
                  onChange={(e) =>
                    setField('pageWidth', parseFloat(e.target.value) || 8.5)
                  }
                />
              </div>
              <div className="flex flex-1 items-center gap-2 mb-1.5">
                <label className="text-xs text-(--fd-text) min-w-15 shrink-0">
                  Height (in)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="4"
                  max="30"
                  className="flex-1 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent)"
                  value={layout.pageHeight}
                  onChange={(e) =>
                    setField('pageHeight', parseFloat(e.target.value) || 11)
                  }
                />
              </div>
            </div>
          </div>

          {/* Margins */}
          <div className="mb-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.4px] text-(--fd-text-muted) mb-2">
              Margins
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-2 mb-1.5">
                <label className="text-xs text-(--fd-text) min-w-15 shrink-0">
                  Top (in)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="4"
                  className="flex-1 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent)"
                  value={ptToIn(layout.topMargin)}
                  onChange={(e) =>
                    setField(
                      'topMargin',
                      inToPt(parseFloat(e.target.value) || 0),
                    )
                  }
                />
              </div>
              <div className="flex flex-1 items-center gap-2 mb-1.5">
                <label className="text-xs text-(--fd-text) min-w-15 shrink-0">
                  Bottom (in)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="4"
                  className="flex-1 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent)"
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
              <div className="flex flex-1 items-center gap-2 mb-1.5">
                <label className="text-xs text-(--fd-text) min-w-15 shrink-0">
                  Left (in)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="4"
                  className="flex-1 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent)"
                  value={layout.leftMargin}
                  onChange={(e) =>
                    setField('leftMargin', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="flex flex-1 items-center gap-2 mb-1.5">
                <label className="text-xs text-(--fd-text) min-w-15 shrink-0">
                  Right (in)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="4"
                  className="flex-1 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent)"
                  value={layout.rightMargin}
                  onChange={(e) =>
                    setField('rightMargin', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>

          {/* Header / Footer */}
          <div className="mb-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.4px] text-(--fd-text-muted) mb-2">
              Header &amp; Footer
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-2 mb-1.5">
                <label className="text-xs text-(--fd-text) min-w-15 shrink-0">
                  Header margin (in)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="2"
                  className="flex-1 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent)"
                  value={ptToIn(layout.headerMargin)}
                  onChange={(e) =>
                    setField(
                      'headerMargin',
                      inToPt(parseFloat(e.target.value) || 0),
                    )
                  }
                />
              </div>
              <div className="flex flex-1 items-center gap-2 mb-1.5">
                <label className="text-xs text-(--fd-text) min-w-15 shrink-0">
                  Footer margin (in)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="2"
                  className="flex-1 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent)"
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

            <div className="text-xs font-semibold text-(--fd-text) mt-2 mb-0.5">
              Header Content
            </div>
            <div className="text-[10px] text-(--fd-text-muted) mb-1.5">
              Fields: {'{page}'} {'{pages}'} {'{title}'} {'{date}'}{' '}
              {'{revision}'}
            </div>
            <div className="flex gap-1.5 mb-1.5">
              <input
                className="flex-1 min-w-0 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted) placeholder:opacity-60"
                placeholder="Left"
                value={layout.headerContent.left}
                onChange={(e) => setHeaderField('left', e.target.value)}
              />
              <input
                className="flex-1 min-w-0 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted) placeholder:opacity-60"
                placeholder="Center"
                value={layout.headerContent.center}
                onChange={(e) => setHeaderField('center', e.target.value)}
              />
              <input
                className="flex-1 min-w-0 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted) placeholder:opacity-60"
                placeholder="Right"
                value={layout.headerContent.right}
                onChange={(e) => setHeaderField('right', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-xs text-(--fd-text) min-w-20 shrink-0">
                Start on page
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="999"
                className="w-15 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent)"
                value={layout.headerStartPage}
                onChange={(e) =>
                  setField('headerStartPage', parseInt(e.target.value, 10) || 1)
                }
              />
            </div>

            <div className="text-xs font-semibold text-(--fd-text) mt-3 mb-0.5">
              Footer Content
            </div>
            <div className="flex gap-1.5 mb-1.5">
              <input
                className="flex-1 min-w-0 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted) placeholder:opacity-60"
                placeholder="Left"
                value={layout.footerContent.left}
                onChange={(e) => setFooterField('left', e.target.value)}
              />
              <input
                className="flex-1 min-w-0 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted) placeholder:opacity-60"
                placeholder="Center"
                value={layout.footerContent.center}
                onChange={(e) => setFooterField('center', e.target.value)}
              />
              <input
                className="flex-1 min-w-0 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent) placeholder:text-(--fd-text-muted) placeholder:opacity-60"
                placeholder="Right"
                value={layout.footerContent.right}
                onChange={(e) => setFooterField('right', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="text-xs text-(--fd-text) min-w-20 shrink-0">
                Start on page
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="999"
                className="w-15 h-7 px-2 bg-(--fd-input-bg) text-(--fd-text) border border-(--fd-border) rounded text-xs outline-none focus:border-(--fd-accent)"
                value={layout.footerStartPage}
                onChange={(e) =>
                  setField('footerStartPage', parseInt(e.target.value, 10) || 1)
                }
              />
            </div>
          </div>
        </div>

        <div className="dialog-actions flex justify-end gap-2 py-3.5 px-5 border-t border-(--fd-border) shrink-0">
          <button className="mr-auto page-setup-reset" onClick={handleReset}>
            Reset Default
          </button>
          <div className="flex-1" />
          <button onClick={onClose}>Cancel</button>
          <button
            className="dialog-primary bg-(--fd-accent)! border-(--fd-accent)! text-white!"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default PageSetupDialog
