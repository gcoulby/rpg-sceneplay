import React from 'react'
import type { Asset } from '@/stores/assetStore'
import { useAssetUrls } from '@/storage/assetStore'
import { isImageUrl, isVideoUrl, toEmbedUrl, openInBrowser } from './noteMedia'

const MEDIA_EMBED_CLASS =
  'my-1 rounded overflow-hidden max-w-full [&_img]:max-w-full [&_img]:h-auto [&_img]:block [&_img]:rounded [&_video]:max-w-full [&_video]:h-auto [&_video]:block [&_video]:rounded [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:border-none [&_iframe]:rounded'

interface NoteContentDisplayProps {
  content: string
  assets: Asset[]
}

const NoteContentDisplay: React.FC<NoteContentDisplayProps> = ({
  content,
  assets,
}) => {
  // Object URLs for every asset a note could reference by @name. Resolved for
  // the panel as a whole and released together when it unmounts.
  const assetUrls = useAssetUrls(React.useMemo(() => assets.map((a) => a.id), [assets]))

  if (!content) return null

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (isImageUrl(line) && /^https?:\/\//.test(line)) {
      elements.push(
        <div key={i} className={MEDIA_EMBED_CLASS}>
          <img src={line} alt="" loading="lazy" />
        </div>,
      )
      continue
    }

    if (isVideoUrl(line) && /^https?:\/\//.test(line)) {
      const embedUrl = toEmbedUrl(line)
      if (embedUrl) {
        elements.push(
          <div key={i} className={MEDIA_EMBED_CLASS}>
            <iframe src={embedUrl} allowFullScreen title="video" />
          </div>,
        )
      } else {
        elements.push(
          <div key={i} className={MEDIA_EMBED_CLASS}>
            <video src={line} controls preload="metadata" />
          </div>,
        )
      }
      continue
    }

    const parts = line.split(/(@\S+)/g)
    const lineElements: React.ReactNode[] = []
    for (let j = 0; j < parts.length; j++) {
      const part = parts[j]
      if (part.startsWith('@')) {
        const assetName = part.slice(1)
        const asset = assets.find(
          (a) =>
            a.original_name.toLowerCase() === assetName.toLowerCase() ||
            a.original_name.replace(/\s+/g, '_').toLowerCase() ===
              assetName.toLowerCase(),
        )
        if (asset) {
          const isImg = asset.mime_type.startsWith('image/')
          const url = assetUrls[asset.id] || '#'
          if (isImg) {
            lineElements.push(
              <span
                key={j}
                className="inline text-(--fd-accent) font-medium cursor-pointer hover:underline"
              >
                <img
                  src={url}
                  alt={asset.original_name}
                  className="inline-block mr-0.75 rounded-sm w-auto h-4.5 align-middle"
                  loading="lazy"
                />
                <span className="align-middle">{part}</span>
              </span>,
            )
          } else {
            lineElements.push(
              <a
                key={j}
                className="inline text-(--fd-accent) font-medium cursor-pointer no-underline hover:underline"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                {part}
              </a>,
            )
          }
        } else {
          lineElements.push(
            <span
              key={j}
              className="inline text-(--fd-text-muted) font-medium italic cursor-pointer"
            >
              {part}
            </span>,
          )
        }
      } else {
        const urlRegex = /(https?:\/\/[^\s]+)/g
        const textParts = part.split(urlRegex)
        for (let k = 0; k < textParts.length; k++) {
          const tp = textParts[k]
          if (urlRegex.test(tp)) {
            const handleClick = (e: React.MouseEvent) => {
              e.stopPropagation()
              e.preventDefault()
              openInBrowser(tp)
            }
            lineElements.push(
              <a
                key={`${j}-${k}`}
                href={tp}
                target="_blank"
                rel="noreferrer"
                className="text-(--fd-accent,#6ea0f7) underline cursor-pointer break-all hover:opacity-80"
                onClick={handleClick}
              >
                {tp}
              </a>,
            )
          } else if (tp) {
            lineElements.push(<span key={`${j}-${k}`}>{tp}</span>)
          }
          urlRegex.lastIndex = 0
        }
      }
    }

    elements.push(
      <div key={i} className="mb-0.5">
        {lineElements}
      </div>,
    )
  }

  return (
    <div className="text-xs text-(--fd-text) leading-[1.45]">{elements}</div>
  )
}

export default NoteContentDisplay
