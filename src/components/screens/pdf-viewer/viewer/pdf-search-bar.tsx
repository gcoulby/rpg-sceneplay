import { useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PdfSearchApi } from './use-pdf-search'

interface PdfSearchBarProps {
  search: PdfSearchApi
  onClose: () => void
}

export default function PdfSearchBar({ search, onClose }: PdfSearchBarProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const hasQuery = search.query.trim().length > 0

  return (
    <div className="flex items-center gap-1 bg-(--fd-navigator-bg) px-2 py-1.5 border-(--fd-border) border-b shrink-0">
      <Input
        ref={inputRef}
        value={search.query}
        onChange={(e) => search.find(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            if (e.shiftKey) search.findPrevious()
            else search.findNext()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onClose()
          }
        }}
        placeholder="Find in document"
        className="h-7 text-xs"
      />
      <span className="text-(--fd-text-muted) text-xs whitespace-nowrap tabular-nums">
        {hasQuery
          ? search.notFound
            ? 'Not found'
            : `${search.matches.current} / ${search.matches.total}`
          : ''}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={search.findPrevious}
        disabled={!hasQuery}
        title="Previous match"
      >
        <ChevronUp className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={search.findNext}
        disabled={!hasQuery}
        title="Next match"
      >
        <ChevronDown className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={onClose}
        title="Close search"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
