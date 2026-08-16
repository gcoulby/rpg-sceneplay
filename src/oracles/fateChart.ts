export interface FateChanceCell {
  rank: number
  chance: number
  lowerBound: number
  upperBound: number
}

export interface FateChartRow {
  name: string
  rank: number
  chaosOdds: FateChanceCell[]
}

export type FateRollOutcome = 'Exceptional Yes' | 'Yes' | 'No' | 'Exceptional No'

export interface FateRollResult {
  roll: number
  cell: FateChanceCell
  result: FateRollOutcome
}

// Mythic GME 2e chaos-rank x odds matrix, ported from mythic-gme-companion's
// src/models/odds.json. `rank` on the row is the odds rank (0 Impossible -
// 10 Has to be); each chaosOdds entry is that odds at a given chaos rank
// (1-9), with the d100 bounds used to resolve a roll.
export const FATE_CHART: FateChartRow[] = [
  {
    name: 'Impossible',
    rank: 0,
    chaosOdds: [
      { rank: 9, chance: 50, lowerBound: 10, upperBound: 91 },
      { rank: 8, chance: 25, lowerBound: 5, upperBound: 86 },
      { rank: 7, chance: 15, lowerBound: 3, upperBound: 84 },
      { rank: 6, chance: 10, lowerBound: 2, upperBound: 83 },
      { rank: 5, chance: 5, lowerBound: 1, upperBound: 82 },
      { rank: 4, chance: 5, lowerBound: 1, upperBound: 82 },
      { rank: 3, chance: 0, lowerBound: 0, upperBound: 81 },
      { rank: 2, chance: 0, lowerBound: 0, upperBound: 81 },
      { rank: 1, chance: -20, lowerBound: 0, upperBound: 77 },
    ],
  },
  {
    name: 'No way',
    rank: 1,
    chaosOdds: [
      { rank: 9, chance: 75, lowerBound: 15, upperBound: 96 },
      { rank: 8, chance: 50, lowerBound: 10, upperBound: 91 },
      { rank: 7, chance: 35, lowerBound: 7, upperBound: 88 },
      { rank: 6, chance: 25, lowerBound: 5, upperBound: 86 },
      { rank: 5, chance: 15, lowerBound: 3, upperBound: 84 },
      { rank: 4, chance: 10, lowerBound: 2, upperBound: 83 },
      { rank: 3, chance: 5, lowerBound: 1, upperBound: 82 },
      { rank: 2, chance: 5, lowerBound: 1, upperBound: 82 },
      { rank: 1, chance: 0, lowerBound: 0, upperBound: 81 },
    ],
  },
  {
    name: 'Very unlikely',
    rank: 2,
    chaosOdds: [
      { rank: 9, chance: 85, lowerBound: 16, upperBound: 97 },
      { rank: 8, chance: 65, lowerBound: 13, upperBound: 94 },
      { rank: 7, chance: 50, lowerBound: 10, upperBound: 91 },
      { rank: 6, chance: 45, lowerBound: 9, upperBound: 90 },
      { rank: 5, chance: 25, lowerBound: 5, upperBound: 86 },
      { rank: 4, chance: 15, lowerBound: 3, upperBound: 84 },
      { rank: 3, chance: 10, lowerBound: 2, upperBound: 83 },
      { rank: 2, chance: 5, lowerBound: 1, upperBound: 82 },
      { rank: 1, chance: 5, lowerBound: 1, upperBound: 82 },
    ],
  },
  {
    name: 'Unlikely',
    rank: 3,
    chaosOdds: [
      { rank: 9, chance: 90, lowerBound: 18, upperBound: 99 },
      { rank: 8, chance: 75, lowerBound: 15, upperBound: 96 },
      { rank: 7, chance: 55, lowerBound: 11, upperBound: 92 },
      { rank: 6, chance: 50, lowerBound: 10, upperBound: 91 },
      { rank: 5, chance: 35, lowerBound: 7, upperBound: 88 },
      { rank: 4, chance: 20, lowerBound: 4, upperBound: 85 },
      { rank: 3, chance: 15, lowerBound: 3, upperBound: 84 },
      { rank: 2, chance: 10, lowerBound: 2, upperBound: 83 },
      { rank: 1, chance: 5, lowerBound: 1, upperBound: 82 },
    ],
  },
  {
    name: '50/50',
    rank: 4,
    chaosOdds: [
      { rank: 9, chance: 95, lowerBound: 19, upperBound: 100 },
      { rank: 8, chance: 85, lowerBound: 16, upperBound: 97 },
      { rank: 7, chance: 75, lowerBound: 15, upperBound: 96 },
      { rank: 6, chance: 65, lowerBound: 13, upperBound: 94 },
      { rank: 5, chance: 50, lowerBound: 10, upperBound: 91 },
      { rank: 4, chance: 35, lowerBound: 7, upperBound: 88 },
      { rank: 3, chance: 25, lowerBound: 5, upperBound: 86 },
      { rank: 2, chance: 15, lowerBound: 3, upperBound: 84 },
      { rank: 1, chance: 10, lowerBound: 2, upperBound: 83 },
    ],
  },
  {
    name: 'Somewhat likely',
    rank: 5,
    chaosOdds: [
      { rank: 9, chance: 95, lowerBound: 19, upperBound: 100 },
      { rank: 8, chance: 90, lowerBound: 18, upperBound: 99 },
      { rank: 7, chance: 85, lowerBound: 16, upperBound: 97 },
      { rank: 6, chance: 80, lowerBound: 16, upperBound: 97 },
      { rank: 5, chance: 65, lowerBound: 13, upperBound: 94 },
      { rank: 4, chance: 50, lowerBound: 10, upperBound: 91 },
      { rank: 3, chance: 45, lowerBound: 9, upperBound: 90 },
      { rank: 2, chance: 25, lowerBound: 5, upperBound: 86 },
      { rank: 1, chance: 20, lowerBound: 4, upperBound: 85 },
    ],
  },
  {
    name: 'Likely',
    rank: 6,
    chaosOdds: [
      { rank: 9, chance: 100, lowerBound: 20, upperBound: 101 },
      { rank: 8, chance: 95, lowerBound: 19, upperBound: 100 },
      { rank: 7, chance: 90, lowerBound: 18, upperBound: 99 },
      { rank: 6, chance: 85, lowerBound: 16, upperBound: 97 },
      { rank: 5, chance: 75, lowerBound: 15, upperBound: 96 },
      { rank: 4, chance: 55, lowerBound: 11, upperBound: 92 },
      { rank: 3, chance: 50, lowerBound: 10, upperBound: 91 },
      { rank: 2, chance: 35, lowerBound: 7, upperBound: 88 },
      { rank: 1, chance: 25, lowerBound: 5, upperBound: 86 },
    ],
  },
  {
    name: 'Very likely',
    rank: 7,
    chaosOdds: [
      { rank: 9, chance: 105, lowerBound: 21, upperBound: 101 },
      { rank: 8, chance: 95, lowerBound: 19, upperBound: 100 },
      { rank: 7, chance: 95, lowerBound: 19, upperBound: 100 },
      { rank: 6, chance: 90, lowerBound: 18, upperBound: 99 },
      { rank: 5, chance: 85, lowerBound: 16, upperBound: 97 },
      { rank: 4, chance: 75, lowerBound: 15, upperBound: 96 },
      { rank: 3, chance: 65, lowerBound: 13, upperBound: 94 },
      { rank: 2, chance: 50, lowerBound: 10, upperBound: 91 },
      { rank: 1, chance: 45, lowerBound: 9, upperBound: 90 },
    ],
  },
  {
    name: 'Near sure thing',
    rank: 8,
    chaosOdds: [
      { rank: 9, chance: 115, lowerBound: 23, upperBound: 101 },
      { rank: 8, chance: 100, lowerBound: 20, upperBound: 101 },
      { rank: 7, chance: 95, lowerBound: 19, upperBound: 100 },
      { rank: 6, chance: 95, lowerBound: 19, upperBound: 100 },
      { rank: 5, chance: 90, lowerBound: 18, upperBound: 99 },
      { rank: 4, chance: 85, lowerBound: 16, upperBound: 97 },
      { rank: 3, chance: 80, lowerBound: 16, upperBound: 97 },
      { rank: 2, chance: 65, lowerBound: 13, upperBound: 94 },
      { rank: 1, chance: 55, lowerBound: 11, upperBound: 92 },
    ],
  },
  {
    name: 'A sure thing',
    rank: 9,
    chaosOdds: [
      { rank: 9, chance: 125, lowerBound: 25, upperBound: 101 },
      { rank: 8, chance: 110, lowerBound: 22, upperBound: 101 },
      { rank: 7, chance: 95, lowerBound: 19, upperBound: 100 },
      { rank: 6, chance: 95, lowerBound: 19, upperBound: 100 },
      { rank: 5, chance: 90, lowerBound: 18, upperBound: 99 },
      { rank: 4, chance: 85, lowerBound: 16, upperBound: 97 },
      { rank: 3, chance: 80, lowerBound: 16, upperBound: 97 },
      { rank: 2, chance: 65, lowerBound: 13, upperBound: 94 },
      { rank: 1, chance: 55, lowerBound: 11, upperBound: 92 },
    ],
  },
  {
    name: 'Has to be',
    rank: 10,
    chaosOdds: [
      { rank: 9, chance: 145, lowerBound: 26, upperBound: 101 },
      { rank: 8, chance: 130, lowerBound: 26, upperBound: 101 },
      { rank: 7, chance: 100, lowerBound: 20, upperBound: 101 },
      { rank: 6, chance: 100, lowerBound: 20, upperBound: 101 },
      { rank: 5, chance: 95, lowerBound: 19, upperBound: 100 },
      { rank: 4, chance: 95, lowerBound: 19, upperBound: 100 },
      { rank: 3, chance: 90, lowerBound: 18, upperBound: 99 },
      { rank: 2, chance: 85, lowerBound: 16, upperBound: 97 },
      { rank: 1, chance: 80, lowerBound: 16, upperBound: 97 },
    ],
  },
]

export function getFateCell(
  oddsRank: number,
  chaosRank: number,
): FateChanceCell | undefined {
  const row = FATE_CHART.find((r) => r.rank === oddsRank)
  return row?.chaosOdds.find((c) => c.rank === chaosRank)
}

export function rollFate(oddsRank: number, chaosRank: number): FateRollResult {
  const cell = getFateCell(oddsRank, chaosRank)
  if (!cell) {
    throw new Error(`No fate chart cell for odds ${oddsRank} / chaos ${chaosRank}`)
  }
  const roll = Math.floor(Math.random() * 100) + 1

  let result: FateRollOutcome
  if (roll <= cell.lowerBound) result = 'Exceptional Yes'
  else if (roll >= cell.upperBound) result = 'Exceptional No'
  else if (roll <= cell.chance) result = 'Yes'
  else result = 'No'

  return { roll, cell, result }
}
