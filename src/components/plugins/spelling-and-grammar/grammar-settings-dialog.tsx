import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/stores/editorStore'
import {
  RETEXT_CATEGORIES,
  RETEXT_CATEGORY_META,
} from '@/editor/grammar/retextProvider'
import {
  HARPER_CATEGORIES,
  HARPER_CATEGORY_META,
} from '@/editor/grammar/harperProvider'
import DictionaryLibrary from './dictionary-settings/dictionary-library-dialog'
import DictionaryConfigPanel from './dictionary-settings/dictionary-config-dialog'
import type { RuleMeta, RuleSection } from '@/types'
import { RuleList } from './dictionary-settings/rule-list'

interface GrammarRulesPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GRAMMAR_SECTION: RuleSection = {
  blurb:
    'Real grammar mistakes: agreement, tense, articles, capitalization, repeated words.',
  ids: HARPER_CATEGORIES,
  meta: HARPER_CATEGORY_META as RuleMeta,
}

const STYLE_SECTION: RuleSection = {
  blurb:
    'Wordiness and tone suggestions (passive voice, weak intensifiers, "in order to").',
  ids: RETEXT_CATEGORIES,
  meta: RETEXT_CATEGORY_META as RuleMeta,
}

type TabId = 'grammar' | 'style' | 'dictionaries'
const TABS: { id: TabId; label: string }[] = [
  { id: 'grammar', label: 'Grammar' },
  { id: 'style', label: 'Style' },
  { id: 'dictionaries', label: 'Dictionaries' },
]

export default function GrammarRulesPanel({
  open,
  onOpenChange,
}: GrammarRulesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('grammar')
  const dictionaryLibraryOpen = useEditorStore((s) => s.dictionaryLibraryOpen)
  const setDictionaryLibraryOpen = useEditorStore(
    (s) => s.setDictionaryLibraryOpen,
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Grammar & Spelling Settings</DialogTitle>
          </DialogHeader>

          <div className="flex gap-1 -mx-6 px-6 border-b">
            {TABS.map((t) => {
              const active = t.id === activeTab
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-2 text-[13px] -mb-px border-b-2 cursor-pointer ${
                    active
                      ? 'font-semibold text-foreground border-primary'
                      : 'font-normal text-muted-foreground border-transparent'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
            {activeTab === 'grammar' && <RuleList section={GRAMMAR_SECTION} />}
            {activeTab === 'style' && <RuleList section={STYLE_SECTION} />}
            {activeTab === 'dictionaries' && (
              <DictionaryConfigPanel
                onOpenLibrary={() => setDictionaryLibraryOpen(true)}
              />
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DictionaryLibrary
        open={dictionaryLibraryOpen}
        onOpenChange={setDictionaryLibraryOpen}
      />
    </>
  )
}
