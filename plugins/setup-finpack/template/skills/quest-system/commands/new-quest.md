---
description: Begin a brand new quest (feature/epic) from scratch. Creates all five scrolls in the quest folder with YAML frontmatter and sets the active quest.
argument-hint: "[quest-name] [realm]"
---

# New Quest

Create a new quest. A quest is a feature or epic tracked with five persistent scrolls.

## Step 1: Get quest details

If $ARGUMENTS is empty, ask:
- Quest name (kebab-case slug, e.g. `scan-alignment-floor-annotation`)
- Realm (the app target in scope, e.g. `WeScanX`)

If provided in $ARGUMENTS, parse: first token = quest name, second token = realm.

## Step 2: Create quest folder

Create the folder: `docs/dev/{quest-name}/`

If the folder already exists and any scroll files are present, warn:
"Quest folder already exists. Continue and overwrite scrolls? (y/n)"
Stop if n.

## Step 3: Create all five scrolls

Use the templates below. Fill in `{quest-name}`, `{realm}`, `{date}` (YYYY-MM-DD).

Create each file with the full template content below:

**`docs/dev/{quest-name}/WORLD_MAP.md`:**
```
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
(to be charted during Phase 1 scouting)
## Navigation Flow
(to be charted during Phase 1 scouting)
## Data Flow
(to be charted during Phase 1 scouting)
## Key Files
| File | Role |
|---|---|
## Retired Files
(none yet)
```

**`docs/dev/{quest-name}/STRATEGY_SCROLL.md`:**
```
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
(to be written after Phase 3)
```

**`docs/dev/{quest-name}/ADVENTURE_JOURNAL.md`:**
```
---
quest: {quest-name}
realm: {realm}
scroll: ADVENTURE_JOURNAL
last-updated: {date}
---
# Adventure Journal — {quest-name}
Append-only. One entry per expedition. Never rewrite history.
```

**`docs/dev/{quest-name}/TOME_OF_DANGERS.md`:**
```
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
```

**`docs/dev/{quest-name}/ADVENTURERS_HANDBOOK.md`:**
```
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
```

## Step 4: Set active quest

Write `.claude/active-quest.txt`:
```
docs/dev/{quest-name}
{realm}
```

## Step 5: Bootstrap adventurer profile (first quest only)

Check if `.claude/quest-xp/profile.md` exists.

If it does NOT exist:

1. Get adventurer name: run `git config user.name`. If unavailable, use "Adventurer".

2. Create `.claude/quest-xp/` directory.

3. Create `.claude/quest-xp/profile.md`:
```
---
adventurer: {git-user-name}
level: 1
total-exp: 0
quests-completed: 0
total-expeditions: 0
total-dangers-mapped: 0
total-oaths-sworn: 0
total-splits: 0
badges: []
---
# {git-user-name}'s Adventurer Profile

Complete quests, log expeditions, and map dangers to earn EXP.
Run /quest-xp to view your profile.
```

4. Create `.claude/quest-xp/quest-history.md`:
```
# Quest History

Append-only EXP log. One entry per completed quest.
```

5. Ensure `.gitignore` contains `.claude/quest-xp/`.
   Read `.gitignore` if it exists. If the line is absent, append it.

## Step 6: Bootstrap .ai-context/ (first quest only)

Check if `.ai-context/` exists.

If it does NOT exist:

1. Create `.ai-context/` directory.

2. Create `.ai-context/README.md`:
```
# AI Context

This folder is maintained by quest-system. Refreshed at every /embark and /make-camp.
Do NOT edit manually — changes will be overwritten.

## How to use

**GitHub Copilot:**
Paste the contents of quest.md at the start of your Copilot Chat session.
Or add to .github/copilot-instructions.md for always-on context (note: becomes stale
between /make-camp runs — paste is more accurate).

**Google Gemini / other AI tools:**
Paste quest.md, dangers.md, and decisions.md at the start of your chat.

**Recommended opening message:**
"Here is the current project context: [paste quest.md] [paste dangers.md]"

## Files

- quest.md      — active quest status, battle progress, open questions, road ahead
- dangers.md    — known technical dangers and constraints to avoid
- decisions.md  — locked architectural decisions that must not be re-debated
```

3. Create placeholder files (will be populated by /embark):
   - `.ai-context/quest.md` with content: `# Active Quest\n(run /embark to populate)`
   - `.ai-context/dangers.md` with content: `# Known Dangers\n(run /embark to populate)`
   - `.ai-context/decisions.md` with content: `# Locked Decisions\n(run /embark to populate)`

## Step 7: Confirm

Report:
```
⚔️  Quest created: {quest-name}
Realm: {realm}
Scrolls: 5 files in docs/dev/{quest-name}/
Active quest set.
{if first quest: "Adventurer profile created. Run /quest-xp to view your profile."}
{if .ai-context/ created: ".ai-context/ created — run /embark to populate for Copilot/Gemini use."}

Run /embark to start your first expedition.
```
