import {
  RPG_ELEMENT_ORDER,
  RPG_SCENEPLAY_TEMPLATE,
} from '@/stores/templates/rpgSceneplayTemplate'

export const OVERVIEW = {
  whatItIs: `RPG Sceneplay is derived from an open source screenplay editor repurposed for solo and GM-less
tabletop RPG play. It's built on a clone-and-own fork of OpenDraft
(MIT licensed), with an RPG-specific layer added on top: new element
types, a restricted template, dice/oracle rolling, character sheets,
and mapping. The clone-and-own process is more than just a copy paste job,
the original open-draft software was largely vibecoded so was not very human readable. 
The modifications I was making required more intimate knowledge with the code. Therefore, I rebuilt
the chrome of the app to present an entirely new UI/UX built on top of Shadcn for a clean,
controlled UX. 

I chose to build on an already existing screenplay software as I have no background
in screenplay writing so there are a lot of features I would never have considered. My focus
was merging screenplay with solo TTRPG. 
`,
  attribution: `The editor (document model, formatting, pagination,
export) is adapted from OpenDraft. The S.T.A.R.T. System is derived from The GrouchCouch's Solo Game Loop (See Acknowledgements). The RPG layer,
oracle/dice rolling, character sheets, and mapping — is original to
RPG Sceneplay.`,
  whyItExists: `The origin was not "I needed a screenplay editor", it was the
opposite. Following Turk's (from TheGrouchCouch) content on how to take notes for solo RPG play led me to a video of his on Cornell notes style for
structured notes. I then discovered Turk's S.T.A.R.T. system and realised Scene, Action, Transition had parity with screenplay standards. I then tried dedicated screenwriting software as a
way to capture scenes with proper structure. I tried Fade in and FDX demos and found the editor did the underlying job well, which raised the question of whether screenplay
elements could be repurposed for RPG play instead of building a journaling tool from scratch. Screenplay format already has
first-class citizens for Scene, Action, Transition, Character, and Dialogue... These are structures a solo RPG session already needs. The gap was
Task and Resolve: the beat where you introduce an obstacle, and the beat where you record what happened. Screenplay format has no native
slot for either, so RPG Sceneplay adds them. Screenplay software also has no concepts of dice, oracle, maps, or character sheets, so it was to the drawing board with them too.`,
  goals: [
    'Give solo/GM-less RPG players a writing tool that captures a session as structured scenes, not a wall of prose.',
    'Itegrate S.T.A.R.T. beats (Situation → Task → Action → Resolve → Transition) as first-class element types, not a naming convention layered on top of generic text.',
    'Wire oracle/dice resolution directly into the writing flow, so a roll happens in the document you’re writing in, not in a separate app.',
    'Stay local-first: no server, no account, no lock-in — a session lives in a .sceneplay file the user owns, on disk.',
    "Support film-screenplay work too, unmodified, via the original template. RPG Sceneplay is additive, not a replacement of what the editor already did well. This was to ensure my tool didn't drift too far from screenplay standards",
  ],
}

/** Built from the live template so this can never drift from what the
 *  editor actually implements — see rpgSceneplayTemplate.ts. */
export const RPG_ELEMENT_TABLE = RPG_ELEMENT_ORDER.map((id, index) => ({
  id,
  label: RPG_SCENEPLAY_TEMPLATE.rules[id]?.label ?? id,
  shortcutDigit: index + 1,
}))

export const TEMPLATES = {
  filmScreenplay: `The original, full OpenDraft type set, unmodified: Scene
Heading, Action, Character, Dialogue, Parenthetical, Transition, Shot,
General, Cast List, New Act, End of Act, Lyrics, Show/Episode, and
others.`,
  rpgSceneplay: `A restricted template exposing exactly ${RPG_ELEMENT_TABLE.length}
element types, in a fixed order, in the element chooser, right-click
menu, and number-key shortcuts. Task and Resolve/Resolution are
genuinely new element types added for this template — they aren't
relabelled Lyrics or End of Act.`,
  enterFlow: `Scene Heading → Task → Action (loops on repeated Enter — a beat
can span several Action lines) → Resolution is reached manually, not
auto-chained → Resolution Description → Transition → back to Scene
Heading.`,
  importMapping: `Importing other formats: an .fdx file's "End of Act" maps
to Resolution (its closest analogue), and a Fountain Lyric line (~)
maps to Task. Fountain imports never populate Resolution — Fountain
has no equivalent. Anything else outside this template's element set
lands in an unknown/incompatible bucket rather than being dropped
silently.`,
}

