# Dead Code Audit — Round 3, post activity-bar/tabs overhaul

> **Status: executed.** All 11 originally-listed files plus `SceneNavigator.tsx`
> and the transitively-dead `SynopsisModal.tsx` (13 files total) have been
> deleted. `ScreenplayEditor.tsx` and `use-toolbar.tsx` were cleaned of the
> references, and the confirmed-dead `isHistoryMode` branches were simplified
> or removed (see addendum at the bottom). `tsc -b`, `vite build`, and the
> test suite (142/142 real tests) all pass.

Since the last pass, `App.tsx` was rewritten around a new entry structure:
`AppNavigator` (activity bar + resizable/tabbed side panels under
`src/components/left-side-panel/`) and a top-level `Tabs` component
switching between "Editor" (`ScreenplayEditor`), "Beat Board"
(`src/components/screens/beat-board.tsx`), and "Script Statistics"
(`src/components/screens/analytics/ScriptStatistics.tsx`). This round traces
what that leaves behind in `src/components/open-draft/` and flags two stray
duplicate files inside the new structure itself.

Every finding below was independently verified by grepping for the real
gating state's setter — not just "is this file imported" — since the last
two passes both turned up live components hiding behind dead-looking
wrappers, and duplicate-live-UI bugs hiding behind components that looked
dead. Same rigor here.

## Confirmed dead — commented out entirely

These four are still imported in `ScreenplayEditor.tsx`, but their JSX is
inside a literal `{/* ... */}` block (lines 5060–5084) — not gated by a
false boolean, just commented out. All are superseded by new
left-side-panel equivalents wired into `AppNavigator.tsx`:

| File | Superseded by |
|---|---|
| `open-draft/ScriptNotes.tsx` | `left-side-panel/notes-tab/NotesPanel.tsx` |
| `open-draft/CharacterProfiles.tsx` | `left-side-panel/character-panel/CharacterProfilesPanel.tsx` |
| `open-draft/TagsPanel.tsx` | `left-side-panel/tags-panel/TagsPanel.tsx` |
| `open-draft/LocationDatabase.tsx` | `left-side-panel/locations-panel/LocationsPanel.tsx` |

