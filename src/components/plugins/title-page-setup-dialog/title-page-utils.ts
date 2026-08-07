import type { Editor } from '@tiptap/react'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { TitlePageAttrs } from '@/editor/extensions/TitlePage'

export type TpData = Omit<TitlePageAttrs, 'field'>

export const EMPTY_ATTRS: TpData = {
  tpTitle: '',
  tpWrittenBy: '',
  tpBasedOn: '',
  tpDraft: '',
  tpDraftDate: '',
  tpContact: '',
  tpCopyright: '',
  tpWgaRegistration: '',
  tpNotes: '',
  tpTitleFontSize: 12,
}

export const TITLE_FONT_SIZES = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96,
]

/** Find the first titlePage node with field='title' and return its attributes + position. */
export function findTitlePageNode(
  editor: Editor,
): { pos: number; attrs: TitlePageAttrs } | null {
  let found: { pos: number; attrs: TitlePageAttrs } | null = null
  editor.state.doc.descendants((node, pos) => {
    if (found) return false
    if (node.type.name === 'titlePage' && node.attrs.field === 'title') {
      found = { pos, attrs: node.attrs as TitlePageAttrs }
      return false
    }
    return true
  })
  return found
}

/** Read structured attrs, falling back to legacy child-text content if structured attrs are empty. */
export function readTitlePageData(editor: Editor): TpData {
  const result = { ...EMPTY_ATTRS }
  const titleNode = findTitlePageNode(editor)
  if (titleNode && titleNode.attrs.tpTitle) {
    result.tpTitle = titleNode.attrs.tpTitle || ''
    result.tpTitleFontSize = Number(titleNode.attrs.tpTitleFontSize) || 12
    result.tpWrittenBy = titleNode.attrs.tpWrittenBy || ''
    result.tpBasedOn = titleNode.attrs.tpBasedOn || ''
    result.tpDraft = titleNode.attrs.tpDraft || ''
    result.tpDraftDate = titleNode.attrs.tpDraftDate || ''
    result.tpContact = titleNode.attrs.tpContact || ''
    result.tpCopyright = titleNode.attrs.tpCopyright || ''
    result.tpWgaRegistration = titleNode.attrs.tpWgaRegistration || ''
    result.tpNotes = titleNode.attrs.tpNotes || ''
    return result
  }

  editor.state.doc.descendants((node) => {
    if (node.type.name === 'titlePage') {
      const field = node.attrs.field as string
      const text = node.textContent || ''
      switch (field) {
        case 'title':
          result.tpTitle = text
          break
        case 'author':
          result.tpWrittenBy = text
          break
        case 'contact':
          result.tpContact = text
          break
        case 'date':
          result.tpDraftDate = text
          break
        case 'draft':
          result.tpDraft = text
          break
        case 'copyright':
          result.tpCopyright = text
          break
      }
    }
    return true
  })
  return result
}

/** Derive the rendered credit lines from the dialog fields. */
export function deriveFields(data: TpData) {
  const byLine = data.tpWrittenBy
    ? data.tpBasedOn
      ? `Written by ${data.tpWrittenBy}\n${data.tpBasedOn}`
      : `Written by ${data.tpWrittenBy}`
    : ''
  const draftLine =
    data.tpDraft || data.tpDraftDate
      ? [data.tpDraft, data.tpDraftDate].filter(Boolean).join(' - ')
      : ''
  const copyrightLine =
    data.tpCopyright || data.tpWgaRegistration
      ? [data.tpCopyright, data.tpWgaRegistration].filter(Boolean).join('\n')
      : ''
  return { byLine, draftLine, copyrightLine }
}

/** Title-page images split by whether they sit above or below the title. */
export function classifyTitleImages(editor: Editor): {
  imagesAbove: Record<string, unknown>[]
  imagesBelow: Record<string, unknown>[]
} {
  const doc = editor.state.doc
  const imagesAbove: Record<string, unknown>[] = []
  const imagesBelow: Record<string, unknown>[] = []
  let sawTitle = false
  for (let k = 0; k < doc.childCount; k++) {
    const child = doc.child(k)
    const t = child.type.name
    if (t === 'titlePage' || t === 'screenplayImage') {
      if (t === 'titlePage' && child.attrs.field === 'title') sawTitle = true
      if (t === 'screenplayImage')
        (sawTitle ? imagesBelow : imagesAbove).push(
          child.attrs as Record<string, unknown>,
        )
    } else break
  }
  return { imagesAbove, imagesBelow }
}

/** End position (doc coords) of the leading title-page region. */
export function titlePageRegionEnd(editor: Editor): number {
  const doc = editor.state.doc
  let end = 0
  for (let k = 0; k < doc.childCount; k++) {
    const child = doc.child(k)
    if (
      child.type.name === 'titlePage' ||
      child.type.name === 'screenplayImage'
    )
      end += child.nodeSize
    else break
  }
  return end
}

/**
 * Build the title-page nodes with the classic layout: optional images at the
 * top, the title ~⅓ down, the credit line below it, the draft/contact/copyright/
 * notes block pushed to the bottom (via blank spacer lines), then optional
 * images at the very bottom. Rendered identically by the flow exporters.
 */
export function buildTitlePageBlocks(
  editor: Editor,
  data: TpData,
  imagesAbove: Record<string, unknown>[],
  imagesBelow: Record<string, unknown>[],
): PMNode[] {
  const schema = editor.state.schema
  const titlePageType = schema.nodes.titlePage
  const imageType = schema.nodes.screenplayImage
  const { byLine, draftLine, copyrightLine } = deriveFields(data)
  const blank = () => titlePageType.create({ field: 'blank' })
  const text = (field: string, t: string): PMNode =>
    titlePageType.create(
      field === 'title' ? { field: 'title', ...data } : { field },
      t ? schema.text(t) : undefined,
    )
  const imgLines = (a: Record<string, unknown>) =>
    Math.max(1, Number(a.heightLines) || 8)

  const TITLE_LINE = 15
  const PAGE_LINES = 50
  const aboveLines = imagesAbove.reduce((s, a) => s + imgLines(a), 0)
  const belowLines = imagesBelow.reduce((s, a) => s + imgLines(a), 0)

  const blocks: PMNode[] = []
  for (const a of imagesAbove) blocks.push(imageType.create(a))
  const topSpacers = Math.max(2, TITLE_LINE - 1 - aboveLines)
  for (let i = 0; i < topSpacers; i++) blocks.push(blank())
  blocks.push(text('title', data.tpTitle || ''))
  let used = aboveLines + topSpacers + 1
  if (byLine) {
    blocks.push(blank(), blank(), text('author', byLine))
    used += 3
  }

  const bottom: [string, string][] = []
  if (draftLine) bottom.push(['draft', draftLine])
  if (data.tpContact) bottom.push(['contact', data.tpContact])
  if (copyrightLine) bottom.push(['copyright', copyrightLine])
  if (data.tpNotes) bottom.push(['date', data.tpNotes])
  const bottomLines = bottom.reduce((s, [, t]) => s + t.split('\n').length, 0)
  if (bottom.length || imagesBelow.length) {
    const gap = Math.max(2, PAGE_LINES - used - bottomLines - belowLines)
    for (let i = 0; i < gap; i++) blocks.push(blank())
    for (const [f, t] of bottom) blocks.push(text(f, t))
    for (const a of imagesBelow) blocks.push(imageType.create(a))
  }
  return blocks
}
