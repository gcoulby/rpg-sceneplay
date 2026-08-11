import React from 'react'
import type { Asset } from '@/stores/assetStore'

interface AssetSuggestionListProps {
  suggestions: Asset[]
  activeIndex: number
  onSelect: (asset: Asset) => void
}

const AssetSuggestionList: React.FC<AssetSuggestionListProps> = ({
  suggestions,
  activeIndex,
  onSelect,
}) => (
  <div className="absolute bottom-[calc(100%+2px)] left-0 right-0 max-h-50 overflow-y-auto bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-md shadow-[0_4px_12px_rgba(0,0,0,.4)] z-2600 py-1">
    {suggestions.map((a, idx) => (
      <div
        key={a.id}
        className={`flex items-center gap-1.5 py-1.25 px-2.5 cursor-pointer text-xs ${idx === activeIndex ? 'bg-(--fd-accent) text-white' : 'text-(--fd-text)'}`}
        onMouseDown={(e) => {
          e.preventDefault()
          onSelect(a)
        }}
      >
        <span className="text-sm shrink-0">
          {a.mime_type.startsWith('image/')
            ? '\u{1F5BC}'
            : a.mime_type.startsWith('video/')
              ? '\u{1F3AC}'
              : '\u{1F4CE}'}
        </span>
        <span className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {a.original_name}
        </span>
        <span
          className={`text-[10px] shrink-0 ${idx === activeIndex ? 'text-white/60' : 'text-(--fd-text-muted)'}`}
        >
          {a.tags.slice(0, 2).join(', ')}
        </span>
      </div>
    ))}
  </div>
)

export default AssetSuggestionList
