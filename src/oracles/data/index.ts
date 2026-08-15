import type { OracleSource, OracleCollection, OracleCombo } from '../types'
import ironsworn from './ironsworn.json'
import starforged from './starforged.json'
import delve from './delve.json'

interface BundledPackage {
  source: OracleSource
  collections: OracleCollection[]
  combos: OracleCombo[]
}

const PACKAGES = [ironsworn, starforged, delve] as unknown as BundledPackage[]

export const BUNDLED_ORACLE_SOURCES: OracleSource[] = PACKAGES.map(
  (p) => p.source,
)

export const BUNDLED_ORACLE_COLLECTIONS: OracleCollection[] = PACKAGES.flatMap(
  (p) => p.collections,
)

export const BUNDLED_ORACLE_COMBOS: OracleCombo[] = PACKAGES.flatMap(
  (p) => p.combos,
)
