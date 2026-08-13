import React from 'react'
import {
  IdCard,
  Sparkles,
  Activity,
  BatteryCharging,
  Target,
  Dices,
  Backpack,
  AlertTriangle,
  NotebookText,
  ListChecks,
  type LucideIcon,
} from 'lucide-react'
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
  icon: LucideIcon
  defaultConfig: unknown
  defaultValues: unknown
  Component: React.FC<ModuleComponentProps<any, any>>
}

export const MODULE_REGISTRY: Record<ModuleType, ModuleDefinition> = {
  'core-block': {
    label: 'Core Block',
    icon: IdCard,
    defaultConfig: defaultCoreBlockConfig,
    defaultValues: defaultCoreBlockValues,
    Component: CoreBlockModule,
  },
  'custom-stats': {
    label: 'Custom Stats',
    icon: Sparkles,
    defaultConfig: defaultCustomStatsConfig,
    defaultValues: defaultCustomStatsValues,
    Component: CustomStatsModule,
  },
  tracker: {
    label: 'Tracker',
    icon: Activity,
    defaultConfig: defaultTrackerConfig,
    defaultValues: defaultTrackerValues,
    Component: TrackerModule,
  },
  charges: {
    label: 'Charges',
    icon: BatteryCharging,
    defaultConfig: defaultChargesConfig,
    defaultValues: defaultChargesValues,
    Component: ChargesModule,
  },
  skills: {
    label: 'Skills',
    icon: Target,
    defaultConfig: defaultSkillsConfig,
    defaultValues: defaultSkillsValues,
    Component: SkillsModule,
  },
  'custom-buttons': {
    label: 'Custom Buttons',
    icon: Dices,
    defaultConfig: defaultCustomButtonsConfig,
    defaultValues: defaultCustomButtonsValues,
    Component: CustomButtonsModule,
  },
  gear: {
    label: 'Gear/Inventory',
    icon: Backpack,
    defaultConfig: defaultGearConfig,
    defaultValues: defaultGearValues,
    Component: GearModule,
  },
  conditions: {
    label: 'Conditions',
    icon: AlertTriangle,
    defaultConfig: defaultConditionsConfig,
    defaultValues: defaultConditionsValues,
    Component: ConditionsModule,
  },
  notes: {
    label: 'Notes',
    icon: NotebookText,
    defaultConfig: defaultNotesConfig,
    defaultValues: defaultNotesValues,
    Component: NotesModule,
  },
  list: {
    label: 'List',
    icon: ListChecks,
    defaultConfig: defaultListConfig,
    defaultValues: defaultListValues,
    Component: ListModule,
  },
}

export const MODULE_TYPES = Object.keys(MODULE_REGISTRY) as ModuleType[]
