> **Status: executed.** All 41 files below plus `open-draft/SearchReplace.tsx`
> (a live duplicate caught during cleanup, see addendum at the bottom) have
> been deleted, `ScreenplayEditor.tsx` has been cleaned of the now-dead
> imports/state/handlers/JSX that referenced them, and global keyboard
> shortcuts were extracted into `src/hooks/useGlobalShortcuts.ts` (wired into
> `App.tsx`). `tsc -b`, `vite build`, and the test suite (142/142 real tests)
> all pass. See the addendum at the end of this file for what changed since
> the original pass below.

# Dead Code Audit — post-`AppShell` rewrite

Traced from `src/App.tsx` outward (render tree + import graph), cross-checked
`src/plugins/registry.ts`, and independently verified every finding below by
grepping for actual call sites / state setters — not just "is this file
imported somewhere." Nothing has been deleted yet.

## Structural findings (context for everything below)

- **`App.tsx` does not render `AppShell`.** It renders `HeaderPanel`,
  `ScreenplayEditor`, and `StatusBar` directly:
  ```
  import ScreenplayEditor from '@/components/open-draft/ScreenplayEditor'
  import HeaderPanel from '@/components/header-panel/header-panel'
  import StatusBar from '@/components/status-bar'
  ```
  `src/components/app-shell.tsx` is a 3-line wrapper (`export default function
  AppShell() { return <HeaderPanel /> }`) that is never imported by anything.
  Confusingly, the component *inside* `header-panel.tsx` is itself named
  `AppShell` (`export default function AppShell()` at
  `header-panel.tsx:20`) — that's the one actually mounted, App.tsx just
  imports it under the local name `HeaderPanel`. `app-shell.tsx` the *file* is
  dead; the name `AppShell` lives on inside `header-panel.tsx`.

- **`pluginRegistry.register()` is never called anywhere in the repo.**
  `pluginRegistry.getRoutes()` / `.getPanels()` / `.getMenuItems()` therefore
  always resolve to empty arrays at runtime. The new dialogs under
  `src/components/plugins/*` are wired into `header-panel.tsx` via plain
  static imports, not through the registry. The registry's only *actually
  used* method is `registerGrammarProvider`, called from
  `ScreenplayEditor.tsx`. So: nothing should be flagged dead solely because
  it "looks like" a registry entry — the registry's declarative
  route/panel/menu-item surface just isn't wired up yet, and none of the
  `components/plugins/*` files depend on it to be reachable (they're reached
  via direct imports in `header-panel.tsx` instead).

- **`ScreenplayEditor.tsx` still imports and renders several old
  `open-draft` chrome components**, but the *only* code path that ever
  flipped their gating state to `true` was the old `MenuBar.tsx` (import
  removed, JSX commented out at `ScreenplayEditor.tsx:5350-5371`) or the old
  `Toolbar.tsx` (JSX commented out at `ScreenplayEditor.tsx:5376`, and the
  `StatusBar` render at `~5688` is also commented out even though the import
  at line 95 is still there). I verified this per-component by grepping for
  `setXOpen(true)` across the whole repo, not just checking whether the file
  is imported. Result: these components mount but are permanently closed —
  dead in effect, even though a naive "is it imported" check would call them
  live.

---

## DEAD — high confidence (unreachable in practice, verified via state-setter tracing)

All of these are only ever opened via a `setXOpen(true)` call that lives
exclusively inside `MenuBar.tsx` or `Toolbar.tsx`, both of which are
commented out of the render tree. Grepped `setXOpen(true)` repo-wide for each
— zero live call sites outside the dead component itself.

