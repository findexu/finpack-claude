---
quest: vs-code-QS-plugin
realm: app
scroll: STRATEGY_SCROLL
last-updated: 2026-05-29
---
# Strategy Scroll — vs-code-QS-plugin

## Quest Overview
A VS Code extension that visualizes the quest-system gamification data as a live
"main character" dashboard. It reads the local quest-system artifacts
(`.claude/quest-xp/`, `.claude/active-quest.txt`, `.ai-context/quests/*/`) and
renders adventurer level, EXP, badges, active quest, and scroll status. Pure
read-only observer — quest-system commands remain the sole writers. Goal: make
the gamification visible and fun without leaving the editor.

## Acceptance Criteria
- Status bar shows current level, active quest, and EXP progress; updates live.
- Sidebar TreeView lists quests and their scrolls; clicking a scroll opens it.
- Webview "character sheet" renders level, EXP bar, badge grid, and core stats.
- All three surfaces refresh automatically when quest-system files change
  (after /embark, /make-camp, /quest-xp) with no manual reload.
- Extension performs zero writes to any quest-system file.
- On unsupported scroll/profile schema, surfaces a clear notice instead of crashing.

## Scope
**In scope:**
- Read + parse profile.md, quest-history.md, active-quest.txt, and quest scrolls.
- Three UI surfaces: status bar, sidebar TreeView, webview character sheet.
- Live refresh via FileSystemWatcher.
- Lives inside finpack-claude as a new top-level directory (realm `app`).

**Out of scope (v1):**
- Any write-back to scrolls or profile.
- Triggering quest commands from the UI (/embark, /quest-xp buttons).
- Marketplace publishing / standalone repo / esbuild bundling.
- Multi-root workspace edge handling beyond a single `.claude` root.
- VS Code extension-host integration tests (parser unit tests only).
- External chart libraries (EXP chart is hand-rolled SVG).

## Battle Status
| Module | Status |
|---|---|
| Data layer (parse profile/scrolls) | Conquered (types + schema + 4 pure parsers, 23 tests green) |
| FileSystemWatcher / refresh | Conquered (stateManager, coalescing refresh, fail-soft reads) |
| Status bar | Conquered (level + quest + EXP bar; empty/drift states) |
| Sidebar TreeView | Conquered (quest -> 5 scrolls, click opens) |
| Webview character sheet (pixel-art) | Conquered (panel + builders, F5 verified) |
| Badge grid (locked + progress) | Conquered (logic; sprite art pending) |
| EXP progression chart (inline SVG) | Conquered (empty + populated states) |
| Pixel assets (sprite + font) | Hero = hand-authored animated SVG; emoji badges; body uses UI sans (woff2 dropped). Pro design/assets pending. |
| Visual design (palette/panels/shelves) | Conquered (full redesign + trophy-shelf badges, F5 verified) |
| Design tokens to mockup | Conquered (v4) |
| Responsive 2-col / 1-col layout | Conquered (v4, container-query) |
| Ornate frame + panel reorg | Conquered (v4) |
| Hero stage (pedestal/rune/arch) | Conquered (v4, CSS/SVG) |
| Badge medallions (per-state frames) | Conquered (v4, padlock locked) |
| Empty states restyle | Conquered (v4) |
| Asset seam (hero frames + icon set) | Conquered (v4, avatar/badge/hero-frames via fs.stat) |
| Adventure-phase detector | Conquered (detectPhase, 6 tests) |
| Sidebar WebviewView (embedded sheet) | Conquered (stacked over tree, F5 verified) |
| Responsive narrow-width layout | Conquered (~300px reflow) |
| Phase animations (CSS) | Conquered (bob/pulse/shimmer, reduced-motion gated) |

