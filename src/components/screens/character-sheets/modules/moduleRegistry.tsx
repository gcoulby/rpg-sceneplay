import React from 'react'
import type { ModuleType } from '../types'
import type { ModuleComponentProps } from './moduleProps'
import CoreBlockModule, {
  defaultCoreBlockConfig,
  defaultCoreBlockValues,
} from './CoreBlockModule'
import CustomStatsModule, {
  defaultCustomStatsConfig,
  defaultCustomStatsValues,
} from './CustomStatsModule'
import TrackerModule, {
  defaultTrackerConfig,
  defaultTrackerValues,
} from './TrackerModule'
import ChargesModule, {
  defaultChargesConfig,
  defaultChargesValues,
} from './ChargesModule'
import SkillsModule, {
  defaultSkillsConfig,
  defaultSkillsValues,
} from './SkillsModule'
import CustomButtonsModule, {
  defaultCustomButtonsConfig,
  defaultCustomButtonsValues,
} from './CustomButtonsModule'
import GearModule, { defaultGearConfig, defaultGearValues } from './GearModule'
import ConditionsModule, {
  defaultConditionsConfig,
  defaultConditionsValues,
} from './ConditionsModule'
import NotesModule, { defaultNotesConfig, defaultNotesValues } from './NotesModule'
import ListModule, { defaultListConfig, defaultListValues } from './ListModule'

interface ModuleDefinition {
  label: string
  defaultConfig: unknown
  defaultValues: unknown
  Component: React.FC<ModuleComponentProps<any, any>>
}

export const MODULE_REGISTRY: Record<ModuleType, ModuleDefinition> = {
  'core-block': {
    label: 'Core Block',
    defaultConfig: defaultCoreBlockConfig,
    defaultValues: defaultCoreBlockValues,
    Component: CoreBlockModule,
  },
  'custom-stats': {
    label: 'Custom Stats',
    defaultConfig: defaultCustomStatsConfig,
    defaultValues: defaultCustomStatsValues,
    Component: CustomStatsModule,
  },
  tracker: {
    label: 'Tracker',
    defaultConfig: defaultTrackerConfig,
    defaultValues: defaultTrackerValues,
    Component: TrackerModule,
  },
  charges: {
    label: 'Charges',
    defaultConfig: defaultChargesConfig,
    defaultValues: defaultChargesValues,
    Component: ChargesModule,
  },
  skills: {
    label: 'Skills',
    defaultConfig: defaultSkillsConfig,
    defaultValues: defaultSkillsValues,
    Component: SkillsModule,
  },
  'custom-buttons': {
    label: 'Custom Buttons',
    defaultConfig: defaultCustomButtonsConfig,
    defaultValues: defaultCustomButtonsValues,
    Component: CustomButtonsModule,
  },
  gear: {
    label: 'Gear/Inventory',
    defaultConfig: defaultGearConfig,
    defaultValues: defaultGearValues,
    Component: GearModule,
  },
  conditions: {
    label: 'Conditions',
    defaultConfig: defaultConditionsConfig,
    defaultValues: defaultConditionsValues,
    Component: ConditionsModule,
  },
  notes: {
    label: 'Notes',
    defaultConfig: defaultNotesConfig,
    defaultValues: defaultNotesValues,
    Component: NotesModule,
  },
  list: {
    label: 'List',
    defaultConfig: defaultListConfig,
    defaultValues: defaultListValues,
    Component: ListModule,
  },
}

export const MODULE_TYPES = Object.keys(MODULE_REGISTRY) as ModuleType[]
