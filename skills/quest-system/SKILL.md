---
name: quest-system
description: >
  RPG-themed epic and expedition management system for Claude Code.
  Tracks quests (features/epics), expeditions (work loops), realms (app targets),
  and maintains persistent scrolls (docs) across all expeditions.
  Use this skill when working on any feature development in a mono-repo
  with multiple app targets. Triggers: /new-quest, /start-quest, /embark,
  /make-camp, /complete-quest, /quest-log, /quest-xp, /change-quest,
  /counsel-quest, /install-quest-system, /summon-witch-doctor.
version: 1.15.0
---

# Quest System — Skill Definition

## What this skill does

Provides a complete expedition memory and workflow system for feature development.
Every feature is a Quest. Every work loop is an Expedition.
Five persistent scrolls track all knowledge across expeditions so Claude Code
never loses context between conversations.

## Scroll structure (created per quest)

| Scroll | Purpose |
|---|---|
| `WORLD_MAP.md` | Codebase structure, navigation, key files |
| `STRATEGY_SCROLL.md` | Battle plan, oaths, fallen strategies, status |
| `ADVENTURE_JOURNAL.md` | Append-only expedition history |
| `TOME_OF_DANGERS.md` | Technical constraints, dangers, workarounds |
| `ADVENTURERS_HANDBOOK.md` | Guide explaining what belongs in each scroll |

### Planned Expeditions convention

`STRATEGY_SCROLL.md` carries a `## Planned Expeditions` checklist — the upcoming-work
tracker the quest-dashboard renders. Lifecycle of one item:

```
- [ ] surface layer      ← seeded by /counsel-quest (planned)
- [>] surface layer      ← /embark flips it on approval (active)
- [x] surface layer      ← /make-camp flips it at camp (done), then appends the next - [ ]
```

Markers map to dashboard status: `[x]`→done, `[>]`→active, `[ ]` (or anything else)
→planned. Maintained by: `/counsel-quest` (seeds one `- [ ]` per battle-plan phase;
reconciles on MID/PIVOT), `/embark` (next `- [ ]`→`- [>]`, else appends `- [>]`),
`/make-camp` (`- [>]`→`- [x]` + appends the next `- [ ]`). The block lives in the
top-level scroll and is kept in the index on split (the dashboard parses the index
only). All maintenance is a scroll-body edit — never `events.log`/`lifecycle.log`.

## Commands provided (installed by /install-quest-system)

| Command | When to use |
|---|---|
| `/new-quest` | Scaffold a brand new quest (folder + scrolls) |
| `/start-quest` | Activate a quest and get guided to next step |
| `/counsel-quest` | Plan (or replan/pivot) the active quest — 3 modes: PRE, MID, PIVOT |
| `/embark` | Start an expedition |
| `/make-camp` | End an expedition and update all scrolls |
| `/quest-log` | Quick status check without opening a full expedition |
| `/change-quest` | Save state and switch to a different quest or realm |
| `/summon-witch-doctor` | Diagnose scroll health: missing files, missing sections, split issues, and legacy terminology migration needs |
| `/complete-quest` | Distill key knowledge to project-level files, archive quest folder, clear active quest |
| `/quest-xp` | Show adventurer profile: level, EXP, progress bar, badges unlocked and locked |
| `/side-quest` | Capture a small thing found mid-quest (UI bug, font tweak) in one step — does NOT switch your active quest |
| `/close-side-quest` | Close a side-quest, distilling its dangers/decisions up to its parent (or `--promote` it to a full quest) |

## Key concepts

- **Quest** — a feature or epic (e.g. "scan-alignment-floor-annotation")
- **Side-quest** — a small thing found along the way (UI bug, font size, layout), usually independent but sometimes related to the main quest. Cheap to capture (one scroll, no counsel), worked in a separate chat, distilled UP to its parent on close.
- **Realm** — the app target in scope (e.g. "WeScanX")
- **Expedition** — a single focused work loop (`/embark` -> implementation -> `/make-camp`)
- **Conquered** — completed step
- **Cursed** — blocked or uncertain
- **Oath** — a resolved decision
- **Fallen strategy** — a rejected approach (must be recorded to prevent re-proposing)
- **Unsolved riddle** — an open verification item

