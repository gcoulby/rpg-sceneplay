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
  UserRound,
  BookOpen,
  Tags,
  Gauge,
  ToggleLeft,
  CircleDot,
  type LucideIcon,
} from 'lucide-react'
import type { ModuleLayout, ModuleType } from '../types'
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
import CharacterDetailsModule, {
  defaultCharacterDetailsConfig,
  defaultCharacterDetailsValues,
} from './CharacterDetailsModule'
import BackstoryModule, {
  defaultBackstoryConfig,
  defaultBackstoryValues,
} from './BackstoryModule'
import TraitsModule, { defaultTraitsConfig, defaultTraitsValues } from './TraitsModule'
import ResourcesModule, {
  defaultResourcesConfig,
  defaultResourcesValues,
} from './ResourcesModule'
import TogglesModule, { defaultTogglesConfig, defaultTogglesValues } from './TogglesModule'
import ClockModule, { defaultClockConfig, defaultClockValues } from './ClockModule'

interface ModuleDefinition {
  label: string
  icon: LucideIcon
  defaultConfig: unknown
  defaultValues: unknown
  defaultLayout: ModuleLayout
  Component: React.FC<ModuleComponentProps<any, any>>
}

export const MODULE_REGISTRY: Record<ModuleType, ModuleDefinition> = {
  'core-block': {
    label: 'Core Block',
    icon: IdCard,
    defaultConfig: defaultCoreBlockConfig,
    defaultValues: defaultCoreBlockValues,
    defaultLayout: { w: 2, h: 3 },
    Component: CoreBlockModule,
  },
  'custom-stats': {
    label: 'Custom Stats',
    icon: Sparkles,
    defaultConfig: defaultCustomStatsConfig,
    defaultValues: defaultCustomStatsValues,
    defaultLayout: { w: 2, h: 2 },
    Component: CustomStatsModule,
  },
  tracker: {
    label: 'Tracker',
    icon: Activity,
    defaultConfig: defaultTrackerConfig,
    defaultValues: defaultTrackerValues,
    defaultLayout: { w: 2, h: 1 },
    Component: TrackerModule,
  },
  charges: {
    label: 'Charges',
    icon: BatteryCharging,
    defaultConfig: defaultChargesConfig,
    defaultValues: defaultChargesValues,
    defaultLayout: { w: 2, h: 1 },
    Component: ChargesModule,
  },
  skills: {
    label: 'Skills',
    icon: Target,
    defaultConfig: defaultSkillsConfig,
    defaultValues: defaultSkillsValues,
    defaultLayout: { w: 2, h: 2 },
    Component: SkillsModule,
  },
  'custom-buttons': {
    label: 'Custom Buttons',
    icon: Dices,
    defaultConfig: defaultCustomButtonsConfig,
    defaultValues: defaultCustomButtonsValues,
    defaultLayout: { w: 2, h: 2 },
    Component: CustomButtonsModule,
  },
  gear: {
    label: 'Gear/Inventory',
    icon: Backpack,
    defaultConfig: defaultGearConfig,
    defaultValues: defaultGearValues,
    defaultLayout: { w: 2, h: 3 },
    Component: GearModule,
  },
  conditions: {
    label: 'Conditions',
    icon: AlertTriangle,
    defaultConfig: defaultConditionsConfig,
    defaultValues: defaultConditionsValues,
    defaultLayout: { w: 2, h: 2 },
    Component: ConditionsModule,
  },
  notes: {
    label: 'Notes',
    icon: NotebookText,
    defaultConfig: defaultNotesConfig,
    defaultValues: defaultNotesValues,
    defaultLayout: { w: 2, h: 2 },
    Component: NotesModule,
  },
  list: {
    label: 'List',
    icon: ListChecks,
    defaultConfig: defaultListConfig,
    defaultValues: defaultListValues,
    defaultLayout: { w: 2, h: 2 },
    Component: ListModule,
  },
  'character-details': {
    label: 'Character Details',
    icon: UserRound,
    defaultConfig: defaultCharacterDetailsConfig,
    defaultValues: defaultCharacterDetailsValues,
    defaultLayout: { w: 2, h: 2 },
    Component: CharacterDetailsModule,
  },
  backstory: {
    label: 'Backstory',
    icon: BookOpen,
    defaultConfig: defaultBackstoryConfig,
    defaultValues: defaultBackstoryValues,
    defaultLayout: { w: 2, h: 3 },
    Component: BackstoryModule,
  },
  traits: {
    label: 'Traits',
    icon: Tags,
    defaultConfig: defaultTraitsConfig,
    defaultValues: defaultTraitsValues,
    defaultLayout: { w: 2, h: 2 },
    Component: TraitsModule,
  },
  resources: {
    label: 'Resources',
    icon: Gauge,
    defaultConfig: defaultResourcesConfig,
    defaultValues: defaultResourcesValues,
    defaultLayout: { w: 2, h: 2 },
    Component: ResourcesModule,
  },
  toggles: {
    label: 'Toggles',
    icon: ToggleLeft,
    defaultConfig: defaultTogglesConfig,
    defaultValues: defaultTogglesValues,
    defaultLayout: { w: 2, h: 2 },
    Component: TogglesModule,
  },
  clock: {
    label: 'Clock',
    icon: CircleDot,
    defaultConfig: defaultClockConfig,
    defaultValues: defaultClockValues,
    defaultLayout: { w: 2, h: 2 },
    Component: ClockModule,
  },
}

export const MODULE_TYPES = Object.keys(MODULE_REGISTRY) as ModuleType[]
