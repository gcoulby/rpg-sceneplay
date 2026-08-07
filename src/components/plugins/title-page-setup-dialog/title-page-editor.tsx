import { useState, useEffect, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { useFormattingTemplateStore } from '@/stores/formattingTemplateStore'
import { api } from '@/services/api'
import { showToast } from '@/actions/show-toast'
import TpImageThumb from './title-page-image-thumb'
import {
  EMPTY_ATTRS,
  TITLE_FONT_SIZES,
  type TpData,
  readTitlePageData,
  deriveFields,
  classifyTitleImages,
  titlePageRegionEnd,
  buildTitlePageBlocks,
} from './title-page-utils'
// import { error } from 'console'

interface TitlePageEditorProps {
  editor: Editor | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TitlePageEditor({
  editor,
  open,
  onOpenChange,
}: TitlePageEditorProps) {
  const [data, setData] = useState<TpData>({ ...EMPTY_ATTRS })

  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen && editor) {
    setPrevOpen(open)
    if (open) setData(readTitlePageData(editor))
  }

  const setField = (key: keyof TpData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const handleApply = () => {
    try {
      if (!editor) throw new Error('Editor is not initialised')
      const { imagesAbove, imagesBelow } = classifyTitleImages(editor)
      const built = buildTitlePageBlocks(editor, data, imagesAbove, imagesBelow)
      const tr = editor.state.tr
      const regionEnd = titlePageRegionEnd(editor)
      if (regionEnd > 0) tr.delete(0, regionEnd)
      for (let i = built.length - 1; i >= 0; i--) tr.insert(0, built[i])
      editor.view.dispatch(tr)
      onOpenChange(false)
    } catch (err) {
      showToast({
        description:
          err instanceof Error ? err.message : 'Failed to update title page',
        type: 'warning',
      })
    }
  }

  // --- Title-page image: upload and insert a screenplayImage node at the
  // chosen position within the title page. ---
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [imagePosition, setImagePosition] = useState<'above' | 'below'>('above')
  const handleAddImage = () => imageInputRef.current?.click()

  const handleImageChosen = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      if (!file.type.startsWith('image/')) {
        showToast({
          description: 'Please choose an image file',
          type: 'warning',
        })
        return
      }
      const placement = imagePosition
      try {
        if (!editor) throw new Error('Editor is not initialised')
        const currentProject = useProjectStore.getState().currentProject
        let attrs: Record<string, unknown>
        if (currentProject) {
          const asset = await api.uploadAsset(currentProject.id, file, [
            'title-page-image',
          ])
          attrs = {
            assetId: asset.id,
            projectId: currentProject.id,
            filename: asset.filename ?? file.name,
            align: 'center',
          }
        } else {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const r = new FileReader()
            r.onload = () => resolve(r.result as string)
            r.onerror = () => reject(r.error)
            r.readAsDataURL(file)
          })
          attrs = { src: dataUrl, align: 'center' }
        }
        const g = classifyTitleImages(editor)
        ;(placement === 'above' ? g.imagesAbove : g.imagesBelow).push(attrs)
        const built = buildTitlePageBlocks(
          editor,
          data,
          g.imagesAbove,
          g.imagesBelow,
        )
        const tr = editor.state.tr
        const end = titlePageRegionEnd(editor)
        if (end > 0) tr.delete(0, end)
        for (let i = built.length - 1; i >= 0; i--) tr.insert(0, built[i])
        editor.view.dispatch(tr)
        showToast({ description: 'Image added to title page', type: 'success' })
      } catch (err) {
        showToast({
          description: `Failed to add image: ${err instanceof Error ? err.message : String(err)}`,
          type: 'warning',
        })
      }
    },
    [editor, imagePosition, data],
  )

  const handleSyncFromProject = () => {
    const { documentTitle } = useEditorStore.getState()
    setData((prev) => ({ ...prev, tpTitle: documentTitle || prev.tpTitle }))
    showToast({ description: 'Synced title from project', type: 'success' })
  }

  const activeTpFields: string[] | undefined = (() => {
    try {
      return useFormattingTemplateStore.getState().getActiveTemplate()
        .titlePageFields
    } catch {
      return undefined
    }
  })()
  const showField = (id: string): boolean =>
    !activeTpFields || activeTpFields.includes(id)

  // Re-render the preview when the document changes (e.g. an image is added).
  const [, bumpDocVersion] = useState(0)
  useEffect(() => {
    if (!editor) return
    const onUpdate = () => bumpDocVersion((v) => v + 1)
    editor.on('update', onUpdate)
    return () => {
      editor.off('update', onUpdate)
    }
  }, [editor])

  if (!editor) return

  const { byLine, draftLine, copyrightLine } = deriveFields(data)
  const { imagesAbove, imagesBelow } = classifyTitleImages(editor)
  const titlePx = `${Math.max(8, Math.round(data.tpTitleFontSize * 0.85))}px`
  const bottomRight = [data.tpContact, copyrightLine].filter(Boolean).join('\n')

  const rebuild = (
    above: Record<string, unknown>[],
    below: Record<string, unknown>[],
  ) => {
    const built = buildTitlePageBlocks(editor, data, above, below)
    const tr = editor.state.tr
    const end = titlePageRegionEnd(editor)
    if (end > 0) tr.delete(0, end)
    for (let i = built.length - 1; i >= 0; i--) tr.insert(0, built[i])
    editor.view.dispatch(tr)
  }
  const editImages = (
    mutate: (
      above: Record<string, unknown>[],
      below: Record<string, unknown>[],
    ) => void,
  ) => {
    const g = classifyTitleImages(editor)
    mutate(g.imagesAbove, g.imagesBelow)
    rebuild(g.imagesAbove, g.imagesBelow)
  }
  const removeImg = (above: boolean, idx: number) =>
    editImages((a, b) => {
      ;(above ? a : b).splice(idx, 1)
    })
  const moveImg = (above: boolean, idx: number, target: 'above' | 'below') =>
    editImages((a, b) => {
      if ((above ? 'above' : 'below') === target) return
      const [x] = (above ? a : b).splice(idx, 1)
      if (x) (target === 'above' ? a : b).push(x)
    })
  const alignImg = (above: boolean, idx: number, align: string) =>
    editImages((a, b) => {
      const arr = above ? a : b
      if (arr[idx]) arr[idx] = { ...arr[idx], align }
    })

  const handleDeleteTitlePage = () => {
    if (
      !window.confirm(
        'Delete the entire title page (title, credits, and images)?',
      )
    )
      return
    const end = titlePageRegionEnd(editor)
    if (end > 0) {
      const tr = editor.state.tr.delete(0, end)
      if (tr.doc.content.size === 0) {
        const fallback =
          editor.schema.nodes.action || editor.schema.nodes.general
        if (fallback) tr.insert(0, fallback.create())
      }
      editor.view.dispatch(tr)
    }
    onOpenChange(false)
  }

  const imageRows = [
    ...imagesAbove.map((attrs, idx) => ({ attrs, above: true, idx })),
    ...imagesBelow.map((attrs, idx) => ({ attrs, above: false, idx })),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Title Page</DialogTitle>
        </DialogHeader>

        <div className="gap-5 max-[720px]:gap-3.5 grid grid-cols-2 max-[720px]:grid-cols-1">
          {/* Fields */}
          <div className="content-start gap-x-4 gap-y-2.5 grid grid-cols-2 max-[720px]:grid-cols-1">
            {showField('tpTitle') && (
              <div className="space-y-1.5 col-span-full">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Title
                </Label>
                <Input
                  className="h-7.5 text-[13px]"
                  value={data.tpTitle}
                  onChange={(e) => setField('tpTitle', e.target.value)}
                  placeholder="SCREENPLAY TITLE"
                  autoFocus
                />
              </div>
            )}
            {showField('tpTitle') && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Title Size
                </Label>
                <Select
                  value={String(data.tpTitleFontSize)}
                  onValueChange={(v) =>
                    v &&
                    setData((prev) => ({ ...prev, tpTitleFontSize: Number(v) }))
                  }
                >
                  <SelectTrigger className="w-full h-7.5 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TITLE_FONT_SIZES.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s} pt
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {showField('tpWrittenBy') && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Written By
                </Label>
                <Input
                  className="h-7.5 text-[13px]"
                  value={data.tpWrittenBy}
                  onChange={(e) => setField('tpWrittenBy', e.target.value)}
                  placeholder="Author Name"
                />
              </div>
            )}
            {showField('tpBasedOn') && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Based On
                </Label>
                <Input
                  className="h-7.5 text-[13px]"
                  value={data.tpBasedOn}
                  onChange={(e) => setField('tpBasedOn', e.target.value)}
                  placeholder="the novel by..."
                />
              </div>
            )}
            {showField('tpDraft') && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Draft
                </Label>
                <Input
                  className="h-7.5 text-[13px]"
                  value={data.tpDraft}
                  onChange={(e) => setField('tpDraft', e.target.value)}
                  placeholder="e.g. Second Draft"
                />
              </div>
            )}
            {showField('tpDraftDate') && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Draft Date
                </Label>
                <Input
                  className="h-7.5 text-[13px]"
                  type="date"
                  value={data.tpDraftDate}
                  onChange={(e) => setField('tpDraftDate', e.target.value)}
                />
              </div>
            )}
            {showField('tpContact') && (
              <div className="space-y-1.5 col-span-full">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Contact
                </Label>
                <Textarea
                  className="text-[13px]"
                  value={data.tpContact}
                  onChange={(e) => setField('tpContact', e.target.value)}
                  placeholder={
                    'Name\nAgency\nemail@example.com\n(310) 555-0100'
                  }
                  rows={3}
                />
              </div>
            )}
            {showField('tpCopyright') && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Copyright
                </Label>
                <Input
                  className="h-7.5 text-[13px]"
                  value={data.tpCopyright}
                  onChange={(e) => setField('tpCopyright', e.target.value)}
                  placeholder="Copyright 2026 Author Name"
                />
              </div>
            )}
            {showField('tpWgaRegistration') && (
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  WGA Registration #
                </Label>
                <Input
                  className="h-7.5 text-[13px]"
                  value={data.tpWgaRegistration}
                  onChange={(e) =>
                    setField('tpWgaRegistration', e.target.value)
                  }
                  placeholder="WGAw #123456"
                />
              </div>
            )}
            {showField('tpNotes') && (
              <div className="space-y-1.5 col-span-full">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Notes
                </Label>
                <Input
                  className="h-7.5 text-[13px]"
                  value={data.tpNotes}
                  onChange={(e) => setField('tpNotes', e.target.value)}
                  placeholder="e.g. CONFIDENTIAL"
                />
              </div>
            )}

            <Button
              variant="outline"
              className="col-span-full mt-1 border-dashed text-muted-foreground"
              onClick={handleSyncFromProject}
              type="button"
            >
              Sync Title from Project
            </Button>

            <div className="flex items-center gap-2 col-span-full">
              <Label className="text-[11px] text-muted-foreground uppercase tracking-wide shrink-0">
                Place image
              </Label>
              <Select
                value={imagePosition}
                onValueChange={(v) =>
                  v && setImagePosition(v as 'above' | 'below')
                }
              >
                <SelectTrigger
                  className="flex-1 h-7.5 text-[13px]"
                  title="Where the next image goes"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">
                    Top of page (above title)
                  </SelectItem>
                  <SelectItem value="below">
                    Bottom of page (below all)
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleAddImage} type="button">
                Add Image…
              </Button>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChosen}
            />

            {imageRows.length > 0 && (
              <div className="space-y-1.5 col-span-full">
                <Label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  Title Page Images ({imageRows.length})
                </Label>
                <div className="flex flex-col gap-1.5">
                  {imageRows.map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 p-1 border rounded"
                    >
                      <div className="w-12 shrink-0">
                        <TpImageThumb attrs={row.attrs} />
                      </div>
                      <Select
                        value={row.above ? 'above' : 'below'}
                        onValueChange={(v) =>
                          v &&
                          moveImg(row.above, row.idx, v as 'above' | 'below')
                        }
                      >
                        <SelectTrigger
                          className="flex-1 h-7.5 text-[13px]"
                          title="Image placement"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Top</SelectItem>
                          <SelectItem value="below">Bottom</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={(row.attrs.align as string) || 'center'}
                        onValueChange={(v) =>
                          v && alignImg(row.above, row.idx, v)
                        }
                      >
                        <SelectTrigger
                          className="flex-1 h-7.5 text-[13px]"
                          title="Image alignment"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => removeImg(row.above, row.idx)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live preview */}
          <div className="flex justify-center items-center bg-muted p-3 rounded-md">
            <div className="relative flex flex-col bg-white shadow-[0_2px_12px_rgba(0,0,0,0.3)] p-[7%_9%] rounded-sm w-full max-w-70 max-[720px]:max-w-60 aspect-[8.5/11] font-[Courier_New,Courier,monospace] text-[#111] text-[9px]">
              {imagesAbove.map((a, i) => (
                <TpImageThumb key={`a${i}`} attrs={a} align />
              ))}
              <div className="mt-[20%] text-center">
                <div
                  className="font-bold uppercase"
                  style={{ fontSize: titlePx }}
                >
                  {data.tpTitle || 'UNTITLED'}
                </div>
                {byLine && (
                  <div className="mt-2 whitespace-pre-wrap">{byLine}</div>
                )}
              </div>
              <div className="flex justify-between items-end gap-2 mt-auto text-[9px]">
                <div className="text-left whitespace-pre-wrap">{draftLine}</div>
                <div className="text-right whitespace-pre-wrap">
                  {bottomRight}
                </div>
              </div>
              {imagesBelow.map((a, i) => (
                <TpImageThumb key={`b${i}`} attrs={a} align />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            className="mr-auto text-red-600"
            onClick={handleDeleteTitlePage}
          >
            Delete Title Page
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
