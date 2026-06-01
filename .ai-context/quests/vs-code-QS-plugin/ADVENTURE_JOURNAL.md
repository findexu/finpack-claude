---
quest: vs-code-QS-plugin
realm: app
scroll: ADVENTURE_JOURNAL
last-updated: 2026-05-29
---
# Adventure Journal — vs-code-QS-plugin
Append-only. One entry per expedition. Never rewrite history.

## Expedition 2026-05-29 (sixth)
### Conquered
- Implemented the designer mockup (delegated visual build to fp-frontend-designer; main loop wired the seam + tests + CSP audit).
- Design tokens (mockup palette + type scale 22/14/12/11/10/9 + 4px spacing).
- Responsive layout via CSS container-query on `.card`: wide (>=460px) = two-column top (hero stage | status panel over nameplate panel) + stats row of 6; narrow = single column, stats 3x2, badges 3-shelf.
- Ornate gold double-border frame + corner flourishes; three framed panels (hero-stage / status / nameplate).
- Hero stage in CSS/SVG: stone pedestal + glowing rune ring + dungeon-arch backdrop + sparkles; SVG hero layered; glow/twinkle animation (reduced-motion gated).
- Phase banner restyle (icon-tile + label + sublabel, per-phase color).
- Badge medallions: earned (gold + star) / ready (teal pulse) / locked (dark + inline padlock SVG hiding the icon) + counters, on wood shelves.
- Empty states restyled (NoAdventurer / Unsupported / Error).
- Asset seam: avatar.png, badge-sheet.png, AND hero-frames.png (4-frame steps() idle) auto-detected via fs.stat; SVG/CSS fallback.
- 52/52 tests green; compile clean; CSP audited (no inline style/script/external).
### Oaths Sworn
- Responsive layout uses a CSS container-query on `.card` (container-type: inline-size) so reflow keys off the sidebar's own width, not the viewport.
- Hero 4-frame idle convention: horizontal sheet of 4 square frames; rendered as an SVG <image> (viewBox 64, image width 256) stepped left via steps(4) — presentation attrs only, CSP-safe.
- Locked badges render an inline padlock SVG in place of the badge glyph.
### Cursed / Uncertain
- Pixel art still placeholder: hero = SVG, badges = emoji. Awaiting designer PNGs: hero-frames.png (4 square frames), badge-sheet.png (240x16), optional avatar.png. They auto-swap via fs.stat.
- quest-dashboard/ STILL uncommitted on main across six expeditions — must commit.
### The Road Ahead
- Drop in the designer's pixel assets when delivered (no code change).
- Commit the extension on a branch, then /complete-quest.

## Expedition 2026-05-29 (fifth)
### Conquered
- Phase-reactive status bar (codicon swaps per phase).
- Ready-to-unlock badge state (threshold met, not yet awarded -> green glow).
- HD animated pixel-art hero `src/webview/heroSprite.ts` (SVG rect grid, idle bob / orb pulse / blink), used as the avatar placeholder.
- Full visual redesign of the character sheet (delegated to fp-frontend-designer): dusk-violet palette, framed panels with gold bracket corners, restyled phase banner / nameplate / stats / badges / chart / empty states.
- Design tweaks: switched body text to a readable UI sans (dropped the pixel/no-smoothing font); stats compressed to one compact row of 6; phase banner + active quest grouped into one "status" panel; "Expeditions" displayed as "Journeys".
- Badges redesigned as a trophy bookshelf (rows of 5 on wooden ledges); nameplate plaque attached to each badge's bottom; fixed-size icon box so all icons match.
- 49/49 tests green; compile clean; user-tested live across all changes.
- Wrote a designer brief (spec + deliverables) to hand off for professional design/assets.
### Oaths Sworn
- Body text uses a readable UI sans font (var(--vscode-font-family) fallback to system); pixel rendering reserved for the hero + badge sprites only.
- Stats render as a single compact row of 6 with short labels.
- Phase banner + active quest are grouped in one framed status panel (read as one block).
- Badges use a trophy-bookshelf layout (wood ledges); each badge has a bottom nameplate plaque + a fixed-size icon box.
- "Expeditions" is shown as "Journeys" in the UI — display label only; the internal term is unchanged.
- Visual design is delegated to fp-frontend-designer under strict CSP rules; it edits/returns code and the main loop audits CSP (no inline styles/scripts/external resources) + compiles.
### Cursed / Uncertain
- Art is still placeholder: hero is a hand-authored SVG, no badge sprite sheet yet. A pro designer brief was shared; awaiting mockups/assets. (woff2 pixel font no longer needed — UI sans chosen for legibility.)
- quest-dashboard/ remains UNCOMMITTED on main across all five expeditions — overdue.
### The Road Ahead
- Incorporate the designer's mockups + assets (SVG preferred, or transparent PNG sprites) when they arrive.
- Optional: badge sprite sheet (uniform icon set).
- Commit the work on a branch, then /complete-quest.

