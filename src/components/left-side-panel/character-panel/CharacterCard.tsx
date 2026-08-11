import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, Maximize2 } from 'lucide-react'
import CharacterCompletenessRing from './CharacterCompletenessRing'
import CharacterFieldsForm from './CharacterFieldsForm'
import { stripHtml } from './characterUtils'
import type {
  CharacterProfile,
  CharacterRelationship,
} from '@/stores/editorStore'

interface CharacterCardStats {
  dialogueCount: number
  sceneCount: number
  scenes: string[]
}

interface CharacterCardProps {
  name: string
  profile: CharacterProfile
  stats: CharacterCardStats | undefined
  isExpanded: boolean
  isOrphaned: boolean
  allCharacters: string[]
  relationships: CharacterRelationship[]
  projectId: string | null
  uploading: boolean
  getAssetUrl: (assetId: string) => string
  onToggleExpand: () => void
  onNavigateToCharacter: () => void
  onNavigateToScene: (sceneText: string) => void
  onEnlarge: () => void
  onRemoveRequest: () => void
  onUpdateProfile: (updates: Partial<Omit<CharacterProfile, 'name'>>) => void
  onSaveRelationship: (rel: CharacterRelationship) => void
  onDeleteRelationship: (id: string) => void
  onOpenLightbox: (url: string, name: string) => void
  onTriggerUpload: (e: React.MouseEvent<HTMLButtonElement>) => void
  onPickFromAssets: () => void
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  name,
  profile,
  stats,
  isExpanded,
  isOrphaned,
  allCharacters,
  relationships,
  projectId,
  uploading,
  getAssetUrl,
  onToggleExpand,
  onNavigateToCharacter,
  onNavigateToScene,
  onEnlarge,
  onRemoveRequest,
  onUpdateProfile,
  onSaveRelationship,
  onDeleteRelationship,
  onOpenLightbox,
  onTriggerUpload,
  onPickFromAssets,
}) => {
  const primaryImageId = profile.images?.[0]
  const descPreview = !isExpanded ? stripHtml(profile.description || '') : ''

  return (
    <div
      data-char-name={name}
      className={`bg-(--fd-dropdown-bg) border border-(--fd-border) rounded-md mb-1 overflow-hidden transition-colors duration-150 hover:border-[#555] ${isOrphaned ? 'opacity-70 border-[#553333]' : ''}`}
    >
      {isOrphaned && (
        <div className="flex justify-between items-center bg-[rgba(224,96,96,0.1)] px-2.5 py-1 border-[rgba(224,96,96,0.2)] border-b text-[#e06060] text-[10px]">
          <span>Not in script</span>
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-[rgba(224,96,96,0.15)] px-2 py-0.5 border-[#e06060] h-auto text-[#e06060] text-[10px]"
            onClick={onRemoveRequest}
          >
            Remove
          </Button>
        </div>
      )}

      <div
        className="flex items-center gap-2 px-2.5 py-2 cursor-pointer"
        onClick={onToggleExpand}
      >
        {primaryImageId ? (
          <img
            src={getAssetUrl(primaryImageId)}
            alt={name}
            className="w-7 h-7 rounded-full object-cover shrink-0 border-2 border-(--fd-border)"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <input
            type="color"
            className="bg-transparent p-0 border-0 rounded-[3px] w-5 h-5 cursor-pointer shrink-0"
            value={profile.color || '#999999'}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdateProfile({ color: e.target.value })}
            title="Highlight color"
          />
        )}

        <div className="flex flex-col flex-1 gap-0.5 min-w-0">
          <span
            className="text-xs font-semibold text-(--fd-text) uppercase tracking-[0.3px] cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis hover:text-(--fd-accent)"
            onClick={(e) => {
              e.stopPropagation()
              onNavigateToCharacter()
            }}
            title="Click to navigate to first appearance"
          >
            {name}
          </span>
          {descPreview && (
            <span className="text-[10px] text-(--fd-text-muted) whitespace-nowrap overflow-hidden text-ellipsis">
              {descPreview.slice(0, 50)}
              {descPreview.length > 50 ? '...' : ''}
            </span>
          )}
        </div>

        {stats && (
          <div className="flex flex-col items-end gap-px text-[9px] text-(--fd-text-muted) shrink-0 whitespace-nowrap">
            <span title={`${stats.dialogueCount} dialogue lines`}>
              {stats.dialogueCount} lines
            </span>
            <span title={`In ${stats.sceneCount} scenes`}>
              {stats.sceneCount} scenes
            </span>
          </div>
        )}

        <CharacterCompletenessRing profile={profile} />

        <Button
          variant="ghost"
          size="icon"
          className="size-5 text-(--fd-text-muted) shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onEnlarge()
          }}
          title="View enlarged"
        >
          <Maximize2 className="size-3.5" />
        </Button>

        <ChevronDown
          className={`size-3 text-(--fd-text-muted) transition-transform duration-150 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {isExpanded && (
        <div className="px-2.5 pt-2 pb-3 border-t border-(--fd-border) flex flex-col gap-2">
          <CharacterFieldsForm
            charName={name}
            profile={profile}
            stats={stats}
            allCharacters={allCharacters}
            relationships={relationships}
            projectId={projectId}
            uploading={uploading}
            onUpdateProfile={onUpdateProfile}
            onSaveRelationship={onSaveRelationship}
            onDeleteRelationship={onDeleteRelationship}
            onNavigateToScene={onNavigateToScene}
            getAssetUrl={getAssetUrl}
            onOpenLightbox={onOpenLightbox}
            onTriggerUpload={onTriggerUpload}
            onPickFromAssets={onPickFromAssets}
          />
        </div>
      )}
    </div>
  )
}

export default CharacterCard
