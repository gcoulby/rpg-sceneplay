export const getShortcutModifier = () => {
  return /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent)
    ? '⌘'
    : 'Ctrl+'
}
