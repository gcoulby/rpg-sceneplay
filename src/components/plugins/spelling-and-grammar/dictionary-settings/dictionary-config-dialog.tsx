import { useState } from 'react'
import LanguagesSection from '@/components/plugins/spelling-and-grammar/dictionary-settings/language-selection-dialog'
import LanguageInstallerDialog from '@/components/plugins/spelling-and-grammar/dictionary-settings/language-installer-dialog'
import ProjectDictionarySection from '@/components/plugins/spelling-and-grammar/dictionary-settings/project-dictionary-dialog'
import GlobalDictionariesSection from '@/components/plugins/spelling-and-grammar/dictionary-settings/global-dictionaries-dialog'
import SpellingSettings from '@/components/plugins/spelling-and-grammar/dictionary-settings/spelling-settings-dialog'

interface DictionaryConfigPanelProps {
  onOpenLibrary: () => void
}

export default function DictionaryConfigPanel({
  onOpenLibrary,
}: DictionaryConfigPanelProps) {
  const [installerOpen, setInstallerOpen] = useState(false)

  return (
    <div className="max-h-[65vh] overflow-scroll">
      <div className="flex flex-col gap-3">
        <p className="text-muted-foreground text-xs">
          Configure which dictionaries are active for this script and where "Add
          to Dictionary" sends new words.
        </p>
        <LanguagesSection onOpenInstaller={() => setInstallerOpen(true)} />
        <ProjectDictionarySection />
        <GlobalDictionariesSection onOpenLibrary={onOpenLibrary} />
        <SpellingSettings />
      </div>
      <LanguageInstallerDialog
        open={installerOpen}
        onOpenChange={setInstallerOpen}
      />
    </div>
  )
}