| File | Why dead | Confidence |
|---|---|---|
| `src/components/open-draft/MenuBar.tsx` | Import removed from `ScreenplayEditor.tsx`; its former render call is commented out. Not imported anywhere else. | High |
| `src/components/open-draft/Toolbar.tsx` | Still imported (`ScreenplayEditor.tsx:85`) but render commented out (`{/* {!isHistoryMode && <Toolbar .../>} */}`). Not imported anywhere else. | High |
| `src/components/open-draft/StatusBar.tsx` | Still imported (`ScreenplayEditor.tsx:95`) but render commented out. Replaced by `src/components/status-bar.tsx`, rendered directly from `App.tsx`. | High |
| `src/components/open-draft/ZoomPanel.tsx` | Rendered unconditionally (`<ZoomPanel />` at `ScreenplayEditor.tsx:5696`) but internally gated on `zoomPanelOpen` from the store; `setZoomPanelOpen(true)` is called nowhere in the repo. Permanently `return null`. Replaced by `header-panel/toolbar/toolbar-zoom-control.tsx`. | High |
| `src/components/open-draft/SpellCheckModal.tsx` | Gated on `spellModalOpen`; `setSpellModalOpen(true)` only in dead `MenuBar.tsx`. | High |
| `src/components/open-draft/WritingSuggestionsModal.tsx` | Gated on `grammarModalOpen`; `setGrammarModalOpen(true)` only in dead `MenuBar.tsx`. Replaced by `plugins/spelling-and-grammar/writing-suggestions-popover.tsx`. | High |
| `src/components/open-draft/GrammarRulesPanel.tsx` | Gated on `grammarRulesPanelOpen`; `setGrammarRulesPanelOpen(true)` only in dead `MenuBar.tsx`. Replaced by `plugins/spelling-and-grammar/grammar-settings-dialog.tsx`. | High |
| `src/components/open-draft/OpenFile.tsx` | Gated on `openFileOpen`; `setOpenFileOpen(true)` only in dead `MenuBar.tsx`. | High |
| `src/components/open-draft/CompareVersionPicker.tsx` | Gated on `compareVersionOpen`; `setCompareVersionOpen(true)` only in dead `MenuBar.tsx`. | High |
| `src/components/open-draft/TitlePageEditor.tsx` | Gated on `titlePageEditorOpen`; `setTitlePageEditorOpen(true)` only in dead `MenuBar.tsx`. Replaced by `plugins/title-page-setup-dialog/title-page-editor.tsx`. | High |
| `src/components/open-draft/MoresContdsDialog.tsx` | Gated on `moresContdsOpen`; `setMoresContdsOpen(true)` only in dead `MenuBar.tsx`. **Note:** there is a same-named `MoresContdsDialog` component in `plugins/mores-continued/mores-continued-dialog.tsx` — that one is live (imported by `header-panel.tsx`). Don't confuse the two files during removal. | High |
| `src/components/open-draft/JoinCollabDialog.tsx` | Gated on local `joinCollabOpen` state; only setter to `true` is `onJoinCollab={() => setJoinCollabOpen(true)}`, itself inside the commented-out `MenuBar` JSX block. | High |
| `src/components/open-draft/PageSetupDialog.tsx` | Only referenced by dead `MenuBar.tsx`. Replaced by `plugins/page-setup/page-setup-dialog.tsx`. | High |
| `src/components/open-draft/ScriptFormatPickerDialog.tsx` | Only referenced by dead `MenuBar.tsx`. No `plugins/` equivalent found — check with user whether this feature exists in the new UI at all before removing (functionality may simply be gone, not relocated). | High (dead) / flag functionality gap |
| `src/components/open-draft/ScriptFormatPreferencesDialog.tsx` | Only referenced by dead `MenuBar.tsx`. Same functionality-gap flag as above. | High (dead) / flag functionality gap |
| `src/components/open-draft/TemplateSelectDialog.tsx` | Only referenced by dead `MenuBar.tsx`. Replaced by `plugins/template-editor/template-editor.tsx`. | High |
| `src/components/open-draft/TemplateConflictDialog.tsx` | Only referenced by `TemplateSelectDialog.tsx` (itself dead, above). | High |
| `src/components/open-draft/TemplateEditorDialog.tsx` | Only referenced by `TemplateSelectDialog.tsx` (itself dead, above). Replaced by `plugins/template-editor/template-editor.tsx` + `element-detail-panel.tsx`/`element-list-panel.tsx`. | High |
| `src/components/open-draft/AuthIndicator.tsx` | Only referenced by dead `MenuBar.tsx`. No replacement found in new chrome — flag as functionality gap. | High (dead) / flag functionality gap |
| `src/components/open-draft/RecoverBackupDialog.tsx` | Only referenced by dead `MenuBar.tsx`. No replacement found — flag as functionality gap. | High (dead) / flag functionality gap |
| `src/components/open-draft/ColorPicker.tsx` | Only referenced by dead `Toolbar.tsx`. | High |
| `src/components/open-draft/LanguageSelector.tsx` | Only referenced by dead `Toolbar.tsx`. | High |
| `src/components/open-draft/DictionaryConfigPanel.tsx` | Only referenced by dead `GrammarRulesPanel.tsx` (above). Replaced by `plugins/spelling-and-grammar/dictionary-settings/dictionary-config-dialog.tsx`. | High |
| `src/components/open-draft/DictionaryLibrary.tsx` | Only referenced by dead `GrammarRulesPanel.tsx` (above). Replaced by `plugins/spelling-and-grammar/dictionary-settings/dictionary-library-dialog.tsx`. | High |
| `src/components/app-shell.tsx` | Never imported anywhere (see structural findings above). | High |

