import { Node, mergeAttributes } from '@tiptap/core';

const CATEGORY_LABELS: Record<string, string> = {
  fate: 'Fate',
  oracle: 'Oracle',
  dice: 'Dice',
  storycubes: 'Story Cubes',
  manual: 'Manual',
};

/**
 * RollAnchorNode — inline atom node marking where a roll was made. A visible
 * glyph (not zero-width), colour-coded by RollCategory. Content itself is
 * never inserted into the prose; the anchor only links to a RollNote record
 * (via anchorId) held in rollNoteStore. `resultPreview` is a snapshot of the
 * result text at roll time (rolls aren't editable afterwards) so the hover
 * tooltip can show it without the render tree needing a live store lookup.
 */
export const RollAnchorNode = Node.create({
  name: 'rollAnchor',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      anchorId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-anchor-id'),
        renderHTML: (attributes) => ({
          'data-anchor-id': attributes.anchorId,
        }),
      },
      category: {
        default: 'manual',
        parseHTML: (element) => element.getAttribute('data-roll-category'),
        renderHTML: (attributes) => ({
          'data-roll-category': attributes.category,
        }),
      },
      resultPreview: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-result-preview'),
        renderHTML: (attributes) => ({
          'data-result-preview': attributes.resultPreview,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-anchor-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const label = CATEGORY_LABELS[HTMLAttributes['data-roll-category']] ?? 'Roll';
    const preview = HTMLAttributes['data-result-preview'];
    const title = preview ? `${label} roll: ${preview}` : `${label} roll`;
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'roll-anchor-glyph',
        contenteditable: 'false',
        title,
      }),
      '🎲',
    ];
  },
});
