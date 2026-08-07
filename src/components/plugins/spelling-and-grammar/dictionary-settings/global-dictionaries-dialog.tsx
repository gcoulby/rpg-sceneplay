import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/stores/editorStore'
import { spellChecker } from '@/editor/spellchecker'
import { useSpellCheckerVersion } from '@/hooks/useSpellCheckerVersion'
import AddTargetToggle from '@/components/add-target-toggle'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface GlobalDictionariesSectionProps {
  onOpenLibrary: () => void
}

export default function GlobalDictionariesSection({
  onOpenLibrary,
}: GlobalDictionariesSectionProps) {
  useSpellCheckerVersion()
  const customDictionaries = useEditorStore((s) => s.customDictionaries)
  const addTargets = useEditorStore((s) => s.addTargets)
  const setAddTargets = useEditorStore((s) => s.setAddTargets)
  const names = Object.keys(customDictionaries).sort()
  const enabled = new Set(spellChecker.getEnabledGlobalDicts())

  const toggleEnabled = (name: string, on: boolean) => {
    const current = spellChecker.getEnabledGlobalDicts()
    const next = on
      ? Array.from(new Set([...current, name]))
      : current.filter((n) => n !== name)
    spellChecker.setEnabledGlobalDicts(next)
  }

  const toggleAddTarget = (name: string) => {
    const has = addTargets.includes(name)
    const next = has
      ? addTargets.filter((t) => t !== name)
      : [...addTargets, name]
    setAddTargets(next)
  }

  return (
    <div className="p-2.5 border rounded-md">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="mb-1.5 font-semibold text-[13px]">
            Global dictionaries
          </div>
          <div className="text-muted-foreground text-xs">
            Reusable word lists shared across projects. Enable any combination
            for this script.
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onOpenLibrary}>
          Manage library…
        </Button>
      </div>
      <div className="flex flex-col gap-1 mt-2.5">
        {names.length === 0 && (
          <div className="text-muted-foreground text-xs">
            No global dictionaries yet. Click "Manage library…" to create one.
          </div>
        )}
        {names.map((name) => (
          <div key={name} className="flex items-center gap-2 py-1 text-[13px]">
            <Label className="flex flex-1 items-center gap-2 min-w-0 cursor-pointer">
              <Input
                type="checkbox"
                className="w-4"
                checked={enabled.has(name)}
                onChange={(e) => toggleEnabled(name, e.target.checked)}
              />
              <span className="flex-1 truncate">{name}</span>
              <span className="text-[11px] text-muted-foreground">
                {customDictionaries[name].length} word
                {customDictionaries[name].length === 1 ? '' : 's'}
              </span>
            </Label>
            <AddTargetToggle
              active={addTargets.includes(name) && enabled.has(name)}
              disabled={!enabled.has(name)}
              onToggle={() => toggleAddTarget(name)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
