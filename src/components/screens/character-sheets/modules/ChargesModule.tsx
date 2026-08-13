import React from 'react'
import { BatteryCharging } from 'lucide-react'
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
> = ({ module, layout, onChangeLabel, onChangeValues, onChangeLayout, onDelete, onMoveUp, onMoveDown }) => (
  <ModuleCard
    label={module.label}
    icon={BatteryCharging}
    layout={layout}
    onChangeLabel={onChangeLabel}
    onChangeLayout={onChangeLayout}
    onDelete={onDelete}
    onMoveUp={onMoveUp}
    onMoveDown={onMoveDown}
  >
    <PipRow
      current={module.values.current}
      max={module.values.max}
      onChange={onChangeValues}
    />
  </ModuleCard>
)

export default ChargesModule
