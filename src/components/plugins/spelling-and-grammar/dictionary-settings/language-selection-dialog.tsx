import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/stores/editorStore'
import { spellChecker } from '@/editor/spellchecker'
import { BUILTIN, findLanguage } from '@/editor/languageCatalog'
import { useSpellCheckerVersion } from '@/hooks/useSpellCheckerVersion'

interface LanguagesSectionProps {
  onOpenInstaller: () => void
}

export default function LanguagesSection({
  onOpenInstaller,
}: LanguagesSectionProps) {
  useSpellCheckerVersion()
  const installedLanguages = useEditorStore((s) => s.installedLanguages)
  const uninstallLanguage = useEditorStore((s) => s.uninstallLanguage)
  const loaded = spellChecker.getLoadedLanguages()
  const enabled = new Set(spellChecker.getEnabledLanguages())

  const toggle = (code: string, on: boolean) => {
    const current = spellChecker.getEnabledLanguages()
    const next = on
      ? Array.from(new Set([...current, code]))
      : current.filter((c) => c !== code)
    spellChecker.setEnabledLanguages(next)
  }

  const handleUninstall = async (code: string) => {
    const lang = findLanguage(code)
    const label = lang?.label || code
    if (
      !window.confirm(
        `Remove "${label}" from this installation? You can re-download it any time.`,
      )
    )
      return
    await uninstallLanguage(code)
  }

  return (
    <div className="p-2.5 border rounded-md">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="mb-1.5 font-semibold text-[13px]">Languages</div>
          <div className="text-muted-foreground text-xs">
            Hunspell engines that check words. Enable any combination for this
            script.
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onOpenInstaller}>
          Add language…
        </Button>
      </div>
      <div className="flex flex-col gap-1 mt-2.5">
        {loaded.length === 0 && (
          <div className="text-muted-foreground text-xs">
            Loading built-in language…
          </div>
        )}
        {loaded.map(({ code, label }) => {
          const isBuiltin = code === BUILTIN.code
          const isDownloaded = installedLanguages.includes(code)
          return (
            <label
              key={code}
              className="flex items-center gap-2 py-1 text-[13px]"
            >
              <input
                type="checkbox"
                checked={enabled.has(code)}
                onChange={(e) => toggle(code, e.target.checked)}
              />
              <span className="flex-1">{label}</span>
              <span className="text-[11px] text-muted-foreground">
                {isBuiltin ? 'bundled' : isDownloaded ? 'installed' : 'loaded'}
              </span>
              {!isBuiltin && (
                <Button
                  type="button"
                  onClick={() => handleUninstall(code)}
                  title="Remove this language"
                  className="cursor-pointer"
                >
                  ×
                </Button>
              )}
            </label>
          )
        })}
      </div>
    </div>
  )
}
