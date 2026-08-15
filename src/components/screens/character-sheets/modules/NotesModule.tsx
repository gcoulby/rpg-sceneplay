import React from 'react'
import { NotebookText } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import ModuleCard from './shared/ModuleCard'
import type { ModuleComponentProps } from './moduleProps'

export interface NotesConfig {}

export interface NotesValues {
  text: string
}

export const defaultNotesConfig: NotesConfig = {}
export const defaultNotesValues: NotesValues = { text: '' }

const NotesModule: React.FC<
  ModuleComponentProps<NotesConfig, NotesValues>
> = ({ module, layout, onChangeLabel, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => (
  <ModuleCard
    label={module.label}
    icon={NotebookText}
    layout={layout}
    onChangeLabel={onChangeLabel}
    onChangeLayout={onChangeLayout}
    onDelete={onDelete}
    onMoveUp={onMoveUp}
    onMoveDown={onMoveDown}
  >
    <Textarea
      value={module.values.text}
      onChange={(e) => onChangeValues({ text: e.target.value })}
      className="min-h-24 text-xs leading-relaxed"
      placeholder="Notes..."
    />
  </ModuleCard>
)

export default NotesModule