## Active-quest selection (multi-chat)

You can run several Claude chats in the **same folder** at once, each working a
different quest. There is no per-chat id on disk, so a chat identifies its quest
by **naming it**, not by trusting a shared file.

### `.claude/active-quest.txt` (the default pointer)

Located at `.claude/active-quest.txt`
Line 1: repo-relative path to the quest scrolls folder, no trailing slash
  (e.g. `.ai-context/quests/scan-alignment-floor-annotation`)
Line 2: realm in scope (e.g. `WeScanX`)

`{quest-name}` is the basename of line 1 (the last path segment). Commands that
write this file (`/new-quest`, `/start-quest`, `/change-quest`) normalize any
user-supplied path to this form — relative, no trailing slash — so basename
extraction is unambiguous.

This file is a **single default pointer**. It is reliable when only one chat is
active. When multiple chats run in the same folder it is shared and any chat's
`/start-quest` / `/change-quest` overwrites it, so it is **untrusted** in
multi-chat use.

### Resolution order (every command)

1. If the command was given a `--quest <name-or-path>` argument → use that quest
   (read its realm from `STRATEGY_SCROLL.md` frontmatter unless `--realm` is also
   passed). The argument always wins.
2. Otherwise → read `.claude/active-quest.txt` (the default pointer).
3. Otherwise → "No active quest. Run /new-quest or pass --quest."

The assistant carries the chat's quest in-conversation: once a chat has embarked
on quest X, it resolves every subsequent command against X (supplying it as
`--quest`), and does NOT silently trust the shared pointer.

### Mutating commands confirm first

`/make-camp`, `/complete-quest`, and `/close-side-quest` write scrolls and XP.
Before any write they MUST echo the resolved `quest + realm` and confirm (or
require an explicit `--quest`). This is the backstop against a bare command
acting on a pointer another chat has just repointed.

### Worked examples

- **Single chat:** `/embark` → no arg → reads the pointer → quest X. Normal.
- **Two chats, same folder:** chat A is on `main-feature`, chat B runs
  `/start-quest font-fix` (pointer now = font-fix). Chat A's next `/make-camp`
  resolves `--quest main-feature` from its own conversation (NOT the pointer),
  echoes "camping main-feature / realm app — confirm?", and writes the right
  scrolls. Chat B works font-fix the same way.
- **Explicit override:** `/embark --quest onboarding --realm app` ignores the
  pointer entirely.

> Bonus: if you instead use separate git worktrees, `.claude/` is gitignored and
> not shared between them, so each worktree is isolated for free — but that is
> not required; same-folder multi-chat is the supported model.

## Concurrency (same-folder safety)

Races only exist when multiple chats share one folder. The rules:

- **Single-writer-per-quest.** A quest folder's scrolls are written by one chat
  at a time (each chat is on a different quest). Two chats on the *same* quest is
  the user's choice and out of scope.
- **Project-global files use an advisory lock.** `DANGER_REGISTRY.md` and
  `DECISIONS_LOG.md` are mutated by any `/complete-quest`. Wrap each
  read-modify-write in a `mkdir`-based lock, as a **single bash invocation** that
  acquires, re-reads, appends, and releases — releasing on every exit path:
  ```bash
  L=.claude/locks/danger-registry.lock
  for i in $(seq 1 50); do mkdir "$L" 2>/dev/null && break || sleep 0.1; done
  trap 'rmdir "$L" 2>/dev/null' EXIT
  # re-read the file HERE, append the new rows, write it back
  ```
  `mkdir` is the only atomic, portable primitive (macOS has no `flock`).
  `[ -e ] && touch` is a TOCTOU race — never use it. The lock is **advisory /
  best-effort** (LLM-executed); a stale lock is reported and offered for manual
  `rmdir`, never silently broken.
- **XP is append-only.** Append XP events to `.claude/quest-xp/events.log` with a
  shell append (`printf '%s\n' >> events.log`) ONLY — never via Edit/Write (a
  whole-file rewrite reintroduces the lost-update race). See the XP section.
