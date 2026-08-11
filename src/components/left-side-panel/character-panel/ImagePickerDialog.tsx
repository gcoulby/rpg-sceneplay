import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Asset } from '@/stores/assetStore'

interface ImagePickerDialogProps {
  characterName: string | null
  filter: string
  onFilterChange: (v: string) => void
  images: Asset[]
  linkedAssetIds: string[]
  getAssetUrl: (assetId: string) => string
  onSelect: (assetId: string) => void
  onOpenChange: (open: boolean) => void
}

const ImagePickerDialog: React.FC<ImagePickerDialogProps> = ({
  characterName,
  filter,
  onFilterChange,
  images,
  linkedAssetIds,
  getAssetUrl,
  onSelect,
  onOpenChange,
}) => {
  const filtered = images.filter(
    (a) => !filter || a.original_name.toLowerCase().includes(filter.toLowerCase()),
  )

  return (
    <Dialog open={characterName !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-120 max-h-[70vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-3.5 border-b border-(--fd-border) shrink-0">
          <DialogTitle className="text-base">Select Image for {characterName}</DialogTitle>
        </DialogHeader>
        <div className="px-3 pt-2 pb-1">
          <Input
            type="text"
            placeholder="Filter by name..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="h-7 text-xs"
            autoFocus
          />
        </div>
        <div className="gap-2 grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] px-3 pt-2 pb-3 overflow-y-auto">
          {images.length === 0 ? (
            <div className="py-5 px-3 text-(--fd-text-muted) text-xs italic text-center leading-normal col-span-full">
              No image assets in this project. Upload images via the Asset Manager or the Upload
              button on a character.
            </div>
          ) : (
            filtered.map((asset) => {
              const alreadyLinked = linkedAssetIds.includes(asset.id)
              return (
                <div
                  key={asset.id}
                  className={`border-2 rounded overflow-hidden cursor-pointer transition-[border-color,opacity] duration-150 relative ${alreadyLinked ? 'opacity-50 cursor-default border-(--fd-border)' : 'border-(--fd-border) hover:border-(--fd-accent)'}`}
                  onClick={() => !alreadyLinked && onSelect(asset.id)}
                  title={alreadyLinked ? 'Already associated' : `Associate ${asset.original_name}`}
                >
                  <img
                    className="block w-full h-20 object-cover"
                    src={getAssetUrl(asset.id)}
                    alt={asset.original_name}
                  />
                  <span className="block text-[9px] text-(--fd-text-muted) py-0.75 px-1 whitespace-nowrap overflow-hidden text-ellipsis">
                    {asset.original_name}
                  </span>
                  {alreadyLinked && (
                    <span className="absolute top-0.5 right-0.5 bg-(--fd-accent) text-white text-[8px] py-px px-1 rounded-sm">
                      Linked
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ImagePickerDialog
