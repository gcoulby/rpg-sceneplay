import { formatDiceSpec } from './rollTable'
import type { RollValue } from './rollTypes'

/** The generated content itself — what a writer would lift into prose. */
export function formatRollResult(value: RollValue): string {
  switch (value.kind) {
    case 'fate':
      return value.result
    case 'oracle-table':
      return value.rowText
    case 'oracle-combo':
      return value.renderedText
    case 'dice':
      return String(value.total)
    case 'storycubes':
      return value.icons.join(', ')
    case 'manual':
      return value.value
  }
}

/** The underlying numbers/dice, for session-log/audit purposes. */
export function formatRawRoll(value: RollValue): string {
  switch (value.kind) {
    case 'fate':
      return `${value.roll} vs ${value.target}${value.exceptional ? ' (exceptional)' : ''}`
    case 'oracle-table': {
      const dice = formatDiceSpec(value.dice)
      const base = `${dice}: ${value.rawRoll}`
      const withModifier =
        value.modifier !== 0
          ? `${base} + ${value.modifier} → ${value.lookupValue}`
          : base
      return value.isMatch ? `${withModifier} (match)` : withModifier
    }
    case 'oracle-combo':
      return value.parts.map((p) => `${p.tableName}: ${p.rawRoll}`).join(', ')
    case 'dice':
      return `${value.expression} → ${value.rolls.join(', ')} = ${value.total}`
    case 'storycubes':
      return value.icons.join(', ')
    case 'manual':
      return value.value
  }
}
