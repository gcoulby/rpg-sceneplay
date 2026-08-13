import React from 'react'
import PipRow from './shared/PipRow'
import ModuleCard from './shared/ModuleCard'
import type { ModuleComponentProps } from './moduleProps'

export interface ChargesConfig {
  color?: string
}

export interface ChargesValues {
  current: number
  max: number
}

export const defaultChargesConfig: ChargesConfig = {}
export const defaultChargesValues: ChargesValues = { current: 3, max: 3 }

const ChargesModule: React.FC<
  ModuleComponentProps<ChargesConfig, ChargesValues>
> = ({ module, onChangeLabel, onChangeValues, onDelete }) => (
  <ModuleCard label={module.label} onChangeLabel={onChangeLabel} onDelete={onDelete}>
    <PipRow
      current={module.values.current}
      max={module.values.max}
      onChange={onChangeValues}
    />
  </ModuleCard>
)

export default ChargesModule
