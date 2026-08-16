/**
 * RPG Sceneplay (S.T.A.R.T.) — a tabletop-RPG-session screenplay format.
 *
 * S-T-A-R-T = Scene Heading, Task, Action, Resolve, Transition, then the
 * three dialogue-support types (Character, Dialogue, Parenthetical).
 *
 * Adds two new element types on top of the shared schema:
 *  - Task: the beat's driving question/obstacle, prompted right after the
 *    scene heading.
 *  - Resolve: the beat's outcome (success/fail/complication), reached
 *    manually — not auto-chained from Action, since a beat can span
 *    multiple action lines before it resolves.
 *
 * All other built-in types (Shot, General, Cast List, New Act, End of Act,
 * Lyrics, Show/Episode) remain part of the shared schema for Film
 * Screenplay and other templates, but are disabled here so they don't
 * appear in this template's chooser/context menu/shortcuts.
 */

import type { FormattingTemplate, StarterNode } from '../formattingTypes'
import { rule, disabled } from './_helpers'

export const RPG_SCENEPLAY_ID = '__rpg_sceneplay__'

/** Restricted, ordered set of element ids this template exposes in the
 *  chooser, context menu, and number-key shortcuts (1-8, positionally). */
export const RPG_ELEMENT_ORDER = [
  'sceneHeading',
  'task',
  'action',
  'resolve',
  'resolveDescription',
  'transition',
  'character',
  'dialogue',
  'parenthetical',
]

const STARTER: StarterNode[] = [
  {
    type: 'sceneHeading',
    content: [{ type: 'text', text: 'INT. The Rusted Tankard - NIGHT' }],
  },
  {
    type: 'customElement',
    attrs: { customTypeId: 'task', customLabel: 'Task' },
    content: [
      {
        type: 'text',
        text: 'Get information from the barkeep without drawing a crowd.',
      },
    ],
  },
  {
    type: 'action',
    content: [
      {
        type: 'text',
        text: 'The Tavern is half empty. A bard is playing a lute in the corner. You notice a hooded figure watching you from the corner table.',
      },
    ],
  },
  {
    type: 'customElement',
    attrs: { customTypeId: 'resolve', customLabel: 'Resolution' },
    content: [{ type: 'text', text: 'COMPLICATION' }],
  },
  {
    type: 'customElement',
    attrs: {
      customTypeId: 'resolveDescription',
      customLabel: 'Resolution Description',
    },
    content: [
      {
        type: 'text',
        text: 'The hooded figure throws his table to one side and shouts at you.',
      },
    ],
  },
  {
    type: 'character',
    content: [{ type: 'text', text: 'Hooded Figure' }],
  },
  {
    type: 'dialogue',
    content: [
      {
        type: 'text',
        text: 'How dare you enter this place! You have no business here.',
      },
    ],
  },
  {
    type: 'transition',
    content: [
      {
        type: 'text',
        text: 'You feel the figure conjuring dark energy and you begin to brace yourself.',
      },
    ],
  },
]

export const RPG_SCENEPLAY_TEMPLATE: FormattingTemplate = {
  id: RPG_SCENEPLAY_ID,
  name: 'RPG Sceneplay (S.T.A.R.T.)',
  description:
    "Tabletop RPG session format: Scene Heading, Task, Action, Resolve, Transition, plus Character/Dialogue/Parenthetical. Based on TheGrouchCouch's Solo RPG Game Loop",
  mode: 'enforce',
  category: 'system',
  createdAt: '',
  updatedAt: '',
  scriptTypeGroup: 'RPG',
  scriptTypeTagline: 'Tabletop RPG session (S-T-A-R-T beats)',
  starterDocument: STARTER,
  elementMenuOrder: RPG_ELEMENT_ORDER,
  importMapping: {
    // FDX has no Task equivalent; End of Act is the closest analogue to Resolve.
    fdx: { endOfAct: 'resolve' },
    // Fountain has no Resolve equivalent; a Lyric (~) line is the closest
    // analogue to Task. Fountain imports never populate `resolve`.
    fountain: { lyrics: 'task' },
  },
  rules: {
    sceneHeading: rule('sceneHeading', 'Scene Heading', true, {
      bold: true,
      textTransform: 'uppercase',
      marginTop: 12,
      nextOnEnter: 'task',
      nextOnTab: 'task',
      placeholder: 'INT./EXT. LOCATION - TIME',
    }),
    action: rule('action', 'Action', true, {
      marginTop: 12,
      nextOnEnter: 'action',
      nextOnTab: 'character',
      placeholder: 'Describe the action...',
    }),

    character: rule('character', 'Character', true, {
      textTransform: 'uppercase',
      marginTop: 12,
      leftIndent: 3.5,
      nextOnEnter: 'dialogue',
      nextOnTab: 'parenthetical',
      placeholder: 'CHARACTER NAME',
    }),
    dialogue: rule('dialogue', 'Dialogue', true, {
      leftIndent: 2.5,
      rightIndent: 6.0,
      nextOnEnter: 'dialogue',
      nextOnTab: 'parenthetical',
      placeholder: 'Dialogue...',
    }),
    parenthetical: rule('parenthetical', 'Parenthetical', true, {
      leftIndent: 3.0,
      rightIndent: 5.5,
      nextOnEnter: 'dialogue',
      nextOnTab: 'dialogue',
      placeholder: '(direction)',
    }),
    transition: rule('transition', 'Transition', true, {
      textTransform: 'uppercase',
      textAlign: 'right',
      marginTop: 12,
      leftIndent: 4.5,
      nextOnEnter: 'sceneHeading',
      placeholder: 'Transition:',
    }),
    // Disabled but present so Film Screenplay's shared schema stays intact —
    // these still exist as valid node types, just hidden from this template's UI.
    general: disabled('general', 'General'),
    shot: disabled('shot', 'Shot'),
    newAct: disabled('newAct', 'New Act'),
    endOfAct: disabled('endOfAct', 'End of Act'),
    lyrics: disabled('lyrics', 'Lyrics'),
    showEpisode: disabled('showEpisode', 'Show/Episode'),
    castList: disabled('castList', 'Cast List'),
    // New element: the beat's driving question/obstacle.
    task: rule('task', 'Task', false, {
      italic: true,
      textTransform: 'none',
      textAlign: 'left',
      marginTop: 12,
      nextOnEnter: 'action',
      placeholder: 'What stands in the way?',
    }),
    // New element: the beat's outcome — reached manually, not auto-chained.
    resolve: rule('resolve', 'Resolution', false, {
      bold: true,
      textTransform: 'uppercase',
      textAlign: 'center',
      marginTop: 24,
      nextOnEnter: 'resolveDescription',
      placeholder: 'SUCCESS / FAIL / COMPLICATION',
    }),
    resolveDescription: rule(
      'resolveDescription',
      'Resolution Description',
      false,
      {
        marginTop: 12,
        italic: true,
        nextOnEnter: 'transition',
        placeholder: 'Describe the resolution...',
      },
    ),
    // Landing spot for imported content with no mapping into this template's
    // 8 types. Never offered as a selectable type (excluded from
    // elementMenuOrder); only produced by the .fdx/.fountain/.odraft importers.
    unknown: rule('unknown', 'Unknown', false, {
      enabled: false,
      nextOnEnter: 'action',
      placeholder: '',
    }),
  },
}
