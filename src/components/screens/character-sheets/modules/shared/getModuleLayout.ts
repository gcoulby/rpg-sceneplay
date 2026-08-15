import type { ModuleLayout, SheetModule } from '../../types'
import { MODULE_REGISTRY } from '../moduleRegistry'

/** Sheets saved before module sizing existed have no `layout` field — fall
 *  back to the module type's registry default rather than assume 1x1. */
export function getModuleLayout(module: SheetModule): ModuleLayout {
  return module.layout ?? MODULE_REGISTRY[module.type].defaultLayout
}
