# Quest Context: vs-code-QS-plugin
Realm: app  |  Last updated: 2026-05-29
*Paste this file into any AI tool to load the active quest state.*

## Battle Status
| Module | Status |
|---|---|
| Data layer (parse profile/scrolls) | Conquered |
| FileSystemWatcher / refresh | Conquered |
| Status bar | Conquered |
| Sidebar TreeView | Conquered |
| Webview character sheet (pixel-art) | Conquered (sidebar WebviewView, F5 verified) |
| Badge grid (locked + progress) | Conquered (logic; sprite art pending) |
| EXP progression chart (inline SVG) | Conquered |
| Adventure-phase detector | Conquered |
| Sidebar WebviewView (embedded sheet) | Conquered |
| Responsive narrow-width layout | Conquered |
| Phase animations (CSS) | Conquered (reduced-motion gated) |
| Visual design (palette/panels/shelves) | Conquered (full redesign + trophy badges) |
| Pixel assets (sprite + font) | Hero = animated SVG; emoji badges; UI sans text. Pro design/assets pending. |

## Open Riddles
None.

## Road Ahead
- v4 designer mockup is implemented (layout/chrome/hero-stage/banner/badge-medallions/empty-states/tokens; 52 tests). Pixel art still placeholder.
- Drop in designer PNGs when delivered (auto-swap via fs.stat, no code change):
  - assets/sprites/hero-frames.png  (4 horizontal SQUARE frames, transparent) -> steps(4) idle
  - assets/sprites/badge-sheet.png  (240x16, 15 icons) -> real badge icons
  - assets/sprites/avatar.png       (optional static hero, <=512px, real alpha)
- Commit quest-dashboard/ on a branch (uncommitted across 6 expeditions), then /complete-quest.

## Known Dangers
### Quest Dangers
- Read-only observer; commands own all writes (no two-writer corruption).
- AI PNG "transparency" can be faked (hasAlpha true, checker baked into RGB) -> verify corner alpha==0, require <=512px.
- Inline style="" blocked by strict CSP -> all CSS in nonce'd <style>, dynamic visuals via SVG presentation attrs.
- YAML auto-parses unquoted ISO dates to Date -> scrollParser coerces to YYYY-MM-DD.
- Open webview misses new on-disk assets until reload (asset URIs resolve at render).

### Project Dangers
(none yet — complete a quest first)

## Locked Decisions
### Quest Decisions
- Read-only; lives in finpack-claude as quest-dashboard/, realm app.
- Flat 3-layer (pure parsers -> single QuestState + LoadingState -> dumb surfaces).
- Schema-version source `.claude/commands/.quest-system-version`; absent -> trust parse.
- Webview: strict CSP, NO inline style attrs, enableScripts:false + full-HTML rebuild (no postMessage).
- activationEvents onStartupFinished; launch.json opens host on absolute finpack-claude path.
- Avatar/badge art auto-swaps via fs.stat on assets/sprites/*.png; absent -> inline placeholder.
- Plain tsc, no bundler; parser + levelMath + webview-builder unit tests via node:test (38 green).

### Project Decisions
(none yet — complete a quest first)
