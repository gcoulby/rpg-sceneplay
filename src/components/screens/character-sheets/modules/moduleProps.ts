import type { SheetModule } from '../types'

/** Common prop shape every module renderer implements. `valueMap` is the
 *  sheet-wide formula lookup (see formula/buildValueMap.ts), only consumed
 *  by modules with formula fields (Custom Buttons). */
export interface ModuleComponentProps<TConfig = unknown, TValues = unknown> {
  module: SheetModule<TConfig, TValues>
  valueMap: Record<string, number>
  onChangeLabel: (label: string) => void
  onChangeConfig: (config: TConfig) => void
  onChangeValues: (values: TValues) => void
  onDelete: () => void
  onMoveUp: (() => void) | null
  onMoveDown: (() => void) | null
}
