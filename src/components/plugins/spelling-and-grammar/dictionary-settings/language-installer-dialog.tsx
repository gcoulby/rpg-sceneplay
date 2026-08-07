import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditorStore } from '@/stores/editorStore'
import { spellChecker } from '@/editor/spellchecker'
import { CATALOG } from '@/editor/languageCatalog'
import { useSpellCheckerVersion } from '@/hooks/useSpellCheckerVersion'

interface LanguageInstallerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LanguageInstallerDialog({
  open,
  onOpenChange,
}: LanguageInstallerDialogProps) {
  useSpellCheckerVersion()
  const installedLanguages = useEditorStore((s) => s.installedLanguages)
  const installLanguage = useEditorStore((s) => s.installLanguage)
  const installLanguageFromUrls = useEditorStore(
    (s) => s.installLanguageFromUrls,
  )
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [customOpen, setCustomOpen] = useState(false)
  const [customCode, setCustomCode] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [customAff, setCustomAff] = useState('')
  const [customDic, setCustomDic] = useState('')

  const loadedCodes = new Set(
    spellChecker.getLoadedLanguages().map((l) => l.code),
  )

  const filtered = CATALOG.filter((l) => {
    if (!filter.trim()) return true
    const q = filter.toLowerCase()
    return l.label.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
  })

  const handleInstall = async (code: string) => {
    setBusy(code)
    setError(null)
    try {
      const res = await installLanguage(code)
      if (!res.ok) setError(res.error || 'Install failed.')
    } finally {
      setBusy(null)
    }
  }

  const handleInstallCustom = async () => {
    const code = customCode.trim()
    if (!code) {
      setError('Language code is required (e.g. hi_IN).')
      return
    }
    setBusy('__custom__')
    setError(null)
    try {
      const res = await installLanguageFromUrls({
        code,
        label: customLabel.trim() || code,
        affUrl: customAff.trim(),
        dicUrl: customDic.trim(),
      })
      if (!res.ok) {
        setError(res.error || 'Install failed.')
      } else {
        setCustomCode('')
        setCustomLabel('')
        setCustomAff('')
        setCustomDic('')
        setCustomOpen(false)
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Language</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2.5 max-h-[65vh] overflow-scroll">
          <div className="text-muted-foreground text-xs">
            Languages are downloaded from jsdelivr (wooorm/dictionaries) or the
            LibreOffice dictionaries repo on GitHub, and cached locally. A
            network connection is required for the first install.
          </div>
          <Input
            type="text"
            placeholder="Search languages…"
            className="h-8 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {error && (
            <div className="bg-[rgba(192,57,43,0.12)] px-2.5 py-1.5 rounded text-[#c0392b] text-xs">
              {error}
            </div>
          )}
          <div className="border rounded-md min-h-60 max-h-90 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-3 text-muted-foreground text-xs">
                No matches.
              </div>
            )}
            {filtered.map((lang) => {
              const isInstalled =
                loadedCodes.has(lang.code) ||
                installedLanguages.includes(lang.code)
              const isBusy = busy === lang.code
              return (
                <div
                  key={lang.code}
                  className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0 text-[13px]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{lang.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {lang.code} ·{' '}
                      {lang.source.kind === 'jsdelivr'
                        ? lang.source.npm
                        : lang.source.kind === 'libreoffice'
                          ? `LibreOffice/${lang.source.folder}`
                          : `OpenDraft/${lang.source.path}`}
                    </div>
                  </div>
                  {lang.sample && (
                    <div className="px-2 text-muted-foreground text-base">
                      {lang.sample}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-w-22.5"
                    disabled={isInstalled || isBusy}
                    onClick={() => handleInstall(lang.code)}
                  >
                    {isInstalled
                      ? 'Installed'
                      : isBusy
                        ? 'Installing…'
                        : 'Install'}
                  </Button>
                </div>
              )
            })}
          </div>
          <div className="pt-2.5 border-t">
            <Button
              type="button"
              onClick={() => setCustomOpen((v) => !v)}
              className="w-full cursor-pointer"
            >
              {customOpen ? '▾' : '▸'} Install from custom URL (e.g. Hindi,
              Tamil, etc.)
            </Button>
            {customOpen && (
              <div className="flex flex-col gap-1.5 mt-2.5">
                <div className="text-muted-foreground text-xs">
                  Paste links to a Hunspell `.aff` and `.dic` file. The pair
                  will be downloaded and cached locally.
                </div>
                <Input
                  type="text"
                  placeholder="Language code (e.g. hi_IN)"
                  className="h-8 text-sm"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Display name (e.g. Hindi)"
                  className="h-8 text-sm"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder=".aff URL"
                  className="h-8 text-sm"
                  value={customAff}
                  onChange={(e) => setCustomAff(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder=".dic URL"
                  className="h-8 text-sm"
                  value={customDic}
                  onChange={(e) => setCustomDic(e.target.value)}
                />
                <Button
                  size="sm"
                  className="self-end"
                  disabled={busy === '__custom__'}
                  onClick={handleInstallCustom}
                >
                  {busy === '__custom__' ? 'Installing…' : 'Install'}
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
