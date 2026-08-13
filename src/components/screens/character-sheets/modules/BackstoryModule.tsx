import React from 'react'
import { BookOpen } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import ModuleCard from './shared/ModuleCard'
import type { ModuleComponentProps } from './moduleProps'

/** Same shape as Notes, kept as its own module type/icon/default label so a
 *  sheet can carry both — long-form backstory vs. running session notes. */
export interface BackstoryConfig {}

export interface BackstoryValues {
  text: string
}

export const defaultBackstoryConfig: BackstoryConfig = {}
export const defaultBackstoryValues: BackstoryValues = { text: '' }

const BackstoryModule: React.FC<
  ModuleComponentProps<BackstoryConfig, BackstoryValues>
> = ({ module, layout, onChangeLabel, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => (
  <ModuleCard
    label={module.label}
    icon={BookOpen}
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
      className="min-h-32 text-xs leading-relaxed"
      placeholder="Backstory..."
    />
  </ModuleCard>
)

export default BackstoryModule
