---
quest: vs-code-QS-plugin
realm: app
scroll: WORLD_MAP
last-updated: 2026-05-29
---
# World Map — vs-code-QS-plugin
## Realm
This workspace contains multiple realms (app targets).
All work this quest is scoped to **app** only.
Do not venture into other realms unless explicitly commanded.
## Module Map
Built: `types.ts` (+ ScrollFile, QuestPhase), `schema.ts`, `levelMath.ts`, `phaseDetector.ts`, `src/parsers/*` (all four), `stateManager.ts` (computes phase), `surfaces/{statusBar,treeView}.ts`, `surfaces/characterSheet.ts` (CharacterSheetView WebviewViewProvider), `webview/{escape,buildBadgeGrid,buildExpChart,buildCharacterSheet,heroSprite}.ts` (v4 mockup: ornate gold frame, container-query 2-col/1-col layout, hero stage [pedestal/rune/arch/sparkles], badge medallions [earned/ready/locked-padlock], phase banner tiles, design tokens; SheetAssets adds heroSheetUri), `extension.ts`, `assets/sprites/sidebar-icon.svg` (placeholder), `.vscode/{launch,tasks}.json`, two tsconfigs, `tests/`. Compiles clean, 47 tests green, F5-verified (sidebar dashboard live). Pending: real pixel `assets/` (transparent `avatar.png`, `badge-sheet.png` 240x16, OFL woff2 font). Avatar/badge auto-swap via fs.stat — drop files, no code change.

Planned greenfield layout (`quest-dashboard/` at repo root). Flat 3-layer:
```
quest-dashboard/
  package.json            contribution points (views, commands, activationEvents)
  tsconfig.json           commonjs, ES2020, strict
  .vscodeignore
  assets/
    fonts/                OFL pixel font (vendored)
    sprites/              avatar sheet, badge sheet, sidebar icon
  src/
    extension.ts          activate/deactivate only (composition root)
    types.ts              Result<T>, QuestState, LoadingState, LEVEL_TABLE, ALL_BADGES, SUPPORTED_VERSION
    schema.ts             checkSchemaVersion() choke-point
    parsers/              pure parse(content): Result<T>
      profileParser.ts
      historyParser.ts
      activeQuestParser.ts
      scrollParser.ts
    stateManager.ts       FileSystemWatchers + refresh + notify surfaces
    surfaces/             dumb consumers of QuestState
      statusBar.ts
      treeView.ts
      characterSheet.ts
    webview/              pure HTML/SVG builders
      buildCharacterSheet.ts
      buildExpChart.ts
      buildBadgeGrid.ts
  tests/
    parsers/*.test.ts     node:test, fixture-driven
    fixtures/*.md
```
## Navigation Flow
Three entry surfaces, all driven by one `QuestState`:
- Status bar item -> click -> focuses the sidebar dashboard.
- Activity-bar container "Quest Dashboard" holds TWO stacked views: a `WebviewView` character sheet (top) + the scrolls TreeView (bottom).
- Tree: quest root -> 5 scroll children -> click -> `vscode.open` raw markdown (no resourceUri, so no git decorators).
- (v2) Character sheet is an embedded `WebviewView` (not an editor tab); shows an animated adventure-phase banner derived from `QuestState.phase`.
## Data Flow
```
.claude/quest-xp/profile.md, quest-history.md
.claude/active-quest.txt
.ai-context/quests/<quest>/*.md
        | FileSystemWatcher events OR manual refresh
        v
stateManager.refresh()  -> pure parsers -> Result<T> -> assemble QuestState (+ LoadingState)
        |
        +-> statusBar.update(state)
        +-> treeView.update(state)
        +-> characterSheet.postMessage(state) -> webview DOM patch by element id
```
One-way dependency: surfaces -> state -> parsers -> types. Read-only; zero writes.
## Source data files (read by the extension)
| File | Role |
|---|---|
| `.claude/quest-xp/profile.md` | Adventurer frontmatter: level, EXP, counts, badges |
| `.claude/quest-xp/quest-history.md` | Append-only EXP log -> progression chart |
| `.claude/active-quest.txt` | Line 1 = quest path, line 2 = realm |
| `.ai-context/quests/<quest>/*.md` | Five scrolls (frontmatter + body) for tree |
| `skills/quest-system/SKILL.md` | Schema source of truth (formats, VERSION) |
| `skills/quest-system/commands/quest-xp.md` | Level table, badge catalog, EXP math |
| `skills/quest-system/commands/complete-quest.md` | Exact quest-history entry format |
## Retired Files
(none yet)