export const SIDEBAR_PANELS = [
  { name: 'Scenes', description: 'Scene list for the current document.' },
  { name: 'Pages', description: 'Page-by-page navigation.' },
  { name: 'Locations', description: 'Locations referenced in the script.' },
  { name: 'Structure', description: 'Outline/structure view of the document.' },
  { name: 'Tags', description: 'Tag management across the document.' },
  { name: 'Notes', description: 'Freeform notes attached to the project.' },
  {
    name: 'Characters',
    description: 'Character profiles, one Character Sheet link per character.',
  },
  { name: 'Index Cards', description: 'Card-based scene overview.' },
  {
    name: 'Oracles',
    description: 'Browse oracle sources, collections, and tables.',
  },
  {
    name: 'Inspiration',
    description: 'Story Cubes and other inspiration prompts.',
  },
  {
    name: 'Dice Roller',
    description: 'Standalone freeform dice notation roller.',
  },
  {
    name: 'Rolls',
    description:
      'History of rolls anchored to positions in the document, browsable after the fact.',
  },
]

export const MAIN_TABS = [
  { name: 'Editor', description: 'The screenplay/sceneplay document itself.' },
  {
    name: 'Character Sheet',
    description:
      'Full character sheet view — one sheet per character, survives character deletion (orphaned, reassignable rather than deleted).',
  },
  {
    name: 'Map',
    description:
      'Hex or grid map, chosen on first load or in map settings; click a cell to add a feature.',
  },
  { name: 'Beat Board', description: 'Beat-level overview of the session.' },
  { name: 'Statistics', description: 'Document statistics.' },
  {
    name: 'Oracles',
    description:
      'Full-screen oracle browser (a larger view of the sidebar Oracles panel).',
  },
  {
    name: 'Acknowledgements',
    description:
      'Licensing and credit for every oracle/table source and tool in use.',
  },
]

export const ROLL_DIALOG_NOTE = `Right-click in the editor → Roll... opens the
Roll Dialog (Oracle | Fate | Dice | Manual tabs). Confirming a roll inserts
a Roll Anchor at the cursor and records it in the Rolls panel.`

interface ShortcutRow {
  label: string
  keys: string
}

export function getElementShortcuts(mod: string): ShortcutRow[] {
  return [
    ...RPG_ELEMENT_TABLE.map((el) => ({
      label: el.label,
      keys: `${mod}${el.shortcutDigit}`,
    })),
    { label: 'Roll... dialog', keys: `${mod}0` },
  ]
}

export function getGeneralShortcuts(mod: string): ShortcutRow[] {
  return [
    { label: 'New document', keys: `${mod}N` },
    { label: 'Save', keys: `${mod}S` },
    { label: 'Save as / switch storage', keys: `⇧${mod}S` },
    { label: 'Print', keys: `${mod}P` },
    { label: 'Zoom in', keys: `${mod}+` },
    { label: 'Zoom out', keys: `${mod}−` },
    { label: 'Undo', keys: `${mod}Z` },
    { label: 'Redo', keys: `⇧${mod}Y` },
    { label: 'Cut', keys: `${mod}X` },
    { label: 'Copy', keys: `${mod}C` },
    { label: 'Paste', keys: `${mod}V` },
    { label: 'Select all', keys: `${mod}A` },
    { label: 'Bold', keys: `${mod}B` },
    { label: 'Italic', keys: `${mod}I` },
    { label: 'Underline', keys: `${mod}U` },
    { label: 'Toggle Dual Dialogue', keys: `${mod}D` },
    { label: 'Toggle AV Block', keys: `⇧${mod}A` },
    { label: 'AV Block: new row', keys: `${mod}⏎` },
    { label: 'Next element (per template)', keys: 'Tab' },
    { label: 'Find', keys: `${mod}F` },
    { label: 'Find next', keys: `F3 / ${mod}G` },
    { label: 'Find previous', keys: `⇧F3 / ⇧${mod}G` },
    { label: 'Close find', keys: 'Esc' },
    { label: 'Spell check', keys: 'F7' },
    { label: 'Writing suggestions', keys: '⇧F7' },
    {
      label: 'Go to page',
      keys: 'Edit menu only (no shortcut — avoids clashing with Find next)',
    },
  ]
}

export const SHORTCUTS_NOTE = `Panel toggles in the left sidebar (Scenes,
Characters, Oracles, etc.) have no keyboard shortcuts — click the icon in
the activity bar to switch.`
