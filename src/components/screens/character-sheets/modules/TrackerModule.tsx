import React from 'react'
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
> = ({ module, onChangeLabel, onChangeValues, onDelete }) => (
  <ModuleCard label={module.label} onChangeLabel={onChangeLabel} onDelete={onDelete}>
    <TrackerBar
      current={module.values.current}
      max={module.values.max}
      onChange={onChangeValues}
    />
  </ModuleCard>
)

export default TrackerModule