## DEAD — high confidence (fully orphaned, zero references anywhere)

Grepped each filename as an import path across all of `src/` — zero hits
outside the file itself.

| File | Why dead | Confidence |
|---|---|---|
| `src/components/open-draft/AuthGate.tsx` | Never imported. Every hit for "AuthGate" elsewhere in the repo is a comment describing its former role (`services/api.ts`, `services/cloudApi.ts`, `services/authedFetch.ts`, `SaveAsDialog.tsx`, `MenuBar.tsx`, `ScreenplayEditor.tsx`) — not an import. Auth-prompt UI appears to have no live mount point at all currently; flag as functionality gap. | High |
| `src/components/open-draft/VerifyEmailDialog.tsx` | Only referenced by dead `AuthGate.tsx`. | High |
| `src/components/open-draft/QuotaExceededDialog.tsx` | Only referenced by dead `AuthGate.tsx`. | High |
| `src/components/open-draft/AuthBootstrap.tsx` | Zero references anywhere. | High |
| `src/components/open-draft/DemoBanner.tsx` | Zero references anywhere. | High |
| `src/components/open-draft/MobileAccessoryBar.tsx` | Zero references anywhere. | High |
| `src/components/open-draft/OneDriveWarningDialog.tsx` | Zero references anywhere. | High |
| `src/components/open-draft/ProjectList.tsx` | Zero references anywhere. | High |
| `src/components/open-draft/ProjectView.tsx` | Zero references anywhere. | High |
| `src/components/open-draft/ResetPasswordRoute.tsx` | Zero references anywhere, including `main.tsx` (no router `<Route>` wiring exists for it — `main.tsx` only mounts `<App />` inside `<BrowserRouter>`). | High |
| `src/components/open-draft/VerifyEmailRoute.tsx` | Same as above — no router wiring found anywhere. | High |
| `src/components/open-draft/SettingsPage.tsx` | Zero references anywhere. | High |
| `src/components/open-draft/TreatmentEditor.tsx` | Zero references anywhere. | High |
| `src/components/open-draft/SaveErrorDialog.tsx` | Zero references anywhere. | High |
| `src/components/open-draft/StorageFallbackDialog.tsx` | Zero references anywhere. | High |
| `src/components/open-draft/SpellCheckContextMenu.tsx` | Zero references anywhere. | High |

---

## NOT dead — but flagged for your attention

- **`src/components/open-draft/GoToPage.tsx` is a live duplicate, not dead
  code.** It mounts unconditionally from `ScreenplayEditor.tsx:5778`
  (`{!isHistoryMode && <GoToPage onGoToPage={handleGoToPage} />}`) and has
  its own global `keydown` listener that opens itself on Cmd/Ctrl+G,
  independent of any menu. Meanwhile `header-panel.tsx` also renders
  `plugins/goto-page/goto-page-dialog.tsx`, driven by its own local
  `useState`, opened from the toolbar/menu. **Both are simultaneously live
  and disconnected from each other** — this is a real duplication bug, not
  removable dead code. Decide which one should own "go to page" before I
  touch it; removing the wrong one changes behavior (loses either the
  keyboard shortcut or the menu/toolbar entry point).

---

## NEEDS-MANUAL-CHECK

