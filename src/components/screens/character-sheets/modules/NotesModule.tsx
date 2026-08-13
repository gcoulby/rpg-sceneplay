import React from 'react'
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
> = ({ module, onChangeLabel, onChangeValues, onDelete }) => (
  <ModuleCard label={module.label} onChangeLabel={onChangeLabel} onDelete={onDelete}>
    <Textarea
      value={module.values.text}
      onChange={(e) => onChangeValues({ text: e.target.value })}
      className="min-h-24 text-xs"
      placeholder="Notes..."
    />
  </ModuleCard>
)

export default NotesModule