## Expedition 2026-05-29 (fourth)
### Conquered
- `src/phaseDetector.ts`: pure `detectPhase(strategy, journal, hasActiveQuest)` -> QuestPhase (Planning/Ready/Embarked/AtCamp/NoQuest), 6 tests.
- `QuestPhase` const-union + `QuestState.phase`; stateManager reads STRATEGY+JOURNAL bodies and computes phase.
- Migrated character sheet from editor-tab `WebviewPanel` to sidebar `CharacterSheetView` (WebviewViewProvider); two stacked views (Character webview over Active Quest tree); `openCharacterSheet` command removed; status-bar click uses the auto `<viewId>.focus` command.
- Phase banner + CSS animations (avatar idle-bob, banner pulse, EXP shimmer); narrow ~300px responsive reflow; all motion gated by prefers-reduced-motion.
- Tree dropped `resourceUri` -> no more git "U" decorators.
- 47/47 tests green; compile clean; user-tested live in the host.
### Oaths Sworn
- WebviewView lifecycle differs from WebviewPanel: set `webview.options` inside `resolveWebviewView`, no `reveal`/`show`; focus via the auto-registered `questDashboard.characterSheet.focus` command.
- Phase reads "At Camp" during active work because /embark writes no journal entry; "Embarked" only lights when an entry is left open. Accepted as a data-model limit, documented in phaseDetector.ts.
- 4-phase taxonomy (not 5): Scouting vs Planning is indistinguishable from files.
### Cursed / Uncertain
- "Embarked" phase rarely triggers (no embark-time journal marker). Could add one only by changing quest-system itself — out of scope.
- Pixel art still placeholder: transparent avatar.png, badge-sheet.png (240x16), OFL woff2 font all pending.
### The Road Ahead
- Receive transparent avatar.png (<=512px) + badge-sheet.png + OFL woff2 font; drop in, reload.
- Then /complete-quest once satisfied.

## Expedition 2026-05-29 (third)
### Conquered
- `src/webview/escape.ts`: HTML escaper (XSS defence in depth).
- `src/webview/buildBadgeGrid.ts`: 15 badges, earned-lit / locked-dimmed + progress counter; emoji placeholder or CSP-clean SVG `<image>` sprite cell when a sheet is supplied.
- `src/webview/buildExpChart.ts`: hand-rolled inline SVG polyline; "no history yet" when empty.
- `src/webview/buildCharacterSheet.ts`: full HTML doc, strict CSP, SVG-pixel avatar placeholder + SVG EXP bar, stats grid, composes badges + chart, all LoadingState empty states.
- `src/surfaces/characterSheet.ts`: singleton WebviewPanel, full-HTML rebuild on update, resolves avatar.png/badge-sheet.png via fs.stat (null -> placeholder).
- `extension.ts`: stub replaced -> openCharacterSheet opens the live panel; sheet registered as a surface.
- `.vscode/launch.json` + `tasks.json`: F5 opens the host on the finpack-claude root.
- 9 webview builder tests (38 total green). Compile clean.
- **F5 live-verified**: status bar, tree (opens scrolls), and character sheet all render from real quest data. Resolves last camp's "F5 unverified" curse.
### Oaths Sworn
- Webview uses NO inline style attributes (a strict style-src nonce CSP blocks them): EXP bar and badge sprites are SVG (presentation attrs); all CSS lives in one nonce'd <style>.
- `enableScripts: false` + full-HTML rebuild on each update instead of postMessage — state is cheap, no client JS, tighter CSP. (Supersedes the earlier postMessage plan.)
- `activationEvents` includes `onStartupFinished` so the extension activates on host boot, not only on profile-file detection.
- Avatar/badge art auto-swaps: drop `assets/sprites/avatar.png` (or `badge-sheet.png`) and fs.stat detects it; no code change.
- launch.json opens the host on an absolute finpack-claude path (the `${workspaceFolder}/..` form opened an empty Welcome window).
### Cursed / Uncertain
- Avatar PNG pending: user's generated image had a BAKED checkerboard (hasAlpha true but 0 transparent pixels) and was 2048^2/5.6MB. Programmatic keying left an AA halo and was abandoned; user is regenerating with real transparency. Placeholder SVG active meanwhile.
- Badge sprite sheet (240x16) and OFL pixel woff2 font still placeholders (emoji badges + monospace font).
- Tree shows git "U" (untracked) decorators on scrolls via resourceUri — cosmetic; suppress later if noisy.
### The Road Ahead
- Receive transparent avatar.png (256-512px, real alpha) -> drop in -> reload.
- Build/vendor badge sprite sheet + OFL pixel woff2 font; swap placeholders.
- Optional: suppress scroll git decorators in the tree.
- Then /complete-quest once satisfied.

