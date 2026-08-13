/**
 * Substitutes `{Label}` / `{Label.max}` tokens in a formula string with
 * numeric values from a sheet's value map (see buildValueMap.ts). Unresolved
 * tokens become `0` — this is a stub-tier substitution pass, not a full
 * expression validator.
 */
export function resolveReferences(
  formula: string,
  valueMap: Record<string, number>,
): string {
  return formula.replace(/\{([^}]+)\}/g, (_match, token: string) => {
    const value = valueMap[token.trim().toLowerCase()]
    return String(value ?? 0)
  })
}
