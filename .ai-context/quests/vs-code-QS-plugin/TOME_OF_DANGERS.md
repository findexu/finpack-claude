---
quest: vs-code-QS-plugin
realm: app
scroll: TOME_OF_DANGERS
last-updated: 2026-05-29
---
# Tome of Dangers — vs-code-QS-plugin
Source of truth for every monster, trap, and curse encountered.
Always read before proposing any strategy involving rendering,
memory, or architecture.
## Confirmed Safe Paths
- Pure `parse(content: string): Result<T>` parsers + inline-string fixtures under node:test — no filesystem mocking, fast, 23 cases green.
- Two tsconfigs: `tsconfig.json` (rootDir src -> out, extension build) and `tsconfig.test.json` (rootDir . -> out-tests, includes src+tests). Keeps the shipped build clean while compiling tests.
## Known Dangers
| Danger | Impact | Remedy |
|---|---|---|
| Two writers on quest files | Corruption, races on append-only ADVENTURE_JOURNAL | Extension is read-only; quest commands own all writes |
| Frontmatter/scroll schema drift | Parser crashes when quest-system format changes | Pin parsing to quest-system VERSION; show "unsupported schema" notice, fail soft |
| Webview remote content | XSS / CSP escape in webview | Strict CSP, local SVG/CSS assets only, no remote fetch |
| quest-xp is gitignored | Profile data absent on fresh clone / CI | Treat missing profile.md as "no adventurer yet" empty state, not error |
| Pixel-art asset licensing | Shipping sprite/font with unclear license = legal risk | Use OFL pixel font (e.g. Press Start 2P) + self-made/CC0 sprite; vendor assets locally, record license |
| quest-history.md sparse | EXP chart looks empty (1 entry per completed quest; currently 0) | Chart degrades gracefully: show "no history yet" until >=1 entry; never assume populated |
| YAML auto-parses unquoted ISO dates to Date | gray-matter/js-yaml turns `last-updated: 2026-05-29` into a JS Date, not a string; naive string checks reject it | scrollParser coerces `Date -> YYYY-MM-DD`; any future parser reading a date frontmatter field must do the same |
| Node 24 `--test` bare directory | Passing a directory to `node --test` is treated as a module path and crashes | Always pass a quoted glob (`"out-tests/tests/**/*.test.js"`) |
| AI-generated PNG "transparency" is faked | hasAlpha can be true while the checkerboard is baked into RGB (0 transparent pixels); also exported at 2048^2/5MB | Verify real alpha (sample corner pixel alpha==0), not just the hasAlpha flag; require <=512px source; programmatic keying leaves AA halos — regenerate instead |
| Inline `style=""` blocked by CSP | A strict `style-src 'nonce-...'` blocks inline style attributes (nonces don't cover attributes) | Put all CSS in one nonce'd <style>; use SVG presentation attributes for dynamic visuals (bar width, sprite offset) |
| Open webview misses new on-disk assets | Asset URIs resolve at render; dropping a sprite while the panel is open won't show until reload/reopen | Reload host (Cmd+R) or reopen the sheet after adding art |
| WebviewView != WebviewPanel API | No reveal/show; options must be set inside resolveWebviewView; focus via auto `<viewId>.focus` command | Implement WebviewViewProvider; set webview.options in resolve; status-bar click runs questDashboard.characterSheet.focus |
| Phase detection blind to active embark | /embark writes no journal entry, so "Embarked" rarely shows; phase reads AtCamp during active work | Accept as data-model limit (documented); Embarked only triggers on an open journal entry |
| SVG xmlns trips naive CSP greps | `xmlns="http://www.w3.org/2000/svg"` is a required namespace, not a fetched resource, but a naive `https?://` grep flags it as a CSP violation | Exclude xmlns when auditing; it is not a real external-resource fetch |
| CSS @container needs a container ancestor | A `@container` query is a silent no-op unless an ancestor sets `container-type` | `.card` sets `container-type: inline-size`; verify it stays when restructuring, or reflow breaks |
## Fallen Strategies (Tried and Abandoned)
(none yet)
## Unsolved Riddles (Open Verification Items)
(none yet)
