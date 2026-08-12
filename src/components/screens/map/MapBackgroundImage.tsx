import { useAssetUrl } from '@/storage/assetStore'
import type { MapBackground } from './types'

interface MapBackgroundImageProps {
  background: MapBackground
}

/** Renders the map's background image behind the SVG grid/hex layer. */
export default function MapBackgroundImage({
  background,
}: MapBackgroundImageProps) {
  const url = useAssetUrl(background.assetId)
  if (!url) return null

  return (
    <img
      src={url}
      alt=""
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      style={{
        objectFit: background.fit,
        objectPosition: `${background.posX}% ${background.posY}%`,
        transform: `scale(${background.scale / 100})`,
        transformOrigin: `${background.posX}% ${background.posY}%`,
      }}
    />
  )
}
