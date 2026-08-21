import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useEditorStore } from '@/stores/editorStore'
import { useProjectStore } from '@/stores/projectStore'
import { useActivityBarStore } from '@/stores/activity-bar-store'
import { GraphView } from './GraphView'
import { ENTITY_KIND_COLORS, ENTITY_KIND_LABELS, ENTITY_KIND_ORDER } from './graphConstants'

/** Global knowledge graph — characters, [items], scene locations, and
 *  manually-added "other" entities, connected by manually-authored edges.
 *  A full main-tab screen (not a sidebar panel): the force-directed canvas
 *  benefits from the extra room, same reasoning as Map/Beats/Stats. */
const GraphScreen = () => {
  const addOtherEntity = useEditorStore((s) => s.addOtherEntity)
  const setSelectedCharacter = useEditorStore((s) => s.setSelectedCharacter)
  const setActiveView = useActivityBarStore((s) => s.setActiveView)
  const currentScriptId = useProjectStore((s) => s.currentDocId)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    const name = newName.trim()
    if (!name) return
    addOtherEntity(name)
    setNewName('')
    setAddOpen(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center py-2 px-4 border-b border-(--fd-border) bg-(--fd-navigator-bg) shrink-0 gap-4">
        <span className="font-semibold text-xs uppercase tracking-[0.5px] text-(--fd-text-muted)">
          Graph
        </span>

        <div className="flex items-center gap-2.5 flex-wrap">
          {ENTITY_KIND_ORDER.map((kind) => (
            <span key={kind} className="flex items-center gap-1 text-[10px] text-(--fd-text-muted)">
              <span
                className="inline-block size-2 rounded-full"
                style={{ backgroundColor: ENTITY_KIND_COLORS[kind] }}
              />
              {ENTITY_KIND_LABELS[kind]}
            </span>
          ))}
        </div>

        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger
            render={<Button variant="ghost" size="sm" className="ml-auto px-2 h-7" />}
          >
            <Plus className="size-3.5" />
            Add Entity
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.3px] text-(--fd-text-muted) mb-1">
              New entity name
            </label>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
              }}
              placeholder="e.g. The Silver Hand"
              className="text-xs mb-2"
            />
            <Button size="sm" className="w-full" onClick={handleAdd} disabled={!newName.trim()}>
              Add
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      <GraphView
        scriptId={currentScriptId || undefined}
        onSelectCharacter={(name) => {
          setActiveView('characters')
          setSelectedCharacter(name)
        }}
      />
    </div>
  )
}

export default GraphScreen