## Oaths Sworn (Resolved Decisions)
- Read-only observer: extension never writes quest-system files; commands own all writes (avoids two-writer corruption + append-only journal races).
- Lives inside finpack-claude (new top-level dir), realm `app`: co-located with the schema it mirrors to minimize drift.
- v1 ships all three surfaces (status bar + sidebar tree + webview character sheet).
- Schema coupling pinned to quest-system VERSION: show "unsupported schema" notice rather than crash on format drift.
- No network / no Claude API: all data is local plaintext; webview uses strict CSP, local assets only.
- Webview visual style: pixel-art RPG card (sprite avatar, pixel font, retro HUD bars, pixel badge slots).
- Badges render locked + progress (lit when earned, dimmed with counters otherwise) — mirrors /quest-xp.
- EXP progression chart ships in v1: parse quest-history.md into a timeline; rendered as hand-rolled inline SVG (no external chart lib — respects CSP + pixel aesthetic).
- Build tooling: plain tsc (no bundler) for v1; esbuild deferred to a future publish milestone.
- Testing: unit-test the parser/data layer only; skip VS Code extension-host integration tests in v1.
- Architecture: flat 3-layer (pure parsers -> single `QuestState` -> three dumb surfaces), one-way dependency direction. Chosen over full Clean (DI + class-per-parser + EventEmitter store) — that ceremony pays nothing back for a read-only viewer.
- Grafted from Clean: a single `checkSchemaVersion()` choke-point, and a `LoadingState` enum (Ready / NoAdventurer / UnsupportedSchema / Error) instead of a loose error string — surfaces switch on one enum for explicit empty states.
- Parsers are pure functions `parse(content: string): Result<T>` — no injected FileReader; testable by passing fixture strings.
- `activationEvents: workspaceContains:.claude/quest-xp/profile.md` — zero overhead on unrelated projects (all three architects agreed).
- Directory name: `quest-dashboard/` at repo root. Runtime dep: `gray-matter` only. Tests: Node built-in `node:test`.
- Data schema pinned to quest-system VERSION 2026.05.0003 (level table, 15-badge catalog, quest-history entry format read from skills/quest-system/SKILL.md + complete-quest.md).
- `LoadingState` is a const-object union, not a TS enum: enums aren't erasable and complicate running the data layer under node:test; the union is idiomatic and emit-free.
- Parser tests run via `node --test "out-tests/tests/**/*.test.js"` (quoted glob); compiled to `out-tests/` by `tsconfig.test.json`. A bare directory path is treated as a module by Node 24's runner.
- Schema-version source is `.claude/commands/.quest-system-version` (placed by install-quest-system.sh), not profile frontmatter. Gate policy: version present + year-month drift -> UnsupportedSchema; version absent -> trust profile parse; profile parse failure -> UnsupportedSchema. Dev repos lacking the installed file still work.
- `ScrollFile` (filename + fsPath + meta) is the tree's data shape; `ScrollMeta` alone lacked the path to open scrolls.
- `openCharacterSheet` ships first as a stub (info toast); replaced by the real panel in the webview expedition.
- Webview uses NO inline style attributes (strict style-src nonce CSP blocks them): EXP bar + badge sprites are SVG presentation attrs; all CSS in one nonce'd <style>.
- Webview is `enableScripts: false` + full-HTML rebuild per update (no postMessage / client JS) — supersedes the earlier postMessage plan.
- `activationEvents` includes `onStartupFinished` (activate on host boot, not only on profile-file detection).
- Avatar/badge art auto-swaps via fs.stat on `assets/sprites/{avatar,badge-sheet}.png`; absent -> inline placeholder. No code change to add art.
- launch.json opens the Extension Development Host on an absolute finpack-claude path (the `${workspaceFolder}/..` form opened an empty Welcome window).
- (v2) Character sheet lives in the SIDEBAR as a `WebviewView` (WebviewViewProvider), stacked above the scrolls tree in the same view container — not a separate editor tab. More engaging, always visible.
- (v2) `openCharacterSheet` command + editor-tab `WebviewPanel` are removed; the status-bar click focuses the sidebar view instead.
- (v2) Data layer computes a `QuestPhase` (Planning / Ready / Embarked / AtCamp + NoQuest) via a pure `detectPhase(strategyText, journalText, hasActiveQuest)`. Rules: no active quest -> NoQuest; last journal entry open (no "### The Road Ahead") -> Embarked; open riddles or unlocked battle plan -> Planning; >=1 closed journal entry -> AtCamp; plan locked + no entries -> Ready.
- (v2) Adventure animation is CSS-only (avatar idle-bob, phase-banner pulse, EXP shimmer) in the nonce'd <style>; `enableScripts` stays false. All motion gated behind `@media (prefers-reduced-motion: reduce)`.
- (v2) 4-phase taxonomy chosen over 5: counsel-quest leaves no persistent marker, so Scouting vs Planning can't be distinguished from files — would mislabel.
- (v2) Tree drops `resourceUri` (keeps the open-on-click command) to remove the git "U" untracked decorators from scroll rows.
- (v3 polish) Body text uses a readable UI sans (var(--vscode-font-family) fallback to system); pixel rendering reserved for hero + badge sprites. woff2 pixel font dropped.
- (v3) Stats render as one compact row of 6 with short labels; phase banner + active quest grouped in one framed status panel.
- (v3) Badges use a trophy-bookshelf layout (wood ledges) with a bottom nameplate plaque + fixed-size icon box per badge.
- (v3) "Expeditions" is shown as "Journeys" in the UI (display label only; internal term unchanged).
- (v3) Status bar codicon is phase-reactive; badges that meet their threshold but are not yet awarded show a "ready to unlock" glow.
- (v3) Visual design is delegated to fp-frontend-designer under strict CSP; the main loop audits (no inline style/script/external) + compiles before accepting.
- (v4 mockup) The designer's mockup is the canonical visual spec. Adopt its tokens: palette (teal/green/blue/purple/gold on dark navy), type scale (Hero 22 / Section 14 / Sub 12 / Body 12 / Caption 11 / Small 10 / Micro 9, system UI font), spacing base-4.
- (v4) Responsive: wide (>=~460px) = two-column top (hero stage | status panel over nameplate panel), full-width stats(6)/badges(5-shelf)/chart; narrow (<460px) = single column, stats 3-col x2 rows, badges 3-shelf.
- (v4) Panels reorganized: hero-stage panel; status panel (phase banner + active quest + realm); nameplate panel (name + level chip + title + EXP bar) — three distinct framed panels.
- (v4) Hero stage (stone pedestal + glowing rune ring + dungeon-arch backdrop + sparkles) built in CSS/SVG; hero sprite layered on top; structured so a 4-frame idle sheet can drive a steps() animation later.
- (v4) Badges = ornate medallions per state: earned (gold frame + glow), ready (teal frame + glow + counter), locked (dark stone + PADLOCK hiding the real icon + counter). Name plaque under each, on wood shelves.
- (v4) Assets via SVG/CSS placeholders now; designer PNGs (hero 4-frame sheet + 16px badge-icon set) auto-swap via fs.stat later with no code change.
- (v4) Phase banner = rounded icon-tile + label + sublabel, per-phase color (5 phases). All new motion CSS-only, reduced-motion gated; CSP unchanged.

