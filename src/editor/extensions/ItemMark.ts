import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * ItemMark — `[something]` in the script text is a tracked item, collected
 * into the Items panel. Unlike TagMark (manually applied via right-click to
 * a pre-defined category), this is auto-discovered purely from the bracket
 * syntax — no separate registry, the panel just scans the doc for this mark
 * (mirrors how Locations are auto-discovered from scene headings).
 *
 * Deliberately just the mark's shape — no `addInputRules()` here. An
 * InputRule only fires on the exact keystroke that completes a match, which
 * can't reliably tell whether ProseMirror already inserted that keystroke's
 * character itself (it depends on *how* the character arrived — a plain
 * keypress vs. right after a backspace behaved differently in testing,
 * corrupting the mark's range either way), and it never re-fires at all when
 * text is edited *inside* an already-bracketed span rather than by typing a
 * fresh closing `]`. `ScreenplayEditor.tsx`'s item-mark sync effect
 * (search `findBracketMatches`) instead continuously reconciles this mark
 * against whatever `[...]` text actually exists in the doc, however it got
 * there (typed, edited, pasted, undone) — the same "re-derive from current
 * state" approach already used for auto-CONT'D and character-name
 * collection elsewhere in this file, and it structurally can't leave stale
 * "orphan" marks behind the way the input-rule approach did.
 */
export const ItemMark = Mark.create({
  name: 'item',

  // No `excludes` override — leaves the schema default (self-exclusion) in
  // place, so applying an `item` mark to a range always replaces any prior
  // `item` mark there instead of stacking a second one alongside it. This
  // was the actual root cause of the orphaned-fragment bug under the old
  // input-rule approach: it set `excludes: ''` to coexist with *other* mark
  // types (bold/tags/notes — still fine without it, self-exclusion is only
  // ever mark-type-vs-itself), which also silently disabled protection
  // against overlapping instances of `item` itself.

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
});
