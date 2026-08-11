import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import MiniRichText from './MiniRichText'
import CharacterColorPicker from './CharacterColorPicker'
import CharacterImageGallery from './CharacterImageGallery'
import CharacterVoiceProfileSection from './CharacterVoiceProfileSection'
import CharacterSceneChips from './CharacterSceneChips'
import RelationshipList from './RelationshipList'
import { CHARACTER_ROLES } from './characterConstants'
import type {
  CharacterProfile,
  CharacterRelationship,
} from '@/stores/editorStore'

const FIELD_LABEL =
  'text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px] mb-0.5 block'

interface CharacterFieldsFormProps {
  charName: string
  profile: CharacterProfile
  stats: { scenes: string[] } | undefined
  allCharacters: string[]
  relationships: CharacterRelationship[]
  projectId: string | null
  uploading: boolean
  onUpdateProfile: (updates: Partial<Omit<CharacterProfile, 'name'>>) => void
  onSaveRelationship: (rel: CharacterRelationship) => void
  onDeleteRelationship: (id: string) => void
  onNavigateToScene: (sceneText: string) => void
  getAssetUrl: (assetId: string) => string
  onOpenLightbox: (url: string, name: string) => void
  onTriggerUpload: (e: React.MouseEvent<HTMLButtonElement>) => void
  onPickFromAssets: () => void
}

const CharacterFieldsForm: React.FC<CharacterFieldsFormProps> = ({
  charName,
  profile,
  stats,
  allCharacters,
  relationships,
  projectId,
  uploading,
  onUpdateProfile,
  onSaveRelationship,
  onDeleteRelationship,
  onNavigateToScene,
  getAssetUrl,
  onOpenLightbox,
  onTriggerUpload,
  onPickFromAssets,
}) => (
  <>
    <label className={FIELD_LABEL}>Description</label>
    <MiniRichText
      value={profile.description}
      onChange={(html) => onUpdateProfile({ description: html })}
      placeholder="A weary detective in his 50s, haunted by a cold case..."
      minHeight={50}
    />

    <div className="flex gap-1.5">
      <div className="flex flex-col flex-1 min-w-0">
        <label className={FIELD_LABEL}>Role</label>
        <Select
          value={profile.role}
          onValueChange={(v) => onUpdateProfile({ role: v as string })}
        >
          <SelectTrigger className="px-1 w-full h-6.5 text-[11px]">
            <SelectValue placeholder="e.g. Lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">—</SelectItem>
            {CHARACTER_ROLES.filter(Boolean).map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <label className={FIELD_LABEL}>Gender</label>
        <Input
          className="h-6.5 text-[11px]"
          value={profile.gender}
          onChange={(e) => onUpdateProfile({ gender: e.target.value })}
          placeholder="e.g. Male"
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <label className={FIELD_LABEL}>Age</label>
        <Input
          className="h-6.5 text-[11px]"
          value={profile.age}
          onChange={(e) => onUpdateProfile({ age: e.target.value })}
          placeholder="e.g. 30s"
        />
      </div>
    </div>

    <CharacterImageGallery
      images={profile.images || []}
      characterName={charName}
      canPickFromAssets={!!projectId}
      getAssetUrl={getAssetUrl}
      onSetPrimary={(assetId) => {
        const filtered = (profile.images || []).filter((id) => id !== assetId)
        onUpdateProfile({ images: [assetId, ...filtered] })
      }}
      onRemove={(assetId) =>
        onUpdateProfile({
          images: (profile.images || []).filter((id) => id !== assetId),
        })
      }
      onOpenLightbox={onOpenLightbox}
      onUpload={onTriggerUpload}
      onPickFromAssets={onPickFromAssets}
      uploading={uploading}
    />

    <label className={FIELD_LABEL}>Backstory</label>
    <MiniRichText
      value={profile.backstory}
      onChange={(html) => onUpdateProfile({ backstory: html })}
      placeholder="Character history, motivations, secrets..."
      minHeight={60}
    />

    <label className={FIELD_LABEL}>Character Arc</label>
    <MiniRichText
      value={profile.arc || ''}
      onChange={(html) => onUpdateProfile({ arc: html })}
      placeholder="How does this character change through the story..."
      minHeight={50}
    />

    <CharacterVoiceProfileSection
      speechPattern={profile.speechPattern || ''}
      vocabulary={profile.vocabulary || ''}
      verbalTics={profile.verbalTics || ''}
      sampleDialogue={profile.sampleDialogue || ''}
      onChange={(field, html) => onUpdateProfile({ [field]: html })}
    />

    <div className="flex flex-col gap-1">
      <label className={FIELD_LABEL}>Color</label>
      <CharacterColorPicker
        value={profile.color || ''}
        onChange={(color) => onUpdateProfile({ color })}
      />
      <div className="flex items-center gap-1.5 mt-0.5">
        <label className="text-[10px] text-(--fd-text-muted) uppercase tracking-[0.3px]">
          Highlight
        </label>
        <Button
          size="sm"
          variant={profile.highlighted ? 'default' : 'outline'}
          className="px-3 py-0.75 h-auto text-[11px]"
          style={
            profile.highlighted
              ? {
                  background: profile.color || '#999',
                  borderColor: profile.color || '#999',
                }
              : undefined
          }
          onClick={() => onUpdateProfile({ highlighted: !profile.highlighted })}
        >
          {profile.highlighted ? 'On' : 'Off'}
        </Button>
      </div>
    </div>

    <RelationshipList
      characterName={charName.toUpperCase()}
      allCharacters={allCharacters}
      relationships={relationships}
      onSave={onSaveRelationship}
      onDelete={onDeleteRelationship}
    />

    {stats && (
      <CharacterSceneChips
        scenes={stats.scenes}
        onNavigateToScene={onNavigateToScene}
      />
    )}
  </>
)

export default CharacterFieldsForm