## Fallen Strategies (Rejected Approaches)
- (v1, superseded by v2) Character sheet as an editor-tab `WebviewPanel` opened via `openCharacterSheet` command: replaced by an always-visible sidebar `WebviewView`. The builder code (`buildCharacterSheet` + sub-builders) is reused; only the host changes.
- Full Clean architecture (4 layers, DI'd FileReader, class-per-parser, observable EventEmitter store): rejected for v1 — over-abstracted for a 3-surface read-only viewer; DI/EventEmitter buy decoupling never spent. Revisit only if the extension grows toward marketplace publish, command-launch buttons, or multiple contributors.
- Minimal-changes architecture (each surface reads files independently, no shared state): rejected — too thin; would need a refactor the moment the EXP chart + locked-badge-progress logic lands, since both need the shared level table + badge catalog.

## Scouting Findings (Audit Results)
- quest-system data formats are authoritatively documented in `skills/quest-system/SKILL.md` (profile.md frontmatter, active-quest.txt 2-line format, split-scroll index convention), `commands/complete-quest.md` (exact quest-history.md entry format), and `commands/quest-xp.md` (level table, badge table, EXP math, progress-bar logic).
- Data contract pinned to VERSION 2026.05.0003 / semver 1.6.1.

## Open Riddles (Decisions Needed)
(none — all resolved during counsel; ready to embark)

## The Battle Plan — v4: Designer Mockup (current)
Implement the designer's mockup. Layout + chrome now with SVG/CSS placeholders; real pixel art swaps in later via the asset seam. Bottom-up: tokens -> structure -> chrome -> components. CSP rules unchanged; all motion reduced-motion gated. Reuse existing builders/escaping/data wiring.

v4.1. **Design tokens.** Rewrite `:root` to the mockup palette + type scale (Hero 22 / Section 14 / Sub 12 / Body 12 / Caption 11 / Small 10 / Micro 9) + spacing base-4. Single source for the rest.
v4.2. **Responsive layout + panel reorg.** Restructure `readyDoc` into three panels — hero-stage, status (phase banner + active quest + realm), nameplate (name + level chip + title + EXP bar). Wide (>=460px): two-column top (hero | status-over-nameplate), full-width stats/badges/chart. Narrow (<460px): single column, stats 3-col x2, badges 3-shelf. Container/media queries.
v4.3. **Ornate frame + panel chrome.** Gold double-border outer frame with corner flourishes; refined framed panels matching the mockup. Reusable panel/corner CSS.
v4.4. **Hero stage (CSS/SVG).** Stone pedestal + glowing rune ring + dungeon-arch backdrop + sparkles as CSS/SVG decor; existing SVG hero layered on top. Glow/sparkle animation, reduced-motion gated. Structure a frame-strip slot for the future 4-frame steps() idle.
v4.5. **Phase banner restyle.** Rounded icon-tile + label + sublabel, per-phase color, framed (5 phases).
v4.6. **Badge medallions.** Per-state ornate frames in buildBadgeGrid: earned (gold+glow), ready (teal+glow+counter), locked (dark + padlock hiding icon + counter); name plaque under; keep shelves. SVG placeholder icons now; sprite-cell path retained for the icon sheet.
v4.7. **Empty states restyle.** Style NoAdventurer / Unsupported / Error to the mockup (icon + heading + message in a framed panel).
v4.8. **Asset seam.** fs.stat-detect hero 4-frame sheet (steps animation) + 16px badge-icon sheet; fall back to SVG/CSS placeholders. No code change to add art later.
v4.9. **Tests + tsc + F5.** Extend builder tests (per-state badge classes incl. padlock-locked, responsive rules, token presence, empty states). Compile clean. F5-verify both narrow and wide.

## The Battle Plan — v2: Sidebar Dashboard + Adventure Phase
Steps 1-12 below (v1) are all Conquered. This expedition embeds the sheet in the sidebar and adds the live adventure-phase animation. Bottom-up again: pure phase logic + tests first, then the view migration.

v2.1. **Phase model + detector (pure) + tests.** Add `QuestPhase` const-union (`NoQuest | Planning | Ready | Embarked | AtCamp`) to types. Write `src/phaseDetector.ts`: `detectPhase(strategyText, journalText, hasActiveQuest): QuestPhase` using the locked rules (see oaths). Unit-test each phase from fixture text.
v2.2. **Wire phase into state.** stateManager reads the raw bodies of `STRATEGY_SCROLL.md` + `ADVENTURE_JOURNAL.md` (already locates them), computes `phase`, adds it to `QuestState`. Surfaces ignore it except the sheet.
v2.3. **Migrate to WebviewView.** Replace `surfaces/characterSheet.ts` (WebviewPanel) with a `CharacterSheetView` implementing `WebviewViewProvider`. Add `contributes.views` webview entry to the `quest-dashboard` container ABOVE the tree. Register with `window.registerWebviewViewProvider`. Remove the `openCharacterSheet` command + panel; status-bar click runs the view-focus command. Reuse `buildCharacterSheet`.
v2.4. **Responsive narrow layout.** Add `@media`/container-query rules so the sheet reflows at ~300px (badges 5->3 col, stats 3->2, avatar scales). Keep the wide layout for larger sidebars.
v2.5. **Phase banner + CSS animations.** Render a phase banner in the sheet (label + per-phase color/icon). Add CSS keyframes: avatar idle-bob, banner pulse, EXP-bar shimmer. All inside the nonce'd `<style>`; gate every animation behind `@media (prefers-reduced-motion: reduce)` (no motion when set).
v2.6. **Tree decorator cleanup.** Drop `resourceUri` from scroll tree items (keep the open-on-click command) to remove git "U" untracked badges.
v2.7. **Tests + F5 verify.** Update/extend builder tests (phase banner present, reduced-motion block present, responsive rules present). `tsc` clean. Manual F5: sidebar shows sheet-over-tree, phase reflects current state, animation plays, reduced-motion disables it.

## The Battle Plan — v1 (Conquered)
Build bottom-up: prove the pure core with tests before touching any VS Code API, then layer surfaces simplest-first.

1. **Scaffold.** Create `quest-dashboard/` at repo root. Write `package.json` (contribution points: viewsContainers, views, commands, menus; `activationEvents: workspaceContains`), `tsconfig.json` (commonjs, ES2020, strict), `.vscodeignore` (exclude `src/`+`tests/`, KEEP `assets/`). `npm i gray-matter`; dev: typescript, @types/vscode, @types/node. Confirm `tsc` compiles clean on empty entry.
2. **Types + constants.** Write `src/types.ts`: `Result<T>`, `QuestState`, `LoadingState` enum, domain models, `LEVEL_TABLE`, `ALL_BADGES`, `SUPPORTED_VERSION`. Single source of type truth.
3. **Schema choke-point.** Write `checkSchemaVersion(found): SchemaStatus` (calver compare, patch-tolerant, major-mismatch rejects). One place owns version logic.
4. **Parsers (pure) + tests.** Write `src/parsers/{profile,history,activeQuest,scroll}Parser.ts` as pure `parse(content): Result<T>`. Write fixtures under `tests/fixtures/` (happy + fail-soft per parser) and `tests/parsers/*.test.ts` with `node:test`. All green before proceeding.
5. **State manager.** Write `src/stateManager.ts`: owns three FileSystemWatchers (RelativePattern on `.claude/quest-xp/**`, `.ai-context/quests/**`, `.claude/active-quest.txt`), per-file try/catch (missing file -> null field, not error), assembles `QuestState` with `LoadingState`, holds direct refs to surfaces, calls `surface.update(state)`. Minimal `extension.ts` activates it and logs state. Verify via F5.
6. **Status bar surface.** `src/surfaces/statusBar.ts` — level + active quest + EXP bar; empty + unsupported-schema states. Wire, verify F5.
7. **Tree view surface.** `src/surfaces/treeView.ts` — quest root -> 5 scroll children; click runs `vscode.open`. Wire, verify F5.
8. **Webview assets.** Vendor OFL pixel font (Pixelify Sans / Press Start 2P) + placeholder avatar + badge sprite sheet under `assets/`. Record licenses.
9. **Webview builders (pure).** `src/webview/buildExpChart.ts` (inline SVG, "no history yet" when empty), `buildBadgeGrid.ts` (locked+progress via ALL_BADGES), `buildCharacterSheet.ts` (CSP + nonce + asWebviewUri, composes sub-builders). Sanity-check SVG/HTML output in a Node REPL.
10. **Webview surface.** `src/surfaces/characterSheet.ts` — singleton panel lifecycle, `postMessage` on update, in-place DOM patch by element id. Wire command + status-bar click. Verify F5 with real profile data.
11. **Empty + drift states.** Implement "no adventurer yet" (missing profile.md), "unsupported schema" notice, sparse-history chart fallback across all three surfaces. Test each by mutating fixtures.
12. **Package + smoke test.** Replace placeholder art with final sprites. `npx vsce package`, inspect `.vsix` (assets present, `src/` excluded), install locally, smoke-test all three surfaces against live quest data.
