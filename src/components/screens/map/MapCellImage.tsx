import { useAssetUrl } from '@/storage/assetStore'

interface MapCellImageProps {
  assetId: string
  x: number
  y: number
  width: number
  height: number
  clipPathId?: string
}

/** Renders a single cell's image, clipped to the cell shape (hex needs a clip
 *  path since the image is a rectangle; grid cells are already rectangles). */
export default function MapCellImage({
  assetId,
  x,
  y,
  width,
  height,
  clipPathId,
}: MapCellImageProps) {
  const url = useAssetUrl(assetId)
  if (!url) return null

  return (
    <image
      href={url}
      x={x}
      y={y}
      width={width}
      height={height}
      preserveAspectRatio="xMidYMid slice"
      clipPath={clipPathId ? `url(#${clipPathId})` : undefined}
      className="pointer-events-none"
    />
  )
}
