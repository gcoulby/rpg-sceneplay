import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type CharacterSortBy = 'name' | 'importance' | 'scenes' | 'dialogues' | 'appearance'

interface CharacterListToolbarProps {
  searchQuery: string
  onSearchChange: (v: string) => void
  onBuildFromScript: () => void
  onNewCharacter: () => void
  sortBy: CharacterSortBy
  onSortByChange: (v: CharacterSortBy) => void
}

const SORT_OPTIONS: { value: CharacterSortBy; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'importance', label: 'Importance' },
  { value: 'scenes', label: 'Scenes' },
  { value: 'dialogues', label: 'Dialogues' },
  { value: 'appearance', label: 'Appearance' },
]

const CharacterListToolbar: React.FC<CharacterListToolbarProps> = ({
  searchQuery,
  onSearchChange,
  onBuildFromScript,
  onNewCharacter,
  sortBy,
  onSortByChange,
}) => (
  <>
    <div className="flex gap-1.5 px-3 py-2 border-b border-(--fd-border) shrink-0">
      <Input
        type="text"
        placeholder="Search characters..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 h-7 text-xs"
      />
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2.5 text-[11px] whitespace-nowrap shrink-0"
        onClick={onNewCharacter}
        title="Create a character ahead of the script, so you can build their sheet first"
      >
        New Character
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2.5 text-[11px] text-(--fd-accent) border-(--fd-accent) whitespace-nowrap shrink-0"
        onClick={onBuildFromScript}
        title="Scan the screenplay for characters and extract descriptions from action lines"
      >
        Build from Script
      </Button>
    </div>
    <div className="flex items-center gap-1.5 pt-1 px-3 pb-1.5 border-b border-(--fd-border) shrink-0">
      <span className="text-[9px] text-(--fd-text-muted) uppercase tracking-[0.4px]">Sort</span>
      <Select value={sortBy} onValueChange={(v) => onSortByChange(v as CharacterSortBy)}>
        <SelectTrigger className="flex-1 h-5.5 text-[11px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </>
)

export default CharacterListToolbar
