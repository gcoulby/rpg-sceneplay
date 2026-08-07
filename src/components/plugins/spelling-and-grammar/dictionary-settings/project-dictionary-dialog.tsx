import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditorStore } from '@/stores/editorStore'
import { spellChecker, PROJECT_DICT_TARGET } from '@/editor/spellchecker'
import { useSpellCheckerVersion } from '@/hooks/useSpellCheckerVersion'
import AddTargetToggle from '@/components/add-target-toggle'
import { Label } from '@/components/ui/label'

export default function ProjectDictionarySection() {
  useSpellCheckerVersion()
  const addTargets = useEditorStore((s) => s.addTargets)
  const setAddTargets = useEditorStore((s) => s.setAddTargets)
  const projectWords = spellChecker.getProjectWords()
  const projectEnabled = spellChecker.isProjectDictionaryEnabled()
  const [newWord, setNewWord] = useState('')
  const [expanded, setExpanded] = useState(false)

  const handleAdd = () => {
    const w = newWord.trim()
    if (!w) return
    spellChecker.addToProjectDictionary(w)
    setNewWord('')
  }

  const toggleEnabled = (on: boolean) => {
    spellChecker.setProjectDictionaryEnabled(on)
  }

  const toggleAddTarget = () => {
    const has = addTargets.includes(PROJECT_DICT_TARGET)
    const next = has
      ? addTargets.filter((t) => t !== PROJECT_DICT_TARGET)
      : [...addTargets, PROJECT_DICT_TARGET]
    setAddTargets(next)
  }

  const isAddTarget = addTargets.includes(PROJECT_DICT_TARGET)

  return (
    <div className="p-2.5 border rounded-md">
      <div className="flex items-center gap-2">
        <Label className="flex flex-1 items-center gap-2 cursor-pointer">
          <Input
            type="checkbox"
            className="w-4"
            checked={projectEnabled}
            onChange={(e) => toggleEnabled(e.target.checked)}
          />
          <div className="flex-1">
            <div className="mb-1.5 font-semibold text-[13px]">
              Project dictionary
            </div>
            <div className="text-muted-foreground text-xs">
              {projectEnabled
                ? projectWords.length === 0
                  ? 'No words yet — anything you "Add to Dictionary" goes here by default.'
                  : `${projectWords.length} word${projectWords.length === 1 ? '' : 's'}. Saved with this script.`
                : 'Disabled for this project — checks skip these words and "Add to Dictionary" routes to globals only.'}
            </div>
          </div>
        </Label>
        <AddTargetToggle
          active={isAddTarget && projectEnabled}
          disabled={!projectEnabled}
          onToggle={toggleAddTarget}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => setExpanded((x) => !x)}
        >
          {expanded ? 'Hide' : 'Edit words…'}
        </Button>
      </div>
      {expanded && (
        <div className="flex flex-col gap-2 mt-2.5">
          <div className="flex gap-1.5">
            <Input
              type="text"
              placeholder="Add a word"
              className="h-8 text-sm"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
              }}
              disabled={!projectEnabled}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAdd}
              disabled={!projectEnabled}
            >
              Add
            </Button>
          </div>
          {projectWords.length > 0 && (
            <div className="p-1 border rounded max-h-50 overflow-y-auto">
              {projectWords.map((w) => (
                <div
                  key={w}
                  className="flex items-center px-2 py-1 text-[13px]"
                >
                  <span className="flex-1">{w}</span>
                  <Button
                    type="button"
                    onClick={() => spellChecker.removeFromProjectDictionary(w)}
                    title="Remove"
                    className="cursor-pointer"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
