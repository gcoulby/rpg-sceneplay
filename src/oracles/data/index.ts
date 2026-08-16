import type {
  OracleSource,
  OracleCollection,
  OracleCombo,
  BundledPackage,
} from '../types'
import ironsworn from './ironsworn.json'
import starforged from './starforged.json'
import delve from './delve.json'

const PACKAGES = [
  ironsworn,
  starforged,
  delve,
] as unknown as Array<BundledPackage>

export const BUNDLED_ORACLE_SOURCES: OracleSource[] = PACKAGES.map(
  (p) => p.source,
)

export const BUNDLED_ORACLE_COLLECTIONS: OracleCollection[] = PACKAGES.flatMap(
  (p) => p.collections,
)

export const BUNDLED_ORACLE_COMBOS: OracleCombo[] = PACKAGES.flatMap(
  (p) => p.combos,
)
