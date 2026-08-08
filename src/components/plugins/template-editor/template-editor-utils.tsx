export const FONT_SIZES = [
  8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96,
]

export function uuid(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 10)
}
