import { useEffect, useState } from 'react'
import { resolveImageUrl } from '@/utils/open-draft/imageAsset'

interface TpImageThumbProps {
  attrs: Record<string, unknown>
  align?: boolean
}

/** Small image thumbnail for the title-page preview/list. Resolves the node's
 *  asset the same way the editor NodeView does, and releases the object URL
 *  when the thumbnail goes away. */
export default function TpImageThumb({ attrs, align }: TpImageThumbProps) {
  const [url, setUrl] = useState('')
  const assetId = attrs.assetId as string | null | undefined
  const src = attrs.src as string | null | undefined

  useEffect(() => {
    let revoke: (() => void) | null = null
    let cancelled = false
    void (async () => {
      const loadable = await resolveImageUrl({ assetId, src })
      if (!loadable) return
      if (cancelled) {
        loadable.revoke()
        return
      }
      revoke = loadable.revoke
      setUrl(loadable.url)
    })()
    return () => {
      cancelled = true
      revoke?.()
    }
  }, [assetId, src])

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
