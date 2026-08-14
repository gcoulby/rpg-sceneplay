// Post-parse import remapping for templates with a restricted element set
// (e.g. RPG Sceneplay's S-T-A-R-T list). See `FormattingTemplate.elementMenuOrder`
// and `.importMapping` in formattingTypes.ts.
import type { FormattingTemplate } from '@/stores/formattingTypes';

interface DocNode {
  type?: string;
  content?: DocNode[];
  attrs?: Record<string, unknown>;
  [key: string]: unknown;
}

// Structural/container node types that aren't themselves a choosable element
// type (no entry in any template's `rules`) — recurse into their content but
// never remap or bucket the wrapper node itself.
const STRUCTURAL_TYPES = new Set([
  'doc',
  'text',
  'hardBreak',
  'dualDialogue',
  'dualDialogueColumn',
  'titlePage',
  'screenplayImage',
]);

/**
 * Remap an imported document's node types against the active template's
 * restricted element set. No-ops (returns `doc` unchanged) for templates
 * that don't define `elementMenuOrder` — i.e. every template except RPG
 * Sceneplay today — so Film Screenplay and the other system templates'
 * import behaviour is completely unaffected.
 *
 * For a restrictive template: applies the format-specific `importMapping`
 * override first (e.g. FDX "End of Act" -> `resolve`), then any node whose
 * resulting type still isn't in `elementMenuOrder` is converted to a
 * `customElement` with `customTypeId: 'unknown'`, preserving the source type
 * as `originalType` so the content isn't dropped, misrendered, or silently
 * relabelled as a lookalike type.
 */
export function remapImportedDoc(
  doc: DocNode,
  activeTemplate: FormattingTemplate,
  format: 'fdx' | 'fountain' | 'odraft',
): DocNode {
  if (!activeTemplate.elementMenuOrder) return doc;
  const allowed = new Set(activeTemplate.elementMenuOrder);
  const overrides =
    (format === 'fdx' || format === 'fountain'
      ? activeTemplate.importMapping?.[format]
      : undefined) || {};

  function visit(node: DocNode): DocNode {
    if (node.content) {
      node.content = node.content.map(visit);
    }
    if (!node.type || STRUCTURAL_TYPES.has(node.type)) return node;

    const sourceType =
      node.type === 'customElement'
        ? String(node.attrs?.customTypeId || '')
        : node.type;
    if (!sourceType) return node;

    const mappedType = overrides[sourceType] || sourceType;

    if (allowed.has(mappedType)) {
      if (sourceType !== mappedType) applyType(node, mappedType, activeTemplate);
      return node;
    }

    // Unknown/incompatible bucket — plain-styled, not selectable in this
    // template's menus, but recoverable via `originalType` on future export.
    // Prefer the raw source-format type string (e.g. an FDX paragraph Type
    // the app doesn't otherwise recognise) over the generic fallback id.
    const originalType =
      (node.attrs?.rawFdxType as string | undefined) || sourceType;
    node.type = 'customElement';
    node.attrs = {
      customTypeId: 'unknown',
      customLabel: 'Unknown',
      originalType,
    };
    return node;
  }

  return visit(doc);
}

function applyType(
  node: DocNode,
  targetId: string,
  activeTemplate: FormattingTemplate,
) {
  const rule = activeTemplate.rules[targetId];
  if (rule && !rule.isBuiltIn) {
    node.type = 'customElement';
    node.attrs = { customTypeId: targetId, customLabel: rule.label };
  } else {
    node.type = targetId;
    if (node.attrs) {
      delete node.attrs.customTypeId;
      delete node.attrs.customLabel;
    }
  }
}
