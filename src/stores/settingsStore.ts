import { create } from 'zustand';

interface SettingsState {
  // Settings dialog open state
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;

  // Script-format preferences — which system templates show up in the new-script picker.
  // Stored as template ids (e.g. INDUSTRY_STANDARD_ID, MULTICAM_SITCOM_ID, ...).
  enabledScriptFormats: string[];
  setEnabledScriptFormats: (ids: string[]) => void;

  // True once the user has seen and confirmed the first-run format-preferences dialog.
  // Until then, the New Screenplay action opens the prefs dialog instead of going straight in.
  formatPreferencesInitialized: boolean;
  setFormatPreferencesInitialized: (v: boolean) => void;
}

const STORAGE_KEY_FORMATS = 'opendraft:enabledScriptFormats';
const STORAGE_KEY_FORMATS_INIT = 'opendraft:formatPreferencesInitialized';

function loadEnabledScriptFormats(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FORMATS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
    }
  } catch { /* ignore */ }
  return [];
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  enabledScriptFormats: loadEnabledScriptFormats(),
  setEnabledScriptFormats: (ids) => {
    try { localStorage.setItem(STORAGE_KEY_FORMATS, JSON.stringify(ids)); } catch { /* ignore */ }
    set({ enabledScriptFormats: ids });
  },

  formatPreferencesInitialized: localStorage.getItem(STORAGE_KEY_FORMATS_INIT) === '1',
  setFormatPreferencesInitialized: (v) => {
    try { localStorage.setItem(STORAGE_KEY_FORMATS_INIT, v ? '1' : '0'); } catch { /* ignore */ }
    set({ formatPreferencesInitialized: v });
  },
}));
