---
name: quest-system
description: >
  RPG-themed epic and expedition management system for Claude Code.
  Tracks quests (features/epics), expeditions (work loops), realms (app targets),
  and maintains persistent scrolls (docs) across all expeditions.
  Use this skill when working on any feature development in a mono-repo
  with multiple app targets. Triggers: /new-quest, /start-quest, /embark,
  /make-camp, /quest-log, /change-quest, /counsel-quest, /install-quest-system,
  /summon-witch-doctor.
version: 1.6.0
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

## Key concepts

- **Quest** — a feature or epic (e.g. "scan-alignment-floor-annotation")
- **Realm** — the app target in scope (e.g. "WeScanX")
- **Expedition** — a single focused work loop (`/embark` -> implementation -> `/make-camp`)
- **Conquered** — completed step
- **Cursed** — blocked or uncertain
- **Oath** — a resolved decision
- **Fallen strategy** — a rejected approach (must be recorded to prevent re-proposing)
- **Unsolved riddle** — an open verification item

## active-quest.txt format

Located at `.claude/active-quest.txt`
Line 1: path to quest scrolls folder (e.g. `.ai-context/quests/scan-alignment-floor-annotation`)
Line 2: realm in scope (e.g. `WeScanX`)

All commands read this file first. Change it with `/change-quest`.

## Sacred laws (enforced by all commands)

- Never rely on conversation history — always write to the scrolls
- TOME_OF_DANGERS.md must be updated the moment a new danger is found
- ADVENTURE_JOURNAL.md is append-only — history is never rewritten
- Work is always scoped to the active realm only
- No code is written until the commander approves the battle plan

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
  archived/{quest-name}/          ← completed quests (moved by /complete-quest)
```

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

Each level requires `level × 150` EXP from the previous level.

| Level | Title | Total EXP needed |
|---|---|---|
| 1 | Apprentice Coder | 0 |
| 2 | Journeyman Developer | 150 |
| 3 | Skilled Developer | 450 |
| 4 | Senior Developer | 900 |
| 5 | Expert Architect | 1500 |
| 6 | Master Builder | 2250 |
| 7 | Grand Master | 3150 |
| 8 | Legendary Coder | 4200 |
| 9 | Mythic Developer | 5400 |
| 10 | Transcendent Engineer | 6750 |

### Badges

| Badge | Name | Unlock condition |
|---|---|---|
| 🗡️ | First Blood | Complete your first quest |
| 📜 | Scroll Keeper | Complete 5 quests |
| ⚔️ | Veteran Adventurer | Complete 10 quests |
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

### Profile file format

`.claude/quest-xp/profile.md`:
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
