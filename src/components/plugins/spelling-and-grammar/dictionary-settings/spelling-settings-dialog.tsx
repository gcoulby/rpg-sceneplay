import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEditorStore } from '@/stores/editorStore'

export default function SpellingSettings() {
  const spellingSettings = useEditorStore((s) => s.spellingSettings)
  const setSpellingSetting = useEditorStore((s) => s.setSpellingSetting)

  return (
    <div className="p-2.5 border rounded-md">
      <Label className="flex items-start gap-2.5 cursor-pointer">
        <Input
          type="checkbox"
          className="w-4"
          checked={spellingSettings.flagProperNouns}
          onChange={(e) =>
            setSpellingSetting('flagProperNouns', e.target.checked)
          }
        />
        <div className="flex-1">
          <div className="mb-1.5 font-semibold text-[13px]">
            Flag proper nouns
          </div>
          <div className="text-muted-foreground text-xs">
            When off, capitalized unknown words (names, places, brands) are not
            flagged. Turn on for stricter checking — real proper nouns will then
            need to be added to a dictionary.
          </div>
        </div>
      </Label>
    </div>
  )
}
