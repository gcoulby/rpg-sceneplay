import { useState } from 'react'
import { Settings, FileStack } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/stores/editorStore'
import { useSheetStore } from './store/useSheetStore'
import { createBlankSheet, createSheetFromTemplate } from './store/createSheet'
import { applyCharacterName, cloneSheetLayout } from './store/cloneSheetLayout'
import type { SheetTab, SheetTemplate } from './types'
import SheetPickerPrompt from './panel/SheetPickerPrompt'
import SheetTabsEditor from './panel/SheetTabsEditor'
import SheetOptionsDialog from './panel/SheetOptionsDialog'
import TemplateChangeDialog from './panel/TemplateChangeDialog'
import OrphanedSheetsPanel from './panel/OrphanedSheetsPanel'
import { Card } from '@/components/ui/card'

export const CharacterSheet = () => {
  const characters = useEditorStore((s) => s.characterProfiles)

  const setActiveCharacterName = useSheetStore((s) => s.setActiveCharacterName)
  const selectedCharacter = useSheetStore((s) => s.activeCharacterName)
  const characterProfiles = useEditorStore((s) => s.characterProfiles)
  const sheets = useSheetStore((s) => s.sheets)
  const updateSheet = useSheetStore((s) => s.updateSheet)

  const [optionsOpen, setOptionsOpen] = useState(false)
  const [orphansOpen, setOrphansOpen] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<SheetTemplate | null>(
    null,
  )

  const profile = selectedCharacter
    ? characterProfiles.find((p) => p.name === selectedCharacter)
    : undefined
  const sheet = profile?.sheetId
    ? sheets.find((s) => s.id === profile.sheetId)
    : undefined

  const header = (
    <div className="flex items-center justify-between py-2.5 px-4 border-b border-(--fd-border) bg-(--fd-navigator-bg) shrink-0 gap-4">
      <span className="font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
        {sheet ? sheet.options.name : 'Character Sheet'}
      </span>
      <div className="flex items-center gap-1">
        {sheet && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setOptionsOpen(true)}
            title="Sheet options"
          >
            <Settings className="size-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setOrphansOpen(true)}
          title="Orphaned sheets"
        >
          <FileStack className="size-3.5" />
        </Button>
      </div>
    </div>
  )

  console.log('CHARS', characters, characters.length)

  return (
    <ScrollArea className="h-(--app-h)">
      {header}
      <div className="p-4">
        {!selectedCharacter && (
          <>
            <p className="py-2 mt-4 text-(--fd-text-muted) text-xs text-center">
              Select a character to view their sheet.
            </p>
            <div className="flex gap-3 p-4">
              {characters.map((char) => (
                <Card
                  className="flex justify-center items-center p-4 w-1/3 cursor-pointer"
                  onClick={() => {
                    setActiveCharacterName(char.name)
                  }}
                >
                  {char.name}
                </Card>
              ))}
            </div>
          </>
        )}

        {selectedCharacter && !sheet && (
          <SheetPickerPrompt
            characterName={selectedCharacter}
            onStartFromTemplate={(template) =>
              createSheetFromTemplate(template, selectedCharacter)
            }
            onStartBlank={() => createBlankSheet(selectedCharacter)}
          />
        )}

        {sheet && (
          <>
            <SheetTabsEditor
              sheet={sheet}
              onChangeLayout={(tabs: SheetTab[]) =>
                updateSheet(sheet.id, { moduleLayout: { tabs } })
              }
            />
            <SheetOptionsDialog
              sheet={sheet}
              open={optionsOpen}
              onOpenChange={setOptionsOpen}
              onSaveName={(name) =>
                updateSheet(sheet.id, { options: { ...sheet.options, name } })
              }
              onRequestTemplateChange={setPendingTemplate}
            />
            <TemplateChangeDialog
              pendingTemplate={pendingTemplate}
              onOpenChange={(open) => !open && setPendingTemplate(null)}
              onConfirm={() => {
                if (!pendingTemplate) return
                updateSheet(sheet.id, {
                  templateId: pendingTemplate.id,
                  moduleLayout: applyCharacterName(
                    cloneSheetLayout(pendingTemplate),
                    sheet.characterName ?? sheet.name,
                  ),
                  options: { ...sheet.options, themeId: pendingTemplate.id },
                })
                setPendingTemplate(null)
              }}
            />
          </>
        )}
      </div>

      <OrphanedSheetsPanel open={orphansOpen} onOpenChange={setOrphansOpen} />
    </ScrollArea>
  )
}
