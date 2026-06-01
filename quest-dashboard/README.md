# Quest Dashboard

A read-only VS Code sidebar extension that turns your [quest-system](https://github.com/findexu/finpack-claude) coding-quest progress into a live RPG **character sheet** — adventurer level, EXP, badges, the active quest, and its lifecycle phase.

It only **reads** local quest-system files; the quest-system slash-commands remain the sole writers.

## Surfaces

- **Status bar** — phase icon + level + active quest + EXP bar.
- **Sidebar character sheet** (webview) — animated pixel hero, phase banner, stats, trophy-shelf badges, EXP chart.
- **Sidebar tree** — the active quest's five scrolls; click to open.

## Requirements

A workspace using [quest-system](https://github.com/findexu/finpack-claude) (i.e. it has `.claude/quest-xp/profile.md`). With no profile, the dashboard shows a "no adventurer yet" state.

## Install (from a GitHub Release — no marketplace)

1. Download the latest `quest-dashboard-<version>.vsix` from the repo's
   [Releases](https://github.com/findexu/finpack-claude/releases).
2. Install it:
   ```bash
   code --install-extension quest-dashboard-<version>.vsix
   ```
   Or in VS Code: **Extensions** view → `…` menu → **Install from VSIX…** → pick the file.
3. Reload VS Code. Open a quest-system workspace; the **Quest Dashboard** icon appears in the activity bar.

To update, install a newer `.vsix` the same way. To uninstall: Extensions → Quest Dashboard → Uninstall.

## Build from source

```bash
cd quest-dashboard
npm ci
npm test          # compile + run the unit suite
npm run package   # produces quest-dashboard-<version>.vsix
```

Run/debug locally: open the `quest-dashboard/` folder in VS Code and press **F5** (launches an Extension Development Host on the repo root).

## Custom art (optional)

The hero and badges ship as built-in SVG/CSS. Drop these into `assets/sprites/` to override them (auto-detected, no rebuild of logic needed — repackage to ship):

- `hero-frames.png` — 4 horizontal **square** frames, transparent → animated idle.
- `badge-sheet.png` — 240×16, 15 icons (16px each) → badge icons.
- `avatar.png` — a single static hero image (≤512px, real transparency).

## License

MIT