## Expedition 2026-05-29 (second)
### Conquered
- `src/levelMath.ts`: levelProgress() + expBar() derived from LEVEL_TABLE (pure, 6 tests).
- `src/stateManager.ts`: three FileSystemWatchers, fail-soft `vscode.workspace.fs` reads, assembles QuestState + LoadingState, serialised (coalescing) refresh, notifies surfaces; dispose.
- `src/surfaces/statusBar.ts`: level + active quest + EXP bar; NoAdventurer / UnsupportedSchema / Error / Ready states; click opens sheet.
- `src/surfaces/treeView.ts`: TreeDataProvider, quest root -> 5 scroll children, click runs vscode.open.
- `src/extension.ts`: composition root — tree view + `refresh` + `openCharacterSheet` (stub) commands, subscriptions, initial refresh.
- `assets/sprites/sidebar-icon.svg`: placeholder shield (full pixel assets deferred).
- `types.ts` gained `ScrollFile` (filename + fsPath + meta).
- Compile clean; 29/29 tests pass. Battle-plan steps 5-7 complete.
### Oaths Sworn
- Schema-version source is `.claude/commands/.quest-system-version` (placed by the install script), NOT profile frontmatter. Policy: version file present + year-month drift -> UnsupportedSchema; version file absent -> trust profile parse (don't hard-fail); profile parse failure -> UnsupportedSchema. Lets dev repos without the installed version file work.
- `ScrollFile` (filename + fsPath + meta) is the tree's data shape; `ScrollMeta` alone lacked the path needed to open scrolls.
### Cursed / Uncertain
- F5 Extension Development Host smoke-test not yet run (manual; no GUI in the build environment). Compile + unit tests are green but live surface rendering is unverified.
- `openCharacterSheet` is a stub (info toast) until the webview expedition.
### The Road Ahead
- Step 8: vendor pixel assets (OFL font + avatar/badge sprites), record licenses.
- Step 9: pure webview builders — buildExpChart (inline SVG), buildBadgeGrid (locked+progress), buildCharacterSheet (CSP + nonce + asWebviewUri).
- Step 10: `characterSheet.ts` panel (singleton, postMessage); replace the openCharacterSheet stub with the real sheet.
- Step 11-12: empty/drift states across surfaces; vsce package + smoke test.

## Expedition 2026-05-29
### Conquered
- Scaffolded `quest-dashboard/` (package.json with contribution points + `activationEvents: workspaceContains`, tsconfig.json, tsconfig.test.json, .vscodeignore; `gray-matter` installed).
- `src/types.ts`: Result<T>, LoadingState union, QuestState, LEVEL_TABLE (10), ALL_BADGES (15), SUPPORTED_VERSION.
- `src/schema.ts`: checkSchemaVersion() choke-point (calver, patch-tolerant within year-month).
- Four pure parsers: profile, history, activeQuest, scroll.
- 23 node:test cases, all green. Both build configs (`compile`, `pretest`) compile clean.
- Battle-plan steps 1-4 complete (pure core, zero VS Code API).
### Oaths Sworn
- LoadingState modelled as a const-object union, not a TS enum — enums aren't erasable; this keeps the data layer runnable by node:test without runtime-emit surprises.
- Test runner invoked with a quoted glob (`node --test "out-tests/tests/**/*.test.js"`); a bare directory is treated as a module in Node 24.
### Cursed / Uncertain
- none (surfaces, webview, and pixel assets intentionally deferred to the next expedition).
### The Road Ahead
- Step 5: `stateManager.ts` — FileSystemWatchers + refresh assembling QuestState with LoadingState.
- Steps 6-7: status-bar surface (simplest first), then sidebar TreeView.
- Steps 8-10: pixel assets, webview builders (chart/badges/sheet), webview surface.
