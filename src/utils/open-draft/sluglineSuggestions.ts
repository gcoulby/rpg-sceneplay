/**
 * Three-stage slugline typeahead: INT./EXT./etc., then a known location
 * (once a prefix + space is typed), then time of day (once a ` - `
 * separator is typed) — mirrors the character-name autocomplete's
 * "filter known values by what's typed so far" approach, but a slugline has
 * three progressive fields instead of character autocomplete's one, so each
 * stage only replaces the fragment currently being typed rather than the
 * whole line — replacing the whole line would also wipe out whatever the
 * writer already confirmed earlier in it.
 */
import { SLUGLINE_PREFIXES, parseSceneHeading, singleLine } from './nodeText';

export const TIME_OF_DAY = [
  'DAY',
  'NIGHT',
  'CONTINUOUS',
  'LATER',
  'MOMENTS LATER',
  'DAWN',
  'DUSK',
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'SAME',
];

export interface SlugSuggestionContext {
  /** Offset within the block's (single-line) text where the matched fragment begins. */
  segmentStart: number;
  /** Offset where it ends — always the end of the text, suggestions only fire while typing at the cursor. */
  segmentEnd: number;
  suggestions: string[];
}

export function getSlugSuggestionContext(
  raw: string,
  knownLocations: string[],
): SlugSuggestionContext | null {
  const text = singleLine(raw);
  const upper = text.toUpperCase();

  // Stage 3: a " - " separator has already been typed — suggest time of day.
  const dashMatch = text.match(/\s-\s/);
  if (dashMatch && dashMatch.index !== undefined) {
    const segmentStart = dashMatch.index + dashMatch[0].length;
    const fragment = upper.slice(segmentStart);
    const suggestions = TIME_OF_DAY.filter((t) => t.startsWith(fragment) && t !== fragment);
    return suggestions.length ? { segmentStart, segmentEnd: text.length, suggestions } : null;
  }

  // Stage 2: a recognized prefix + space has been typed — suggest known locations.
  const spaceIdx = text.indexOf(' ');
  if (spaceIdx !== -1) {
    const { prefix } = parseSceneHeading(text);
    if (!prefix) return null; // no recognized prefix yet, nothing to anchor stage 2 to
    let segmentStart = spaceIdx;
    while (segmentStart < text.length && text[segmentStart] === ' ') segmentStart++;
    const fragment = upper.slice(segmentStart);
    if (!fragment) return null;
    const suggestions = knownLocations.filter((l) => l.startsWith(fragment) && l !== fragment);
    return suggestions.length ? { segmentStart, segmentEnd: text.length, suggestions } : null;
  }

  // Stage 1: still typing the prefix itself. Shortest match first (an
  // autoformatter has already reordered `SLUGLINE_PREFIXES` once — sort
  // explicitly here rather than depending on its declaration order).
  const suggestions = SLUGLINE_PREFIXES.filter((p) => p.startsWith(upper) && p !== upper).sort(
    (a, b) => a.length - b.length,
  );
  return suggestions.length ? { segmentStart: 0, segmentEnd: text.length, suggestions } : null;
}
