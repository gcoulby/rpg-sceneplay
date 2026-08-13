import React from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSheetStore } from '../store/useSheetStore'
import { deleteSheet, linkSheetToCharacter } from '../store/sheetLinking'
import { useEditorStore } from '@/stores/editorStore'

interface OrphanedSheetsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Sheets with no linked character stay visible and reassignable here rather
 *  than becoming invisible dead data. */
const OrphanedSheetsPanel: React.FC<OrphanedSheetsPanelProps> = ({
  open,
  onOpenChange,
}) => {
  const sheets = useSheetStore((s) => s.sheets)
  const orphaned = sheets.filter((s) => s.characterName === null)
  const characterProfiles = useEditorStore((s) => s.characterProfiles)
  const unlinkedCharacters = characterProfiles.filter((p) => !p.sheetId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Orphaned Sheets</DialogTitle>
        </DialogHeader>

        {orphaned.length === 0 ? (
          <p className="py-6 text-(--fd-text-muted) text-xs text-center">
            No orphaned sheets.
          </p>
        ) : (
          <div className="flex flex-col gap-2 py-2">
            {orphaned.map((sheet) => (
              <div
                key={sheet.id}
                className="flex items-center gap-2 bg-(--fd-dropdown-bg) p-2 border border-(--fd-border) rounded-md"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{sheet.name}</div>
                  <div className="text-[10px] text-(--fd-text-muted)">
                    {sheet.moduleLayout.tabs.length} tab(s)
                  </div>
                </div>
                {unlinkedCharacters.length > 0 && (
                  <select
                    className="bg-transparent px-1 border border-(--fd-border) rounded text-[11px]"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) linkSheetToCharacter(sheet.id, e.target.value)
                    }}
                  >
                    <option value="" disabled>
                      Link to...
                    </option>
                    {unlinkedCharacters.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-(--fd-text-muted)"
                  onClick={() => deleteSheet(sheet.id)}
                  title="Delete sheet"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default OrphanedSheetsPanel