- `.claude/locks/` is gitignored.

## Sacred laws (enforced by all commands)

- Never rely on conversation history for SCROLL CONTENT — always write to the scrolls
  (the chat's *active quest* is the one exception: it is carried in-conversation, per Active-quest selection)
- TOME_OF_DANGERS.md must be updated the moment a new danger is found
- ADVENTURE_JOURNAL.md is append-only — history is never rewritten
- Work is always scoped to the active realm only
- No code is written until the commander approves the battle plan
- Project-global state files are append-only or lock-guarded — never a bare rewrite

## Split rules

Scrolls beyond 500 lines are split into subfiles to keep context loading efficient.

### Split targets

| Scroll | Split folder | Split by |
|---|---|---|
| TOME_OF_DANGERS.md | dangers/ | category: rendering, memory, swift-concurrency, ui, file-io |
| STRATEGY_SCROLL.md | strategy/ | one file per major module |
| ADVENTURE_JOURNAL.md | journal/ | one file per month: YYYY-MM.md |
| WORLD_MAP.md | map/ | area: navigation, data-flow, key-files |
| ADVENTURERS_HANDBOOK.md | never splits | — |

### Index format after split

After splitting, the main scroll becomes a lightweight index:
- Keep YAML frontmatter (update `last-updated`)
- Keep summary / overview (~50 lines max)
- Add a `## Content Index` table pointing to subfiles
- STRATEGY_SCROLL: always keep battle status table in the index
- ADVENTURE_JOURNAL: keep last 3 entries in the index
- TOME_OF_DANGERS: keep 3 most critical dangers as a fast-read summary

### Announce on split

When a split occurs, announce:
"📜 {filename} has grown beyond 500 lines. Splitting into subfiles..."

## Project-level files

Two lightweight files live at `.ai-context/` and persist across all quests.
Created by `/complete-quest`. Read by `/embark` before quest scrolls.

| File | Purpose |
|---|---|
| `DANGER_REGISTRY.md` | Distilled dangers from all completed quests — the project's institutional memory |
| `DECISIONS_LOG.md` | Locked architectural decisions from all completed quests |

These files are small by design. They contain only the lessons that survived — not trial-and-error history.
`/embark` loads them first. Quest scrolls load second.

### DANGER_REGISTRY.md template
---
type: danger-registry
last-updated: {date}
---
# Project Danger Registry

Distilled from completed quests. Read before proposing any strategy.
Each entry survived at least one real quest — do not ignore.

## Rendering Dangers
| Danger | Impact | Remedy | Quest |
|---|---|---|---|

## Memory Dangers
| Danger | Impact | Remedy | Quest |
|---|---|---|---|

## Concurrency Dangers
| Danger | Impact | Remedy | Quest |
|---|---|---|---|

## Architecture Dangers
| Danger | Impact | Remedy | Quest |
|---|---|---|---|

### DECISIONS_LOG.md template
---
type: decisions-log
last-updated: {date}
---
# Project Decisions Log

Architectural decisions locked during completed quests.
These are oaths — do not re-open without the commander's explicit order.

| Decision | Reason | Quest | Date |
|---|---|---|---|

## /summon-witch-doctor — Scroll health check

Reads the active quest's scrolls and reports their health without modifying anything.

### What it checks

1. `.claude/active-quest.txt` — exists, 2 non-empty lines, quest folder path exists on disk
2. Each scroll — exists, non-empty, all required headings present
3. YAML frontmatter — each scroll must have `quest`, `realm`, `scroll`, `last-updated` keys
4. Split state — if a split subfolder (dangers/, journal/, strategy/, map/) exists, check: at least one subfile exists, each subfile is non-empty, index has a `## Content Index` section; if no subfolder but file is >500 lines, flag as SPLIT_NEEDED
5. Expedition migration readiness — detects legacy `session` / `phase` terminology in scroll content and flags `MIGRATION_NEEDED` when older wording should be migrated

### Output format

```
Quest: scan-alignment-floor-annotation  |  Realm: WeScanX

Scroll                   Status        Issues
-----------------------  ------------  ------
WORLD_MAP.md             OK
STRATEGY_SCROLL.md       WARN          Missing frontmatter: last-updated
ADVENTURE_JOURNAL.md     SPLIT         journal/ (3 subfiles, current: 2026-05.md)
TOME_OF_DANGERS.md       MISSING       File does not exist
ADVENTURERS_HANDBOOK.md  SPLIT_NEEDED  File is 612 lines — run /make-camp to trigger split

📁 Split scrolls: ADVENTURE_JOURNAL (journal/)
```

### Repair

If issues are found, `/summon-witch-doctor` asks: "Repair affected scrolls? (y/n)"
- **y**: recreates missing scrolls from the current template; for scrolls with missing sections only, appends the missing sections at the end with a `<!-- repaired by /summon-witch-doctor -->` marker; adds missing frontmatter keys to scrolls that have an incomplete frontmatter block; applies narrow terminology replacements for legacy `session` / `phase` entries.
- **n**: exits after reporting.

Never rewrites unrelated content. Never touches OK scrolls. Never merges or reorganizes split subfiles.

## .ai-context/ — portable AI context

All quest state and project memory lives here. Committed to git so the whole team benefits.

```
.ai-context/
  DANGER_REGISTRY.md              ← project-wide dangers (all completed quests)
  DECISIONS_LOG.md                ← project-wide decisions (all completed quests)
  README.md                       ← how to use with each AI tool
  quests/{quest-name}/            ← one folder per quest (5 scrolls + context.md)
    context.md                    ← merged fast-read: paste into any AI tool
    WORLD_MAP.md
    STRATEGY_SCROLL.md
    ADVENTURE_JOURNAL.md
    TOME_OF_DANGERS.md
    ADVENTURERS_HANDBOOK.md
  side-quests/{slug}/             ← lightweight side-quests (one NOTE.md each)
    NOTE.md
  side-quests/done/{slug}/        ← closed side-quests (moved by /close-side-quest)
  archived/{quest-name}/          ← completed quests (moved by /complete-quest)
```

### Side-quest layout — `NOTE.md`

A side-quest is one file. Created by `/side-quest`, it does not disturb the
current chat's active quest. `parent` links it to the quest that was active when
it was spawned (or `none`). On `/close-side-quest` its findings/decisions distill
up to the parent's TOME/STRATEGY (or the project registries if `parent: none`).
```
---
type: side-quest
slug: {slug}
parent: .ai-context/quests/{parent-name} | none
realm: {realm}
status: open | done | promoted
created: "{YYYY-MM-DD}"          # quoted — unquoted ISO dates parse to Date
---
# Side-Quest: {one-line description}
## Findings
## Dangers     (distills to parent TOME_OF_DANGERS / project DANGER_REGISTRY)
## Decisions   (distills to parent STRATEGY_SCROLL / project DECISIONS_LOG)
```

### Canonical multi-chat walkthrough

The intended end-to-end flow, two chats in one folder:

1. **Chat A** `/embark --quest dashboard-redesign` → works the main quest; carries
   `dashboard-redesign` in-conversation.
2. Mid-work, A spots a font bug: `/side-quest "badge label font too small"` →
   creates `.ai-context/side-quests/badge-label-font/NOTE.md` with
   `parent: .ai-context/quests/dashboard-redesign`, appends a one-line breadcrumb
   to the parent journal, and **leaves A on dashboard-redesign** (no switch).
3. **Chat B** (new chat, same folder) picks it up: `/start-quest badge-label-font`
   (or any command with `--quest badge-label-font`). Side-quest pickup activates
   the NOTE as a lightweight one-scroll context and does NOT touch the shared
   pointer — it still reads dashboard-redesign — so Chat A is unaffected either
   way; Chat B works directly against the NOTE.
4. Both finish together. Chat A `/make-camp` echoes "camping dashboard-redesign /
   realm app — confirm?", appends an `expedition` line to `events.log` via `>>`,
   recomputes `profile.md`. Chat B `/close-side-quest` distills the font danger up
   into dashboard-redesign's `TOME_OF_DANGERS.md`, moves the NOTE to
   `side-quests/done/`. No shared file is rewritten from a stale read; both XP
   events land.

| File | Contents | Updated by |
|---|---|---|
| `quests/{quest-name}/context.md` | Battle status + open riddles + road ahead + top dangers + locked decisions | `/embark`, `/make-camp` |
| `DANGER_REGISTRY.md` | All dangers distilled from completed quests | `/complete-quest` |
| `DECISIONS_LOG.md` | All decisions distilled from completed quests | `/complete-quest` |
| `README.md` | How to use with each AI tool | Created once by `/new-quest` |

**context.md** is the one file to paste into any AI tool. It includes everything needed to resume work: battle status, open riddles, road ahead, top quest dangers, and locked decisions (quest + project-level).

### context.md format
```
# Quest Context: {quest-name}
Realm: {realm}  |  Last updated: {date}
*Paste this file into any AI tool to load the active quest state.*

## Battle Status
{battle status table from STRATEGY_SCROLL}

## Open Riddles
{open riddles from STRATEGY_SCROLL, or "None"}

## Road Ahead
{last expedition's "The Road Ahead" entry from ADVENTURE_JOURNAL}

## Known Dangers
### Quest Dangers
{fast-read summary from TOME_OF_DANGERS index — top 5}

### Project Dangers
{top 5 rows from DANGER_REGISTRY.md if exists, else "(none yet — complete a quest first)"}

## Locked Decisions
### Quest Decisions
{oaths from STRATEGY_SCROLL Oaths Sworn section}

### Project Decisions
{rows from DECISIONS_LOG.md if exists, else "(none yet — complete a quest first)"}
```

## XP system

Developers earn EXP for completing work. Profile is stored in `.claude/quest-xp/`
(gitignored — local to your machine, not shared).

### Profile files

| File | Purpose |
|---|---|
| `.claude/quest-xp/profile.md` | Adventurer stats, level, EXP, badges |
| `.claude/quest-xp/quest-history.md` | EXP log per completed quest |

Created by `/new-quest` on first use. Both files gitignored automatically.

### EXP formula (awarded by /complete-quest)

EXP is derived from quest data — no manual difficulty rating needed.

| Source | EXP |
|---|---|
| Base reward | 100 |
| Per module conquered | 25 |
| Per expedition logged | 10 |
| Per danger in TOME_OF_DANGERS | 15 |
| Per oath sworn | 20 |
| Per split scroll | 50 |
| Clean sweep (zero open riddles at completion) | +75 bonus |
| Speed run (completed in ≤ 3 expeditions) | +50 bonus |

Per-expedition EXP (awarded by /make-camp):

| Source | EXP |
|---|---|
| Completing an expedition | 5 |
| New danger discovered this expedition | +10 |
| New oath sworn this expedition | +10 |

### Level table

Levels run 1–50. Each level costs `level × 300` EXP over the previous one, so the
total EXP to REACH level N is:

    threshold(N) = 150 × N × (N − 1)          (exp-to-next at level L = 300 × L)

Titles are tiered every 5 levels, with rank `I`–`V` for the 1st–5th level inside a
tier. A full title is `{tier} {rank}` — e.g. level 1 = `Apprentice Coder I`,
level 26 = `Master Builder I`, level 50 = `Transcendent Engineer V` (MAX LEVEL).

| Levels | Tier title | Threshold at tier start |
|---|---|---|
| 1–5 | Apprentice Coder | 0 |
| 6–10 | Journeyman Developer | 4,500 |
| 11–15 | Skilled Developer | 16,500 |
| 16–20 | Senior Developer | 36,000 |
| 21–25 | Expert Architect | 63,000 |
| 26–30 | Master Builder | 97,500 |
| 31–35 | Grand Master | 139,500 |
| 36–40 | Legendary Coder | 189,000 |
| 41–45 | Mythic Developer | 246,000 |
| 46–50 | Transcendent Engineer | 310,500 |

### Badges

| Badge | Name | Unlock condition |
|---|---|---|
| 🗡️ | First Blood | Complete your first quest |
| 📜 | Scroll Keeper | Complete 5 quests |
| ⚔️ | Veteran | Complete 10 quests |
| 🏆 | Legend | Complete 25 quests |
| 🕵️ | Danger Mapper | Map 10 total dangers |
| ☠️ | Danger Hoarder | Map 50 total dangers |
| 🤝 | Oath Keeper | Swear 10 total oaths |
| 📚 | Lore Master | Swear 50 total oaths |
| 🚀 | Speed Runner | Complete a quest in ≤ 3 expeditions |
| 🧘 | Marathoner | Log 50 total expeditions |
| 🔥 | Unstoppable | Log 200 total expeditions |
| ✨ | Clean Sweep | Complete a quest with zero open riddles |
| 📂 | Split Master | Trigger 5 scroll splits |
| 🌟 | Rising Star | Reach level 5 |
| 💎 | Diamond | Reach level 10 |

### Event log (source of truth) + profile cache

Because several chats in one folder can finish work at the same time, XP is NOT a
counter that commands read-modify-write (that loses updates). Instead:

- **`.claude/quest-xp/events.log` is the append-only source of truth.** Every
  XP-earning action appends ONE self-contained line via a shell append
  (`printf '%s\n' >> .claude/quest-xp/events.log`) — never Edit/Write. Concurrent
  appends interleave whole lines; a torn/garbled line is skipped on fold.
  ```
  {iso-date}|{event}|{quest-name}|key=val;key=val;...
  2026-06-04|expedition|scan-align|base=5;dangers=1;oaths=0
  2026-06-04|quest-complete|scan-align|modules=4;expeditions=3;dangers=6;oaths=2;splits=1;clean=1;speed=1
  2026-06-02|seed|-|total-exp=2790;expeditions=10;dangers=16;oaths=33;splits=0
  ```
- **`profile.md` is a derived cache**, recomputed by folding the log. It keeps the
  same frontmatter keys (the read-only quest-dashboard reads this file, not the
  log), plus `derived-from-events: {N}` = the line count it was built from. Any
  command that appends an event MUST recompute and rewrite `profile.md` in the
  same run. `/quest-xp` recomputes if `derived-from-events` ≠ actual line count
  (self-healing).
- **Seeding (migration):** if `events.log` is absent but `profile.md` has totals,
  append ONE `seed` line carrying the current totals, then recompute. Guarded by
  the log-absent check so it never double-seeds.

### XP derivation (the fold)

`events.log` is the source of truth; totals/level/badges are DERIVED by folding the
WHOLE log every time (idempotent — never patch the cache incrementally).

Event line format (pipe-delimited; shell `>>` append ONLY, never Edit/Write):
`{YYYY-MM-DD}|{type}|{quest-name}|{k=v;k=v;...}`

| type | emitted by | fields |
|---|---|---|
| `seed` | first XP write on a pre-events.log install | total-exp; quests-completed; total-expeditions; total-dangers-mapped; total-oaths-sworn; total-splits; badges=A,B,C (the FULL current profile, verbatim) |
| `expedition` | /make-camp | dangers=N; oaths=N; split=0\|1 |
| `quest-complete` | /complete-quest | modules; expeditions; dangers; oaths; splits; clean=0\|1; speed=0\|1 |

Fold algorithm — start all counters at 0 and the badge set empty, then per line:
- `seed` → add its counters to the accumulators; UNION its badges into the set.
  (Baseline for migrated installs; absent on fresh installs.)
- `expedition` → total-expeditions += 1; total-dangers-mapped += dangers;
  total-oaths-sworn += oaths; total-splits += split;
  total-exp += 5 + (dangers>0 ? 10 : 0) + (oaths>0 ? 10 : 0).
- `quest-complete` → quests-completed += 1;
  total-exp += 100 + modules*25 + expeditions*10 + dangers*15 + oaths*20 + splits*50
  + (clean ? 75 : 0) + (speed ? 50 : 0).
  Does NOT re-add expedition/danger/oath/split counters — those were already counted
  by the expedition events; the quest-complete fields drive the REWARD only.
- Skip any malformed/torn line (warn, do not abort).

Then derive:
- `level` = highest level whose threshold ≤ total-exp (Level table above).
- derived badges = every badge whose condition holds against the folded
  counters/level (Badges table); Speed Runner / Clean Sweep additionally unlock
  from any `quest-complete` event with speed=1 / clean=1.
- **`badges` = UNION(seed badges, derived badges). NEVER recompute badges from
  scratch** — the seed carries historically-earned badges that may not be
  re-derivable (e.g. quest-completion badges), and they must never be dropped.

Write the result to `profile.md` (the cache): all 7 numeric keys + `adventurer` +
`badges` + `derived-from-events: {lines folded}`. The read-only dashboard reads
this cache, so every one of those keys MUST be present on every write.

Seeding (migration), idempotent: if `events.log` is ABSENT and `profile.md` has
totals, append ONE `seed` line carrying the full current profile, then proceed.
The log-absent check is the guard — never seed twice.

Self-healing: `/quest-xp` (and any XP write) recomputes when `derived-from-events`
≠ the actual line count. The cache rewrite is itself unlocked, but because it is a
full-log fold, a lost cache write just self-heals on the next recompute.

Reference + regression oracle: `scripts/quest-xp-fold.sh` is the authoritative
implementation of this fold (input: an events.log; output: the derived
KEY=VALUE profile fields). Keep this prose and that script in lockstep; the fold
is regression-tested by `hooks/tests/quest-xp-fold-test.sh`.

### Lifecycle log (live phase for the dashboard)

`.claude/quest-xp/lifecycle.log` is a SEPARATE append-only log — a sibling of
`events.log`, never the same file. Each lifecycle command appends ONE `state`
line via a shell append (`printf '%s\n' >> .claude/quest-xp/lifecycle.log`) the
moment a quest changes phase:

```
{YYYY-MM-DD}|state|{quest-name}|phase={planning|ready|embarked|at-camp}
```

| phase | written by |
|---|---|
| `planning` | `/new-quest` (fresh scaffold, no plan yet) |
| `ready` | `/counsel-quest` PRE/PIVOT once the plan is locked (`planning` if open riddles remain) |
| `embarked` | `/embark` after the commander approves the plan; also the `quest-lifecycle-bump.sh` PostToolUse hook on the first real code edit |
| `at-camp` | `/make-camp` |

The `quest-lifecycle-bump.sh` hook (PostToolUse on `Edit|Write`) is the deterministic
backstop for `embarked`: command appends depend on the model running a buried shell
step, so a skipped step or interrupted session left the dashboard stuck. The hook
records `phase=embarked` on the first edit to a real project file (edits under
`.ai-context/` or `.claude/` are planning artifacts and never bump). It is idempotent
— it appends only when the last recorded phase is not already `embarked`.

Why a separate file, not `events.log`: `/embark` is the only command that must
signal a transition yet writes no scroll and earns no XP. Folding state lines
into `events.log` would be unsafe — the XP seed guard keys off `events.log`
existence and the fold keys off its line count, so an `/embark` append before the
first XP event could suppress the migration seed and zero out a migrated profile.
Keeping lifecycle state in its own log means a state append can never perturb XP.

The read-only quest-dashboard reads the LAST `state` line for the active quest and
trusts it over scroll inference (which only changes at `/make-camp` boundaries).
`/complete-quest` and `/change-quest` write no `state` line — they update
`.claude/active-quest.txt`, which the dashboard watches directly.

### Profile file format

`.claude/quest-xp/profile.md` (derived cache — recomputed from events.log):
```
---
adventurer: {git user.name or "Adventurer"}
level: 1
total-exp: 0
quests-completed: 0
total-expeditions: 0
total-dangers-mapped: 0
total-oaths-sworn: 0
total-splits: 0
badges: []
derived-from-events: 0
---
# {adventurer}'s Adventurer Profile
...rendered by /quest-xp...
```

`.claude/quest-xp/quest-history.md`: append-only log, one entry per completed quest.

## Installation

Run `/install-quest-system` once per project.
To reuse in a new project: copy this SKILL.md file, then run `/install-quest-system`.

## Scroll templates

These templates are used by /new-quest to create fresh scrolls.
Claude Code should reference these when creating quest folders.

### WORLD_MAP.md template
---
quest: {quest-name}
realm: {realm}
scroll: WORLD_MAP
last-updated: {date}
---
# World Map — {quest-name}
## Realm
This workspace contains multiple realms (app targets).
All work this quest is scoped to **{realm}** only.
Do not venture into other realms unless explicitly commanded.
## Module Map
(to be charted during first expedition scouting)
## Navigation Flow
(to be charted during first expedition scouting)
## Data Flow
(to be charted during first expedition scouting)
## Key Files
| File | Role |
|---|---|
## Retired Files
(none yet)

### STRATEGY_SCROLL.md template
---
quest: {quest-name}
realm: {realm}
scroll: STRATEGY_SCROLL
last-updated: {date}
---
# Strategy Scroll — {quest-name}
## Battle Status
| Module | Status |
|---|---|
## Oaths Sworn (Resolved Decisions)
(none yet)
## Fallen Strategies (Rejected Approaches)
(none yet)
## Scouting Findings (Audit Results)
(none yet)
## Open Riddles (Decisions Needed)
(none yet)
## The Battle Plan (Implementation Sequence)
(to be written before the next expedition)

## Planned Expeditions
(seeded by /counsel-quest from the battle plan; flipped [ ]→[>]→[x] by /embark and /make-camp)

### ADVENTURE_JOURNAL.md template
---
quest: {quest-name}
realm: {realm}
scroll: ADVENTURE_JOURNAL
last-updated: {date}
---
# Adventure Journal — {quest-name}
Append-only. One entry per expedition. Never rewrite history.

### TOME_OF_DANGERS.md template
---
quest: {quest-name}
realm: {realm}
scroll: TOME_OF_DANGERS
last-updated: {date}
---
# Tome of Dangers — {quest-name}
Source of truth for every monster, trap, and curse encountered.
Always read before proposing any strategy involving rendering,
memory, or architecture.
## Confirmed Safe Paths
(to be discovered during scouting)
## Known Dangers
| Danger | Impact | Remedy |
|---|---|---|
## Fallen Strategies (Tried and Abandoned)
(none yet)
## Unsolved Riddles (Open Verification Items)
(none yet)

### ADVENTURERS_HANDBOOK.md template
---
quest: {quest-name}
realm: {realm}
scroll: ADVENTURERS_HANDBOOK
last-updated: {date}
---
# Adventurer's Handbook — How to Use the Scrolls

Read this scroll if you are unsure what belongs where.
These scrolls are the party's shared memory.
Never rely on conversation history — always inscribe to the scrolls.

## WORLD_MAP.md
The map of the realm — how the codebase is structured.
Inscribe: module map, navigation flow, data flow, key files, retired files.
Do NOT inscribe: decisions, constraints, expedition history.
Update when: any structural or navigational change is made.

## STRATEGY_SCROLL.md
The agreed battle plan — what we are building and why.
Inscribe: battle status, implementation sequence, oaths, fallen strategies,
scouting findings, open riddles.
Do NOT inscribe: realm structure, dangers, expedition history.
Update when: step conquered, oath sworn, strategy falls, riddle resolved.

## ADVENTURE_JOURNAL.md
Append-only chronicle. Format every entry as:
## Expedition [DATE]
### Conquered
### Oaths Sworn
### Cursed / Uncertain
### The Road Ahead
Update when: end of every expedition, no exceptions.

## TOME_OF_DANGERS.md
Every confirmed danger, curse, and trap encountered.
Inscribe: safe paths, known dangers, remedies, fallen strategies,
unsolved riddles, safe limits.
Update when: new danger found, remedy validated, assumption confirmed.
STOP mid-expedition and inscribe immediately when a new danger is found.

## Sacred Laws
- Not in the scrolls = does not exist as shared knowledge
- TOME_OF_DANGERS.md prevents fighting the same monster twice — keep it current
- ADVENTURE_JOURNAL.md is append-only — history is sacred
