import React from 'react'
import { Activity } from 'lucide-react'
import TrackerBar from './shared/TrackerBar'
import ModuleCard from './shared/ModuleCard'
import type { ModuleComponentProps } from './moduleProps'

export interface TrackerConfig {
  color?: string
}

export interface TrackerValues {
  current: number
  max: number
}

export const defaultTrackerConfig: TrackerConfig = {}
export const defaultTrackerValues: TrackerValues = { current: 10, max: 10 }

const TrackerModule: React.FC<
  ModuleComponentProps<TrackerConfig, TrackerValues>
> = ({ module, layout, onChangeLabel, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => (
  <ModuleCard
    label={module.label}
    icon={Activity}
    layout={layout}
    onChangeLabel={onChangeLabel}
    onChangeLayout={onChangeLayout}
    onDelete={onDelete}
    onMoveUp={onMoveUp}
    onMoveDown={onMoveDown}
  >
    <TrackerBar
      current={module.values.current}
      max={module.values.max}
      onChange={onChangeValues}
    />
  </ModuleCard>
)

export default TrackerModule
