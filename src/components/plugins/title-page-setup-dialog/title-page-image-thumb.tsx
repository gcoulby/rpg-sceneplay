import { useEffect, useMemo, useState } from 'react'
import { resolveImageUrl } from '@/utils/open-draft/imageAsset'
import { authedFetch } from '@/services/authedFetch'
import { isTauri } from '@/services/platform'

interface TpImageThumbProps {
  attrs: Record<string, unknown>
  align?: boolean
}

/** Small auth-aware image thumbnail for the title-page preview/list. Uses the
 *  same blob-fetch path as the editor NodeView so it loads reliably. */
export default function TpImageThumb({ attrs, align }: TpImageThumbProps) {
  const resolved = useMemo(() => resolveImageUrl(attrs) || '', [attrs])
  const directUrl = useMemo(
    () => (resolved.startsWith('data:') || isTauri() ? resolved : ''),
    [resolved],
  )
  const [blobUrl, setBlobUrl] = useState('')

  useEffect(() => {
    if (!resolved || resolved.startsWith('data:') || isTauri()) return
    let obj: string | null = null
    let cancelled = false
    ;(async () => {
      try {
        const res = await authedFetch(resolved)
        if (!res.ok) return
        const blob = await res.blob()
        obj = URL.createObjectURL(blob)
        if (!cancelled) setBlobUrl(obj)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
      if (obj) URL.revokeObjectURL(obj)
    }
  }, [resolved])

  const url = directUrl || blobUrl
  if (!url) return null

  const a = align ? (attrs.align as string) || 'center' : 'center'
  const margin =
    a === 'left'
      ? '3px auto 3px 0'
      : a === 'right'
        ? '3px 0 3px auto'
        : '3px auto'

  return (
    <img
      src={url}
      alt=""
      style={{ maxWidth: '70%', maxHeight: 70, display: 'block', margin }}
    />
  )
}
