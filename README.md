# RPG Sceneplay

A screenplay editor repurposed for solo and GM-less tabletop RPG play. You write scenes the way a screenwriter would, but the structure underneath is built for game state, not prose.

RPG Sceneplay can be accessed for free at https://gcoulby.github.io/rpg-sceneplay

## Why this exists

Solo RPG note-taking usually means a Cornell-style notebook or a wiki. Neither captures a session the way it actually happens: as discrete scenes with a trigger, an obstacle, and an outcome. Screenwriting software gets closer, because it forces you to commit to a scene heading before you write anything under it. Final Draft, Fade In, and Scrivener were all looked at for this reason, but none of them are built for _game-state_ causality; they're built for _dramatic_ causality (goal, conflict, disaster).

So this is a screenplay editor with the grammar swapped out: instead of scene/action/dialogue for film, it uses S.T.A.R.T. (Scene, Task, Action, Resolve, Transition) for solo play, while keeping dialogue support for character interaction.

## What it's built on

This is a clone-and-own of [OpenDraft](https://github.com/Proteus-Technologies-Private-Limited/OpenDraft) (MIT licensed, React 19 / TypeScript / Vite / TipTap), which already had the screenplay editor architecture this needed: scene navigator, character/location autocomplete, Fountain/FDX import and export.

It's a clone rather than a maintained GitHub fork, on purpose. 1. The original Open Draft was proclaimed as being vibe coded in a few days. Also the vibe code was truly the vibiest code I've even seen. 5k line files, and huge context coupling across the board. So why use it at all?... Simple, the output is good, and the tokens are already spent I may as well make use of them. I rebuilt the entire chrome of this app, new menubar, sidebar, dialogs, popups, all built using Shadcn components for a consistent UI/UX. The second reason is that Open Draft is basically a clone of the likes of final draft/fade in, which means the base of this app has grounded Screenwriting principles.

Licensing: one root `LICENSE` file, MIT, with both copyright holders listed (Proteus Technologies and myself), since this is one MIT codebase extended with more MIT code, not a mix of licence types.

## What's in the app

Everything below is live, not planned. The app itself has an in-app **Help** dialog (Help menu, or `?`) covering the same ground with more detail — this is the short version.

### Main tabs

The top tab bar switches between full-screen workspaces:

- **Editor** — the screenplay/sceneplay document itself.
- **Character Sheet** — one sheet per character; a sheet survives if its character is deleted (it's orphaned and reassignable, not deleted with them).
- **Map** — a hex or grid map (chosen on first load, changeable later in map settings); click a cell to add a feature.
- **Beat Board** — a beat-level, drag-and-drop overview of the session.
- **Statistics** — document statistics (word/page counts, element breakdowns, etc.).
- **Oracles** — full-screen oracle table browser (a larger view of the sidebar Oracles panel).
- **PDFs** — import PDFs (rulebooks, character sheets, handouts), fill their form fields, mark them up, and search them, all saved inside the `.sceneplay` file. See [PDF tools](#pdf-tools) below.
- **Acknowledgements** — licensing and credit for every oracle/table source and tool in use.

### Sidebar panels

The left activity bar opens contextual panels alongside the editor:

- **Scenes** — scene list for the current document.
- **Pages** — page-by-page navigation.
- **Locations** — locations referenced in the script.
- **Structure** — outline/structure view of the document (acts, sequences).
- **Tags** — tag categories and entities, with occurrence tracking back into the script.
- **Notes** — freeform notes attached to the project.
- **Characters** — character profiles, each linked to its own Character Sheet.
- **Index Cards** — card-based scene overview, reorderable.
- **Oracles** — browse oracle sources, collections, and tables.
- **Inspiration** — Story Cubes and other prompt-based inspiration tools.
- **Dice Roller** — standalone freeform dice-notation roller.
- **Rolls** — history of rolls anchored to positions in the document, browsable after the fact.
- **PDF Tools** — opens the PDFs main tab and adds a Pages/Search panel for whichever PDF is active. See below.

### Oracles & dice

Right-click in the editor → **Roll...** opens the Roll dialog (Oracle | Fate | Dice | Manual tabs). Confirming a roll inserts a Roll Anchor at the cursor and records it in the Rolls panel, so a roll made mid-scene stays tied to the moment it happened rather than living in a separate app or a scratch pad. The same dialog and dice engine back the sidebar's Dice Roller and Rolls panels, the Character Sheet's roll buttons, and — inside an imported PDF — any hyperlink written as a Google search for a roll (e.g. `roll 2d20`), which gets hijacked to roll in-app instead of leaving the document.

### PDF tools

A PDF isn't a separate file living next to your document — it's imported straight into the `.sceneplay` file (as a zip archive internally, so binary assets don't pay JSON's base64 overhead) and travels with it. Per embedded PDF:

- **Fill mode** — AcroForm fields are editable in place; values persist with the document.
- **Markup mode** — FreeText, Ink, Highlight, and Stamp annotations, drawn directly on the page.
- **Import modes** — bring in the full document, or extract a single page (e.g. just the character sheet page out of a 200-page rulebook) and discard the rest.
- **Page browser & full-text search** — the PDF Tools sidebar panel lists page thumbnails and lets you fuzzy-search the whole document's extracted text (via Fuse.js) for a term and jump straight to the page it's on, with a brief highlight flash on the match. This is separate from the in-page Find in the PDF toolbar, which is exact and scoped to the current page.
- In-document links (a table of contents, a cross-reference) navigate correctly inside the viewer rather than trying to leave the app.

### Writing tools

Spell check and grammar checking (via [harper.js](https://github.com/Automattic/harper), running locally — nothing leaves the browser), find & replace, go-to-page, page setup, a title page editor, a "Mores/Continueds" pagination helper, and a template editor for adjusting element formatting. All live in the header menu bar.

## The S.T.A.R.T. template

A new template, **RPG Sceneplay (S.T.A.R.T.)**, sits alongside OpenDraft's original Film Screenplay template without touching it. It adds two new element types:

- **Task** — styled like the old Lyrics element (italic, single-line prompt)
- **Resolve** — styled like End of Act (bold, uppercase, centred)

The RPG template exposes exactly 8 element types, in this order, across the element chooser menu, the right-click context menu, and the number-key shortcuts (1–8):

1. Scene Heading
2. Task
3. Action
4. Resolve
5. Transition
6. Character
7. Dialogue
8. Parenthetical

The Enter-key flow is deliberate: Scene Heading → Task → Action. Action loops on itself (a beat can span several action lines, it shouldn't force you into Resolve). Resolve is reached manually, then flows to Transition, then back to Scene Heading.

The S.T.A.R.T. System is derived from The GrouchCouch's Solo Game Loop. The Solo Game Loop is ©2026 TheGrouchCouch - https://thegrouchcouch.com

The Film Screenplay template is untouched and still exposes OpenDraft's full original element set (Shot, General, Cast List, New Act, Lyrics, Show/Episode, etc.) for anyone using this purely as a screenwriting tool.

## File formats

- **`.sceneplay`** — the native format and source of truth. A zip archive (not flat JSON) so embedded assets — images, PDFs — store as raw bytes rather than base64 text.
- **`.odraft`** — the legacy OpenDraft format, still imported and exported alongside `.sceneplay`.
- **`.fountain`** / **`.fdx`** — supported for interop, but treated as lossy one-way exports. Task and Resolve don't have a Fountain or Final Draft equivalent, so round-tripping through them will lose that structure. Importing maps an `.fdx` "End of Act" to Resolution and a Fountain Lyric line (`~`) to Task, as their closest analogues; this is a stated scope decision, not an oversight.
- **`.docx`** / **PDF export** — one-way export for sharing a script outside the app.

## Storage

The File System Access API (`showSaveFilePicker` / `showOpenFilePicker`) is the primary save path, so the file genuinely lives on your disk rather than in browser storage that can get wiped. IndexedDB is the fallback for browsers without File System Access support (Safari, Firefox), since `localStorage` caps out around 5–10MB and won't hold anything with images or PDFs. Autosave runs on a debounced scheduler with a slower safety-net interval behind it, so state changes that don't go through the main text-editing flow (a store mutation from a panel) still get picked up.

Everything is local-first: no server, no account, no lock-in. A session lives in a `.sceneplay` file you own, on disk or in your browser's own storage — never on someone else's server.
