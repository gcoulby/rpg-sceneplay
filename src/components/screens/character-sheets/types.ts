export type ModuleType =
  | 'core-block'
  | 'custom-stats'
  | 'tracker'
  | 'charges'
  | 'skills'
  | 'custom-buttons'
  | 'gear'
  | 'conditions'
  | 'notes'
  | 'list'

export interface SheetModule<TConfig = unknown, TValues = unknown> {
  id: string
  type: ModuleType
  /** Display heading, and the name formula fields reference this module by. */
  label: string
  config: TConfig
  values: TValues
}

export interface SheetTab {
  id: string
  label: string
  modules: SheetModule[]
}

export interface SheetOptions {
  name: string
  /** Which template's presentation this sheet currently follows, if any. */
  themeId: string | null
  /** Order to render moduleLayout.tabs in; ids not listed render after, in
   *  their existing order. */
  tabOrder: string[]
}

export interface CharacterSheet {
  id: string
  name: string
  /** Which premade template this was built from, if any. */
  templateId: string | null
  /** Reverse reference to the linked character's uppercase name. A sheet may
   *  be linked to at most one character at a time. */
  characterName: string | null
  moduleLayout: {
    tabs: SheetTab[]
  }
  options: SheetOptions
  createdAt: string
  updatedAt: string
}

/** A premade starting point. Shape mirrors CharacterSheet minus the record
 *  identity/link fields — "start from template" clones moduleLayout into a
 *  brand new Sheet via the same cloning path a user duplicating their own
 *  sheet would use. */
export interface SheetTemplate {
  id: string
  name: string
  description: string
  moduleLayout: {
    tabs: SheetTab[]
  }
}
