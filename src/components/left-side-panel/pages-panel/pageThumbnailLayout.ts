export const FD_INDENTS: Record<string, [number, number]> = {
  sceneHeading: [1.5, 7.5],
  action: [1.5, 7.5],
  character: [3.5, 7.5],
  dialogue: [2.5, 6.0],
  parenthetical: [3.0, 5.5],
  transition: [5.5, 7.5],
  general: [1.5, 7.5],
  shot: [1.5, 7.5],
  newAct: [1.5, 7.5],
  endOfAct: [1.5, 7.5],
  lyrics: [2.5, 6.0],
  showEpisode: [1.5, 7.5],
  castList: [1.5, 7.5],
}

export const SPACE_BEFORE: Record<string, number> = {
  sceneHeading: 1,
  action: 1,
  character: 1,
  dialogue: 0,
  parenthetical: 0,
  transition: 1,
  general: 0,
  shot: 1,
  newAct: 2,
  endOfAct: 2,
  lyrics: 0,
  showEpisode: 1,
  castList: 0,
}

export const LINE_HEIGHT_PX = 12 * (96 / 72) // 16px — matches pagination's LINE_HEIGHT_PT

export function pageThumbTypeClasses(typeName: string): string {
  switch (typeName) {
    case 'sceneHeading':
      return 'font-bold'
    case 'character':
      return 'uppercase'
    case 'transition':
      return 'text-right uppercase'
    case 'newAct':
    case 'endOfAct':
      return 'text-center font-bold uppercase'
    case 'lyrics':
      return 'italic'
    default:
      return ''
  }
}
