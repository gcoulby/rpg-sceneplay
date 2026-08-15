/**
 * STUB dice roller.
 *
 * RPG Sceneplay's real dice/oracle system does not exist yet. Custom Buttons
 * (and any formula-bearing field) roll through this single, isolated
 * function so the sheet UI is complete and testable now. When the real
 * dice/oracle system lands, swap this function's internals (or the import
 * sites) for a call into it — this file is deliberately the only place that
 * needs to change.
 *
 * Supports basic dice math: terms of `NdM`, flat integers, and `+`/`-`
 * between them, e.g. "2d6+1d4-2". Formula-reference substitution (the
 * `{Label}` syntax) happens before this is called — see resolveReferences.ts.
 */
export interface RollTerm {
  text: string
  rolls: number[]
  total: number
}

export interface RollResult {
  formula: string
  terms: RollTerm[]
  total: number
}

const TERM_RE = /([+-]?)\s*(\d*d\d+|\d+)/gi

export function rollFormula(formula: string): RollResult {
  const terms: RollTerm[] = []
  let total = 0
  let match: RegExpExecArray | null
  TERM_RE.lastIndex = 0

  while ((match = TERM_RE.exec(formula)) !== null) {
    const sign = match[1] === '-' ? -1 : 1
    const raw = match[2].toLowerCase()

    if (raw.includes('d')) {
      const [countStr, sidesStr] = raw.split('d')
      const count = Math.max(1, parseInt(countStr || '1', 10) || 1)
      const sides = Math.max(1, parseInt(sidesStr, 10) || 1)
      const rolls: number[] = []
      let sum = 0
      for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * sides) + 1
        rolls.push(roll)
        sum += roll
      }
      const signedTotal = sign * sum
      terms.push({ text: `${sign < 0 ? '-' : ''}${raw}`, rolls, total: signedTotal })
      total += signedTotal
    } else {
      const value = parseInt(raw, 10) || 0
      const signedTotal = sign * value
      terms.push({ text: `${sign < 0 ? '-' : ''}${raw}`, rolls: [], total: signedTotal })
      total += signedTotal
    }
  }

  return { formula, terms, total }
}
