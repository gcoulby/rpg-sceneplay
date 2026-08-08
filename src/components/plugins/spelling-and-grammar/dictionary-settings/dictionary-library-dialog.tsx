import { useMemo, useRef, useState } from 'react'
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
import { ScrollArea } from '@/components/ui/scroll-area'

interface DictionaryLibraryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DictionaryLibrary({
  open,
  onOpenChange,
}: DictionaryLibraryProps) {
  const customDictionaries = useEditorStore((s) => s.customDictionaries)
  const createGlobalDictionary = useEditorStore((s) => s.createGlobalDictionary)
  const renameGlobalDictionary = useEditorStore((s) => s.renameGlobalDictionary)
  const deleteGlobalDictionary = useEditorStore((s) => s.deleteGlobalDictionary)
  const setGlobalDictionaryWords = useEditorStore(
    (s) => s.setGlobalDictionaryWords,
  )

  const names = useMemo(
    () => Object.keys(customDictionaries).sort(),
    [customDictionaries],
  )
  const [selectedRaw, setSelected] = useState<string | null>(null)
  const [newDictName, setNewDictName] = useState('')
  const [newWord, setNewWord] = useState('')
  const wordInputRef = useRef<HTMLInputElement>(null)

  // Derived at render time rather than synced via effect: falls back to the
  // first dictionary whenever the stored selection no longer exists (e.g.
  // after a delete) or hasn't been set yet.
  const selected =
    selectedRaw && customDictionaries[selectedRaw]
      ? selectedRaw
      : (names[0] ?? null)

  const handleCreate = () => {
    const name = newDictName.trim()
    if (!name) return
    if (customDictionaries[name]) return
    createGlobalDictionary(name)
    setNewDictName('')
    setSelected(name)
  }

  const handleRename = (oldName: string) => {
    const next = window.prompt('Rename dictionary', oldName)
    if (next === null) return
    const trimmed = next.trim()
    if (!trimmed || trimmed === oldName) return
    if (customDictionaries[trimmed]) {
      window.alert(`A dictionary named "${trimmed}" already exists.`)
      return
    }
    renameGlobalDictionary(oldName, trimmed)
    setSelected(trimmed)
  }

  const handleDelete = (name: string) => {
    if (!window.confirm(`Delete dictionary "${name}"? This cannot be undone.`))
      return
    deleteGlobalDictionary(name)
  }

  const handleAddWord = () => {
    if (!selected) return
    const word = newWord.trim()
    if (!word) return
    const current = customDictionaries[selected] ?? []
    if (current.some((w) => w.toLowerCase() === word.toLowerCase())) {
      setNewWord('')
      return
    }
    setGlobalDictionaryWords(selected, [...current, word])
    setNewWord('')
    wordInputRef.current?.focus()
  }

  const handleRemoveWord = (word: string) => {
    if (!selected) return
    const current = customDictionaries[selected] ?? []
    setGlobalDictionaryWords(
      selected,
      current.filter((w) => w !== word),
    )
  }

  const selectedWords = selected ? (customDictionaries[selected] ?? []) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col sm:max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Dictionary Library</DialogTitle>
        </DialogHeader>

        <ScrollArea className="rounded-md w-full max-h-[65vh]">
          <div className="flex flex-1 gap-3">
            {/* Left column: list of dictionaries */}
            <div className="flex flex-col flex-none pr-3 border-r w-55">
              <div className="mb-2 font-semibold text-xs">Dictionaries</div>
              <div className="flex gap-1.5 mb-2.5">
                <Input
                  type="text"
                  placeholder="New dictionary"
                  className="h-7 text-xs"
                  value={newDictName}
                  onChange={(e) => setNewDictName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate()
                  }}
                />
                <Button size="sm" variant="outline" onClick={handleCreate}>
                  Add
                </Button>
              </div>
              <div className="flex flex-col flex-1 gap-0.5 overflow-y-auto">
                {names.length === 0 && (
                  <div className="p-2 text-muted-foreground text-xs">
                    No dictionaries yet. Create one above.
                  </div>
                )}
                {names.map((name) => {
                  const active = name === selected
                  return (
                    <div
                      key={name}
                      onClick={() => setSelected(name)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[13px] cursor-pointer ${
                        active ? 'bg-primary/10' : 'hover:bg-muted'
                      }`}
                    >
                      <span className="flex-1 truncate">{name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {(customDictionaries[name] ?? []).length}
                      </span>
                    </div>
                  )
                })}
              </div>
              {selected && (
                <div className="flex gap-1.5 mt-2.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRename(selected)}
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-red-50 border-red-600 text-red-600"
                    onClick={() => handleDelete(selected)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {/* Right column: word list of selected dictionary */}
            <div className="flex flex-col flex-1 min-w-0">
              {!selected ? (
                <div className="p-4 text-muted-foreground text-sm">
                  Select or create a dictionary to manage its words.
                </div>
              ) : (
                <>
                  <div className="mb-2 font-semibold text-xs">
                    Words in “{selected}” ({selectedWords.length})
                  </div>
                  <div className="flex gap-1.5 mb-2.5">
                    <Input
                      ref={wordInputRef}
                      type="text"
                      placeholder="Add a word"
                      className="h-7 text-xs"
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddWord()
                      }}
                    />
                    <Button size="sm" variant="outline" onClick={handleAddWord}>
                      Add
                    </Button>
                  </div>
                  <div className="flex-1 p-1 border rounded min-h-0 overflow-y-auto">
                    {selectedWords.length === 0 ? (
                      <div className="p-2 text-muted-foreground text-xs">
                        No words yet.
                      </div>
                    ) : (
                      selectedWords.map((w) => (
                        <div
                          key={w}
                          className="flex items-center px-2 py-1 rounded text-[13px]"
                        >
                          <span className="flex-1">{w}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveWord(w)}
                            title="Remove"
                            className="bg-transparent px-1 border-none text-muted-foreground hover:text-foreground text-sm cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