Transitively dead alongside them (only importer is the dead file above):
- `open-draft/MiniRichText.tsx` — only used by `CharacterProfiles.tsx`. (Not
  to be confused with the live, separate
  `left-side-panel/character-panel/MiniRichText.tsx`, used by
  `CharacterFieldsForm.tsx`/`CharacterVoiceProfileSection.tsx` — different
  file, same name, don't delete the wrong one.)
- `open-draft/RelationshipMap.tsx` — only used by `CharacterProfiles.tsx`.
  Superseded by `left-side-panel/character-panel/RelationshipMap.tsx`,
  used by the live `CharacterProfilesPanel.tsx`.

## Confirmed dead — rendered, but gating state has zero live setter

Same pattern as the prior two rounds: still mounted, but the boolean that
would make them visible is never flipped `true` by anything reachable.

- **`open-draft/IndexCards.tsx`** — rendered unconditionally in
  `ScreenplayEditor.tsx` (only gated by `!isHistoryMode`), but self-gates
  internally on `indexCardsOpen` (`if (!indexCardsOpen) return null`), which
  defaults `false`. `toggleIndexCards` has zero external callers — its only
  usage is the component's own close button. Superseded by
  `left-side-panel/index-card-panel/IndexCardsPanel.tsx`.
- **`open-draft/BeatBoard.tsx`** — gated on `beatBoardOpen`. `toggleBeatBoard`
  has zero callers anywhere in the codebase. Superseded by the new
  "Beat Board" tab in `App.tsx` rendering `screens/beat-board.tsx` directly.
- **`open-draft/ScriptStatistics.tsx`** — gated on `statisticsOpen`.
  `setStatisticsOpen(true)` has zero callers anywhere (only
  `setStatisticsOpen(false)` exists, in the component's own close button).
  Superseded by the new "Script Statistics" tab rendering
  `screens/analytics/ScriptStatistics.tsx` directly.

## Stray duplicate files inside the new structure itself

Not old code — leftovers from building the new panels, never wired in:

- **`src/components/left-side-panel/LocationsPanel.tsx`** (top-level) — zero
  importers anywhere. `AppNavigator.tsx` imports `LocationsPanel` from
  `./locations-panel/LocationsPanel` (the subfolder version) instead.
- **`src/components/left-side-panel/TagPanel.tsx`** (singular, top-level) —
  zero importers anywhere. `AppNavigator.tsx` imports `TagsPanel` (plural)
  from `./tags-panel/TagsPanel` instead.

## Not dead — a live duplicate-UI bug, same class as the SearchReplace/GoToPage ones from round 2

**`open-draft/SceneNavigator.tsx` is still fully live and renders
alongside the new left-side-panel simultaneously.** It's mounted
unconditionally in `ScreenplayEditor.tsx` (only gated by `!isHistoryMode`),
and its own visibility state `navigatorOpen` **defaults to `true`** on
desktop in `editorStore.ts`. This is a self-contained tabbed
Scenes/Pages/Locations/Structure panel — functionally the same job as the
new `scenes-panel`/`pages-panel`/`locations-panel`/`structures-panel`, now
wired into `AppNavigator`/`ActivityBar`. Since `navigatorOpen` defaults
`true`, **both the old sidebar and the new activity-bar panels are visible
at once on the editor tab by default right now.** `toggleNavigator` is
still reachable too (swipe gesture + the panel's own close button), so this
isn't unreachable dead code — it's actively double-rendering. `SynopsisModal`
(open-draft) rides along as live via `SceneNavigator`, not dead.

This is the highest-impact finding in this pass — worth fixing before/along
with the dead-code removal, since it's a visible regression, not cleanup.

## Dead logic (not a dead file)

**`src/components/header-panel/toolbar/use-toolbar.tsx`** computes
`notes: { active: scriptNotesOpen, toggle: toggleScriptNotes }` and
`tags: { active: tagsPanelOpen, toggle: toggleTagsPanel }` (lines 281–282),
but `header-panel-toolbar.tsx` — the hook's only consumer — never reads
`toolbar.notes` or `toolbar.tags`. Presumably leftover from before the
toolbar was redesigned. Low risk, small removal.

## Verified still live — not touched

`ElementPicker`, `CharacterAutocomplete`, `ScriptContextMenu`, `FormatPanel`
(open-draft, still on hold per your last instruction), `AssetManager`,
`AssetViewer`, `SaveAsDialog`, `WelcomeDialog`, `Toast`, `FontPicker`
(open-draft) — all still reachable via real, traceable triggers.
`status-bar.tsx` and `header-panel.tsx` are unaffected by the tabs overhaul
(rendered outside the `Tabs`, don't reference tab state). Note: this list no
longer includes `SynopsisModal` (open-draft) — see addendum, it went with
`SceneNavigator`.

## Needs-manual-check / product decisions, not code questions

- **`StatusBar` shows editor-only info** (page count, active element,
  revision) but now renders unconditionally across all three tabs (editor /
  beat board / statistics) since it sits outside the `Tabs` in `App.tsx`.
  Not dead code, but worth deciding whether it should hide or change on the
  non-editor tabs.
- **Whether `navigatorOpen` defaulting to `true` was intentional** (e.g. a
  deliberate transition period running both nav systems) or an oversight —
  a product call, not something I can infer from code.

## Summary

- 4 commented-out dead components + 2 transitively-dead children = 6 files
- 3 dead-by-unreachable-state components = 3 files
- 2 stray duplicate files in the new structure = 2 files
- **11 files total, high confidence on all**
- 1 live duplicate-UI bug (`SceneNavigator`) — not a deletion candidate on
  its own; needs a decision on which nav system wins
- 1 small dead-logic cleanup in `use-toolbar.tsx`

Let me know how you want to handle `SceneNavigator` (rip it out now as part
of this pass since the new panels replace it, or leave both running for a
transition period), and I'll go ahead with the rest.

## Addendum — execution notes

Per your direction: all files marked "these all look fine" were left
untouched; `open-draft/SceneNavigator.tsx` was old code fully replaced by
the activity bar, so it was deleted along with the rest rather than kept for
a transition period. `SynopsisModal.tsx` (open-draft) — its only two
referrers were `SceneNavigator.tsx` and the already-dead `IndexCards.tsx` —
went with it as transitively dead (the new `ScenesPanel.tsx` and
`IndexCardsPanel.tsx` under `left-side-panel/` each have their own working
`SynopsisModal` usage already, unaffected).

Deleting `SceneNavigator.tsx` also meant its resize-handle/width machinery
in `ScreenplayEditor.tsx` (`navWidth`, the left resize handle,
`toggleNavigator`, the left-edge swipe gesture) had nothing left to resize.
While tracing that, the **right**-side panel resize shell turned out to be
dead for the identical reason: `rightPanelVisible` was
`scriptNotesOpen || characterProfilesOpen || tagsPanelOpen ||
locationDatabaseOpen` — the exact four flags for the four components deleted
in the first half of this pass (already commented out before this round even
started). So the right resize handle, `rightPanelWidth`, and the right-edge
swipe (`toggleScriptNotes`) were removed too — neither panel had rendered
anything in a long time, they were just an empty resizable sliver on each
side.

### `isHistoryMode`

Confirmed dead as you said: it's `Boolean(urlCommitHash)`, and `urlCommitHash`
comes from `useParams()` — but there is no `<Route>` anywhere in the app
(`main.tsx` just renders `<App />` directly inside `BrowserRouter`), so every
`useParams()` value (`urlProjectId`, `urlScriptId`, `urlCommitHash`,
`urlCollabToken`) is permanently `undefined`. Simplified/removed the parts
that were cheap and safe to touch:
- The editor-extension array's `isHistoryMode ? [] : [...]` spread always
  took the `else` branch — those 4 extensions are now included
  unconditionally.
- `editable` and the editor's CSS class no longer reference `isHistoryMode`.
- The two session-doc stash/restore effects, the collab-host-switch check,
  and `useBackupScheduler` no longer branch on it (also removed the
  now-unreachable `isHistoryMode` field from `useBackupScheduler`'s options
  interface).
- The "Viewing version X — Read Only" banner and its backing
  `historyVersionLabel` state were deleted outright — gated by `isHistoryMode`
  being `true`, which never happens.
- Inside the "load script from URL" effect, `setCurrentScriptId(isHistoryMode
  ? null : urlScriptId)` simplified to just `setCurrentScriptId(urlScriptId)`,
  and the `isHistoryMode && urlCommitHash` branch (fetching a specific
  version via `api.getScriptAtVersion`) was removed — always fell through to
  the normal `scriptApi.getScript` call anyway.

**Bigger finding surfaced while tracing this, deliberately not acted on:**
that same "load script from URL" effect is gated at its very top by
`if (!editor || !urlProjectId || !urlScriptId) return` — and since those
params are *also* always `undefined` (no routes, as above), the **entire
effect body never runs at all**, not just its `isHistoryMode` branch. That's
a much bigger and riskier chunk of code (~150+ lines covering metadata
restore, dictionary merge, etc.) than what you asked me to touch here, so I
left it as-is rather than fold it into this pass. Worth its own review
whenever you're ready to decide how scripts should actually load without
URL-based routing.

Verified after this pass: `tsc -b` clean (same one pre-existing unrelated
`scroll-area.tsx` error), `vite build` succeeds, all 142 real tests pass, no
stale references to any of the 13 deleted files anywhere in `src/`.
