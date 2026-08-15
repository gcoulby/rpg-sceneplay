import React from 'react'
import { IdCard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import CharacterFieldsForm from './CharacterFieldsForm'
import type { CharacterProfile, CharacterRelationship } from '@/stores/editorStore'
import { openCharacterSheet } from '@/components/screens/character-sheets/store/openCharacterSheet'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CharacterDetailDialogProps {
  charName: string | null
  profile: CharacterProfile | null
  stats:
    | { dialogueCount: number; sceneCount: number; scenes: string[] }
    | undefined
  allCharacters: string[]
  relationships: CharacterRelationship[]
  projectId: string | null
  uploading: boolean
  getAssetUrl: (assetId: string) => string
  onUpdateProfile: (updates: Partial<Omit<CharacterProfile, 'name'>>) => void
  onSaveRelationship: (rel: CharacterRelationship) => void
  onDeleteRelationship: (id: string) => void
  onNavigateToScene: (sceneText: string) => void
  onOpenLightbox: (url: string, name: string) => void
  onTriggerUpload: (e: React.MouseEvent<HTMLButtonElement>) => void
  onPickFromAssets: () => void
  onOpenChange: (open: boolean) => void
}

const CharacterDetailDialog: React.FC<CharacterDetailDialogProps> = ({
  charName,
  profile,
  stats,
  allCharacters,
  relationships,
  projectId,
  uploading,
  getAssetUrl,
  onUpdateProfile,
  onSaveRelationship,
  onDeleteRelationship,
  onNavigateToScene,
  onOpenLightbox,
  onTriggerUpload,
  onPickFromAssets,
  onOpenChange,
}) => {
  return (
  <Dialog open={charName !== null} onOpenChange={onOpenChange}>
    <DialogContent className="flex flex-col gap-0 p-0 max-w-2/3! max-h-[85vh]">
      <DialogHeader className="flex-row items-center justify-between px-5 py-3.5 border-b border-(--fd-border) shrink-0">
        <DialogTitle className="text-base">{charName}</DialogTitle>
        {charName && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              openCharacterSheet(charName)
              onOpenChange(false)
            }}
          >
            <IdCard className="mr-1 size-3.5" />
            Open Sheet
          </Button>
        )}
      </DialogHeader>
      <ScrollArea className="w-full h-[65vh]">
        {charName && profile && (
          <div className="flex flex-col gap-3 p-4 w-full overflow-y-auto">
            <CharacterFieldsForm
              charName={charName}
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
      </ScrollArea>
    </DialogContent>
  </Dialog>
  )
}

export default CharacterDetailDialog
