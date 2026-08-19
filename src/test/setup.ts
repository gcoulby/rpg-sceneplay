/**
 * Test environment shims.
 *
 * The suite runs in vitest's `node` environment — no DOM, which keeps tests
 * fast and free of jsdom. But several pure-logic modules under test import a
 * Zustand store transitively, and those stores read `localStorage` at module
 * scope to hydrate user preferences.
 *
 * Rather than restructure production code to suit the tests, provide the one
 * browser API they touch. This is an in-memory implementation with the real
 * semantics: values are coerced to strings, a missing key returns null.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

// Node 22+ ships its own `localStorage` global, gated behind a
// `--localstorage-file` flag this test run doesn't pass — so the property
// exists but every method throws. Check for a working `getItem`, not just
// presence, or that broken native object shadows the shim below.
function isUsableStorage(value: unknown): value is Storage {
  return typeof (value as Storage | undefined)?.getItem === 'function';
}

if (!isUsableStorage(globalThis.localStorage)) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
}

if (!isUsableStorage(globalThis.sessionStorage)) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: new MemoryStorage(),
    configurable: true,
  });
}

/**
 * A minimal `document` for the node test environment. `editorStore` reads
 * `document.documentElement` at module scope to apply the saved theme.
 */
if (typeof globalThis.document === 'undefined') {
  const classList = {
    toggle: () => {},
    add: () => {},
    remove: () => {},
    contains: () => false,
  };
  Object.defineProperty(globalThis, 'document', {
    value: {
      documentElement: {
        classList,
        setAttribute: () => {},
        getAttribute: () => null,
        style: {},
      },
      createElement: () => ({
        classList,
        style: {},
        setAttribute: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelector: () => null,
    },
    configurable: true,
  });
}

/**
 * A minimal `window` for the node test environment. Modules under test reach for
 * it at import time (the storage layer, and the exporters transitively via
 * `imageAsset`); nothing under test makes a network call.
 */
if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: {
      location: { origin: 'http://localhost', href: 'http://localhost/', pathname: '/' },
      localStorage: globalThis.localStorage,
      sessionStorage: globalThis.sessionStorage,
      navigator: { userAgent: 'node' },
      addEventListener: () => {},
      removeEventListener: () => {},
      matchMedia: () => ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    },
    configurable: true,
  });
}
