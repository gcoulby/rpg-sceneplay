import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { FONT_REGISTRY } from '@/utils/open-draft/fonts'

interface CursorFormatting {
  cursorFont: string
  cursorSize: number | null // null = mixed selection
  extraFonts: string[]
}

export function useCursorFormatting(
  editor: Editor | null,
  fontFamily: string,
  fontSize: number,
): CursorFormatting {
  const [cursorFont, setCursorFont] = useState(fontFamily)
  const [cursorSize, setCursorSize] = useState<number | null>(fontSize)
  const [extraFonts, setExtraFonts] = useState<string[]>([])

  useEffect(() => {
    if (!editor) return

    const detect = () => {
      const { from, to, empty } = editor.state.selection

      if (empty) {
        const attrs = editor.getAttributes('textStyle')
        const detectedFont = (attrs.fontFamily as string | undefined) || ''
        const detectedSize = (attrs.fontSize as string | undefined) || ''
        const effectiveFont = detectedFont || fontFamily
        setCursorFont(effectiveFont)
        if (
          effectiveFont &&
          !FONT_REGISTRY.find((f) => f.name === effectiveFont)
        ) {
          setExtraFonts((prev) =>
            prev.includes(effectiveFont) ? prev : [...prev, effectiveFont],
          )
        }
        setCursorSize(
          detectedSize ? parseInt(detectedSize, 10) || fontSize : fontSize,
        )
        return
      }

      const fonts = new Set<string>()
      const sizes = new Set<string>()
      let sawText = false
      editor.state.doc.nodesBetween(from, to, (node, pos) => {
        if (!node.isText || !node.text) return
        const start = Math.max(pos, from)
        const end = Math.min(pos + node.nodeSize, to)
        if (end <= start) return
        sawText = true
        const ts = node.marks.find((m) => m.type.name === 'textStyle')
        fonts.add((ts?.attrs.fontFamily as string | undefined) || '')
        sizes.add((ts?.attrs.fontSize as string | undefined) || '')
      })

      if (!sawText) {
        const attrs = editor.getAttributes('textStyle')
        const detectedFont = (attrs.fontFamily as string | undefined) || ''
        const detectedSize = (attrs.fontSize as string | undefined) || ''
        setCursorFont(detectedFont || fontFamily)
        setCursorSize(
          detectedSize ? parseInt(detectedSize, 10) || fontSize : fontSize,
        )
        return
      }

      if (fonts.size > 1) {
        setCursorFont('')
      } else {
        const single = [...fonts][0] || fontFamily
        setCursorFont(single)
        if (single && !FONT_REGISTRY.find((f) => f.name === single)) {
          setExtraFonts((prev) =>
            prev.includes(single) ? prev : [...prev, single],
          )
        }
      }

      setCursorSize(
        sizes.size > 1 ? null : parseInt([...sizes][0], 10) || fontSize || null,
      )
    }

    editor.on('selectionUpdate', detect)
    editor.on('transaction', detect)
    detect()
    return () => {
      editor.off('selectionUpdate', detect)
      editor.off('transaction', detect)
    }
  }, [editor, fontFamily, fontSize])

  // Fonts used anywhere in the doc that aren't in FONT_REGISTRY.
  useEffect(() => {
    if (!editor) return
    const collect = () => {
      const found = new Set<string>()
      editor.state.doc.descendants((node) => {
        if (node.isText && node.marks) {
          for (const mark of node.marks) {
            if (mark.type.name === 'textStyle' && mark.attrs.fontFamily) {
              const f = mark.attrs.fontFamily as string
              if (!FONT_REGISTRY.find((r) => r.name === f)) found.add(f)
            }
          }
        }
      })
      if (found.size > 0) {
        setExtraFonts((prev) => {
          const merged = new Set([...prev, ...found])
          return merged.size !== prev.length ? [...merged] : prev
        })
      }
    }
    collect()
    editor.on('update', collect)
    return () => {
      editor.off('update', collect)
    }
  }, [editor])

  return { cursorFont, cursorSize, extraFonts }
}
