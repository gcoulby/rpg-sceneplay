import { InputRule, Mark, mergeAttributes } from '@tiptap/core';

/**
 * ItemMark — typing `[something]` marks it as a tracked item, collected
 * into the Items panel. Unlike TagMark (manually applied via right-click to
 * a pre-defined category), this is auto-discovered purely from the typed
 * bracket syntax — no separate registry of items to manage, the panel just
 * scans the doc for this mark (mirrors how Locations are auto-discovered
 * from scene headings, not how Tags work).
 *
 * The brackets themselves stay in the document text (a deliberate choice —
 * see the input rule below) — only the mark is added, nothing is deleted or
 * replaced, so this never fights with undo/redo the way delimiter-stripping
 * input rules can.
 */
export const ItemMark = Mark.create({
  name: 'item',

  // Coexists with productionTag/scriptNote/bold/italic/etc.
  excludes: '',

  // Text typed immediately after a closing `]` shouldn't inherit the mark —
  // "[torch]es" should not mark the "es".
  inclusive: false,

  addAttributes() {
    return {
      itemKey: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-item-key'),
        renderHTML: (attributes) => ({
          'data-item-key': attributes.itemKey,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-item-key]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'tracked-item' }), 0];
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\[([^[\]]+)\]$/,
        handler: ({ state, range, match }) => {
          const itemKey = match[1].trim().toUpperCase();
          // Returning `null` here (rather than falling through) is what
          // TipTap's own input-rule plugin treats as "abort, don't dispatch"
          // — matched precisely by reading `markInputRule`'s own source, since
          // returning it unconditionally (even after a successful `addMark`)
          // silently discards the transaction despite it having real steps.
          if (!itemKey) return null;
          // `[range.from, range.to)` only covers the text already in the doc
          // *before* the just-typed closing `]` — the framework only auto-
          // inserts that final character when the handler returns `null`
          // (i.e. "I didn't handle this"), so returning non-null here means
          // WE'RE now responsible for inserting it too, or it's silently
          // dropped (confirmed empirically: without this, the whole `]`
          // vanished from the doc, not just from the mark). `match[0]` is
          // the full "[torch]" text; whatever's left after the old range is
          // that missing trailing character.
          const { tr } = state;
          const newChar = match[0].slice(range.to - range.from);
          tr.insertText(newChar, range.to);
          const end = range.to + newChar.length;
          tr.addMark(range.from, end, this.type.create({ itemKey }));
        },
      }),
    ];
  },
});