- **`ScriptFormatPickerDialog.tsx`, `ScriptFormatPreferencesDialog.tsx`,
  `AuthIndicator.tsx`, `RecoverBackupDialog.tsx`, `AuthGate.tsx` (+ its
  children)** — these are dead code by reachability, but I could not find
  *any* new-UI replacement for what they did (script-format picking/prefs,
  auth status indicator, backup recovery, sign-in gating/quota/verify-email
  prompts). Before deleting, confirm whether these features are intentionally
  dropped for now, or still need a home in the new `header-panel`/`plugins`
  structure — deleting without replacing would silently remove
  functionality rather than just cleaning up dead code.
- **Backend/router wiring for `ResetPasswordRoute.tsx` /
  `VerifyEmailRoute.tsx`** — confirmed no `<Route>` exists for either in
  `main.tsx` or anywhere else, but if password-reset/email-verify links are
  emailed to users with URLs expecting these routes, removing them changes
  external-facing behavior, not just internal cleanup. Worth a quick sanity
  check on whether these are meant to be reintroduced.

## Explicitly out of scope per your instructions

- Shortcut logic (e.g. commented-out `setGoToPageOpen` in
  `header-panel/use-header-menu.ts:160`) — not flagged, shortcuts are known
  to be unimplemented.

---

## Summary counts

- **24** files in the "unreachable via dead state-setter chain" table
- **16** files fully orphaned (zero references anywhere)
- **1** live duplicate bug flagged (not for deletion, needs a decision)
- **5** files flagged needs-manual-check for functionality-gap risk before deletion

## Addendum — execution notes

Per your direction: functionality-gap items were fine to drop as-is (they're
intentional), `open-draft/GoToPage.tsx` was removed in favor of the
`plugins/goto-page` dialog, and the password/email-verify routes are dead
because cloud/collab is being retired (this is now a local, solo-editing
tool).

**A second live duplicate was caught during cleanup, not in the original
pass:** `open-draft/SearchReplace.tsx` reads the *same* store field
(`searchOpen`) as the new `plugins/search-replace/search-replace-comp.tsx`,
and both were mounted unconditionally in `ScreenplayEditor.tsx`. Since the
new component already self-wires its own Cmd/Ctrl+F shortcut and is driven
by the same store field, the old one would render on top of it any time
search was opened from the new menu/toolbar/shortcut. It's been deleted
alongside `GoToPage.tsx` for the same reason — this is why the original
audit's "rendered but inert" classification for `SearchReplace.tsx` was
wrong; it was live, not dead. Worth knowing in case a similar
shared-store-field collision shows up elsewhere later.

**`ScreenplayEditor.tsx` cleanup** removed ~570 lines: the dead imports,
destructured store fields, JSX render blocks, and now-orphaned handler
functions that only existed to feed the deleted dialogs
(`handleOpenFile` — ~300 lines, `handleCompareVersionSelect`,
`handleJoinCollab`, plus the two spell/grammar-modal "keep plugin enabled
while open" effects, since the new spell-check/grammar popovers manage that
themselves). The commented-out old `MenuBar`/`Toolbar`/`StatusBar` JSX blocks
were deleted outright rather than left as comments, since they referenced
files that no longer exist.

One side effect worth flagging: **`handleOpenFile` was the only code path
that opened a different script from an existing project** (browse → pick →
load). With `OpenFile.tsx` gone and no replacement dialog wired into the new
header panel, and no `<Route>` in `main.tsx` handling project/script URLs
either, there is currently no UI path to switch to a different saved script.
Given the shift to a local solo-editing tool this may be intentional, but
flagging it explicitly since it's a capability loss, not just cleanup.

**Global shortcuts** (`src/hooks/useGlobalShortcuts.ts`, wired into
`App.tsx`): New Screenplay (⌘N), Save (⌘S — direct save via
`buildSaveContent` + `scriptApi.saveScript`, opens Save As if no project
yet), Save As (⌘⇧S), Print (⌘P), Zoom In/Out (⌘+/⌘−), Spell Check (F7),
Grammar (⇧F7). **Deliberately not bound: Cmd/Ctrl+F and Cmd/Ctrl+G** — both
are already self-wired inside `search-replace-comp.tsx` (Cmd+F opens it,
Cmd+G is "find next" within it), and the old MenuBar's Cmd+G→Go-to-Page
binding would have collided with that. Go to Page currently has no keyboard
shortcut as a result — only the toolbar/menu entry point. Let me know if
you'd rather free up Cmd+G for Go-to-Page and move find-next to F3-only (it
already responds to F3 too).
