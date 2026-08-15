export type HitType = 'Strong Hit' | 'Weak Hit' | 'Miss'

export interface HitRollResult {
  actionDie: number
  stat: number
  add: number
  score: number
  challenge1: number
  challenge2: number
  hitType: HitType
  isMatch: boolean
}

function d(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

/**
 * Ironsworn-style action roll: 1d6 + stat + add vs two 1d10 challenge dice.
 * Ported from mythic-gme-companion's DiceRoller.actionRoll.
 */
export function rollHit(stat = 0, add = 0): HitRollResult {
  const actionDie = d(6)
  const challenge1 = d(10)
  const challenge2 = d(10)
  const score = actionDie + stat + add

  const beatsBoth = score > challenge1 && score > challenge2
  const beatsOne = score > challenge1 || score > challenge2
  const hitType: HitType = beatsBoth ? 'Strong Hit' : beatsOne ? 'Weak Hit' : 'Miss'

  return {
    actionDie,
    stat,
    add,
    score,
    challenge1,
    challenge2,
    hitType,
    isMatch: challenge1 === challenge2,
  }
}
