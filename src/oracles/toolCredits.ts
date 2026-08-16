import type { OracleSource } from './types'

/**
 * Tools and inspiration sources that power parts of the Oracle screen but
 * aren't OracleTable/OracleCollection data pulled from a bundled package —
 * so they can't be discovered by walking collections like Datasworn
 * sources. Listed by hand, surfaced on the Acknowledgements page
 * alongside the data-driven sources.
 */
export const TOOL_CREDITS: OracleSource[] = [
  {
    id: 'grouch-couch-start',
    name: "The GrouchCouch's S.T.A.R.T. System",
    author: 'Turk from The GrouchCouch',
    license: 'Personal permission',
    url: 'https://thegrouchcouch.com',
    note: "The S.T.A.R.T. System is derived from The GrouchCouch's Solo Game Loop. The Solo Game Loop is ©2026 TheGrouchCouch - https://thegrouchcouch.com",
  },
  {
    id: 'mythic-gme-2e',
    name: 'Mythic Game Master Emulator 2nd Edition',
    author: 'Tana Pigeon',
    license: 'Personal permission',
    url: 'https://www.wordmillgames.com',
    note: 'The Fate Chart mechanic (chaos rank / odds table) is used with personal permission from Tana Pigeon, granted on the condition this implementation stays free, names the Mythic product, and links to Word Mill Games.',
  },
  {
    id: 'game-icons-net',
    name: 'Game-icons.net',
    author: 'Delapouite & Lorc',
    license: 'CC-BY-3.0',
    url: 'https://game-icons.net',
    note: 'Icon set used by the Story Cubes tool.',
  },
  {
    id: 'rorys-story-cubes',
    name: "Rory's Story Cubes",
    author: "Rory O'Connor",
    license: 'No license required',
    url: 'https://www.storycubes.com/en/',
    note: 'The Story Cubes tool is inspired by the physical dice game; no license is required, but credit is given.',
  },
]
