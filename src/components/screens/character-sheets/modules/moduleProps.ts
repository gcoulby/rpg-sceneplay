import type { ModuleLayout, SheetModule } from '../types'

/** Common prop shape every module renderer implements. `valueMap` is the
 *  sheet-wide formula lookup (see formula/buildValueMap.ts), only consumed
 *  by modules with formula fields (Custom Buttons). `layout` is resolved via
 *  getModuleLayout() by the caller so every renderer always receives a
 *  concrete {w,h}, even for sheets saved before sizing existed. */
export interface ModuleComponentProps<TConfig = unknown, TValues = unknown> {
  module: SheetModule<TConfig, TValues>
  valueMap: Record<string, number>
  layout: ModuleLayout
  onChangeLabel: (label: string) => void
  onChangeConfig: (config: TConfig) => void
  onChangeValues: (values: TValues) => void
  onChangeLayout: (layout: ModuleLayout) => void
  onDelete: () => void
  onMoveUp: (() => void) | null
  onMoveDown: (() => void) | null
}
