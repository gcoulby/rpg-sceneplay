#!/usr/bin/env node
/**
 * Codegen: transform the official Datasworn JSON packages into this app's
 * OracleSource/OracleCollection/OracleTable/OracleCombo shape and write the
 * result as static JSON under src/oracles/data. Re-run manually
 * (`pnpm import:oracles`) when the @datasworn/* devDependencies are
 * updated — this is not part of the app build.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dataDir = path.join(rootDir, 'src/oracles/data')

const PACKAGES = [
  {
    jsonPath:
      'node_modules/@datasworn/ironsworn-classic/json/classic.json',
    sourceId: 'ironsworn-core',
    sourceName: 'Ironsworn Core',
    outFile: 'ironsworn.json',
  },
  {
    jsonPath: 'node_modules/@datasworn/starforged/json/starforged.json',
    sourceId: 'ironsworn-starforged',
    sourceName: 'Ironsworn: Starforged',
    outFile: 'starforged.json',
  },
  {
    jsonPath:
      'node_modules/@datasworn/ironsworn-classic-delve/json/delve.json',
    sourceId: 'ironsworn-delve',
    sourceName: 'Ironsworn: Delve',
    outFile: 'delve.json',
  },
]

const DATASWORN_URL = 'https://github.com/rsek/datasworn'

// Datasworn doesn't carry an explicit "these tables are rolled together"
// signal, so known pairings are curated here by collection id + child keys.
const KNOWN_COMBOS = [
  {
    collectionId: 'classic/collections/oracles/action_and_theme',
    name: 'Action/Theme',
    parts: ['action', 'theme'],
  },
  {
    collectionId: 'starforged/collections/oracles/core',
    name: 'Action/Theme',
    parts: ['action', 'theme'],
  },
  {
    collectionId: 'starforged/collections/oracles/core',
    name: 'Descriptor/Focus',
    parts: ['descriptor', 'focus'],
  },
  {
    collectionId: 'delve/collections/oracles/feature',
    name: 'Aspect/Focus',
    parts: ['aspect', 'focus'],
  },
  {
    collectionId: 'starforged/collections/oracles/space/sector_name',
    name: 'Sector Name',
    parts: ['prefix', 'suffix'],
    template: '{0}{1}',
  },
  {
    collectionId: 'classic/collections/oracles/settlement/quick_name',
    name: 'Quick Settlement Name Generator',
    parts: ['prefix', 'suffix'],
    template: '{0}{1}',
  },
]

/** Maps a Datasworn dice string ("1d100", "1d66", "2d6", ...) onto a DiceSpec. */
function mapDiceSpec(notation) {
  const match = /^(\d+)d(\d+)$/i.exec(notation ?? '1d100')
  if (!match) return { kind: 'single', sides: 100 }
  const count = parseInt(match[1], 10)
  const sides = match[2]

  if (count === 1) {
    // A sides string of repeated identical digits (e.g. "66", "666") encodes
    // positional dice rolled together (d66 = two d6s read as tens/units).
    // "100" is not repeated-digit, so it stays a single percentile roll.
    const isRepeatedDigits = sides.length > 1 && [...sides].every((d) => d === sides[0])
    if (isRepeatedDigits) {
      const die = parseInt(sides[0], 10)
      return { kind: 'positional', dice: Array(sides.length).fill(die) }
    }
    return { kind: 'single', sides: parseInt(sides, 10) }
  }

  return { kind: 'sum', dice: Array(count).fill(parseInt(sides, 10)) }
}

function mapRow(row) {
  if (row.min == null || row.max == null) return null
  const mapped = { min: row.min, max: row.max }
  if (row.text !== undefined) mapped.text = row.text
  const cascadeRef = (row.oracle_rolls ?? []).find((r) => r.oracle)?.oracle
  if (cascadeRef) mapped.tableRef = cascadeRef
  return mapped
}

function mapTable(node, sourceId) {
  return {
    id: node._id,
    name: node.name,
    sourceId,
    dice: mapDiceSpec(node.dice),
    rows: (node.rows ?? []).map(mapRow).filter((r) => r !== null),
  }
}

function mapCollection(node, sourceId, parentId) {
  const children = []
  for (const child of Object.values(node.contents ?? {})) {
    children.push(
      child.type === 'oracle_collection'
        ? mapCollection(child, sourceId, node._id)
        : mapTable(child, sourceId),
    )
  }
  for (const child of Object.values(node.collections ?? {})) {
    children.push(mapCollection(child, sourceId, node._id))
  }
  return {
    id: node._id,
    name: node.name,
    sourceId,
    ...(parentId ? { parentId } : {}),
    children,
  }
}

/** Depth-first search for a table id anywhere under `collections`, by child key. */
function findTableId(collections, collectionId, childKey) {
  for (const collection of collections) {
    if (collection.id === collectionId) {
      const match = collection.children.find(
        (c) => c.id.endsWith(`/${childKey}`) && 'rows' in c,
      )
      if (match) return match.id
    }
    const nested = findTableId(
      collection.children.filter((c) => 'children' in c),
      collectionId,
      childKey,
    )
    if (nested) return nested
  }
  return undefined
}

function buildCombos(collections, sourceId) {
  const combos = []
  for (const combo of KNOWN_COMBOS) {
    const parts = combo.parts.map((key) =>
      findTableId(collections, combo.collectionId, key),
    )
    if (parts.every(Boolean)) {
      combos.push({
        id: `${combo.collectionId}#${combo.parts.join('-')}`,
        name: combo.name,
        sourceId,
        parts,
        template: combo.template ?? parts.map((_, i) => `{${i}}`).join(' '),
      })
    }
  }
  return combos
}

for (const pkg of PACKAGES) {
  const data = JSON.parse(
    readFileSync(path.join(rootDir, pkg.jsonPath), 'utf8'),
  )

  const source = {
    id: pkg.sourceId,
    name: pkg.sourceName,
    author: 'Shawn Tomkin',
    license: 'CC-BY-4.0',
    url: DATASWORN_URL,
  }

  const collections = Object.values(data.oracles ?? {}).map((node) =>
    mapCollection(node, pkg.sourceId),
  )
  const combos = buildCombos(collections, pkg.sourceId)

  const outPath = path.join(dataDir, pkg.outFile)
  writeFileSync(
    outPath,
    JSON.stringify({ source, collections, combos }, null, 2) + '\n',
  )
  console.log(`wrote ${path.relative(rootDir, outPath)}`)
}
