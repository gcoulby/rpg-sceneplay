import React from 'react'
import { Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CharacterImageGalleryProps {
  images: string[]
  characterName: string
  canPickFromAssets: boolean
  getAssetUrl: (assetId: string) => string
  onSetPrimary: (assetId: string) => void
  onRemove: (assetId: string) => void
  onOpenLightbox: (url: string, name: string) => void
  onUpload: (e: React.MouseEvent<HTMLButtonElement>) => void
  onPickFromAssets: () => void
  uploading: boolean
}

const CharacterImageGallery: React.FC<CharacterImageGalleryProps> = ({
  images,
  characterName,
  canPickFromAssets,
  getAssetUrl,
  onSetPrimary,
  onRemove,
  onOpenLightbox,
  onUpload,
  onPickFromAssets,
  uploading,
}) => (
  <div className="flex flex-col gap-1.5">
    {images.length > 0 && (
      <>
        <div className="w-full rounded overflow-hidden bg-(--fd-input-bg) border border-(--fd-border) relative">
          <img
            src={getAssetUrl(images[0])}
            alt={characterName}
            className="block hover:opacity-85 w-full max-h-50 object-cover transition-opacity duration-150 cursor-pointer"
            onClick={() =>
              onOpenLightbox(getAssetUrl(images[0]), characterName)
            }
          />
          <button
            type="button"
            className="top-0 right-0 z-1000 absolute flex justify-center items-center bg-black/70 p-0 border-none rounded-bl-sm w-4 h-4 text-white transition-opacity duration-150 cursor-pointer"
            onClick={() => onRemove(images[0])}
            title="Remove image"
          >
            <X className="size-2.5" />
          </button>
        </div>

        {images.length > 1 && (
          <div className="flex gap-1 pb-0.5 overflow-x-auto">
            {images.map((imgId, idx) => (
              <div
                key={imgId}
                className={`group relative shrink-0 w-11 h-11 rounded overflow-hidden border-2 cursor-pointer hover:border-(--fd-accent) ${idx === 0 ? 'border-(--fd-accent)' : 'border-transparent'}`}
              >
                <img
                  src={getAssetUrl(imgId)}
                  alt={`${characterName} ${idx + 1}`}
                  className="block w-full h-full object-cover"
                  onClick={() =>
                    onOpenLightbox(getAssetUrl(imgId), characterName)
                  }
                />
                {idx > 0 && (
                  <button
                    type="button"
                    className="bottom-0 left-0 absolute flex justify-center items-center bg-black/70 opacity-0 group-hover:opacity-100 p-0 border-none rounded-tr-sm w-4 h-4 text-[#f4d35e] transition-opacity duration-150 cursor-pointer"
                    onClick={() => onSetPrimary(imgId)}
                    title="Set as primary image"
                  >
                    <Star className="fill-current size-2.5" />
                  </button>
                )}
                <button
                  type="button"
                  className="top-0 right-0 absolute flex justify-center items-center bg-black/70 opacity-0 group-hover:opacity-100 p-0 border-none rounded-bl-sm w-4 h-4 text-white transition-opacity duration-150 cursor-pointer"
                  onClick={() => onRemove(imgId)}
                  title="Remove image"
                >
                  <X className="size-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </>
    )}

    <div className="flex gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="flex-1 h-auto py-1 px-2 text-[10px] text-(--fd-text-muted)"
        data-char-name={characterName}
        onClick={onUpload}
        disabled={uploading}
        title="Upload a new image for this character"
      >
        {uploading ? 'Uploading...' : 'Upload Image'}
      </Button>
      {canPickFromAssets && (
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-auto py-1 px-2 text-[10px] text-(--fd-text-muted)"
          onClick={onPickFromAssets}
          title="Associate an existing project asset"
        >
          From Assets
        </Button>
      )}
    </div>
  </div>
)

export default CharacterImageGallery
