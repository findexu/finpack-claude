---
description: Create a new quest (feature/epic) scaffold. Asks for name and realm, creates the five scrolls, and sets the active quest. Deep planning happens in /counsel-quest.
argument-hint: "[quest-name] [realm]"
---

# New Quest

Create a new quest. A quest is a feature or epic tracked with five persistent scrolls.

This command **only scaffolds** — it creates the folder and blank scrolls.
Deep planning (codebase exploration, architecture design, decision-locking) happens in `/counsel-quest`.

## Step 1: Confirm quest name and realm

If $ARGUMENTS was provided, parse: first token = quest name, second token = realm.

Otherwise, ask:
1. "What is the quest name?" — suggest a kebab-case slug (e.g. `scan-alignment-floor-annotation`)
2. "Which realm (app target) is this quest scoped to?" (e.g. `WeScanX`)

Confirm with the commander before proceeding.

## Step 2: Create quest folder

Create the folder: `.ai-context/quests/{quest-name}/`

If the folder already exists and any scroll files are present, warn:
"Quest folder already exists. Continue and overwrite scrolls? (y/n)"
Stop if n.

## Step 3: Create all five scrolls

Fill in `{quest-name}`, `{realm}`, `{date}` (YYYY-MM-DD) throughout.
Leave all planning sections as templates — `/counsel-quest` will populate them.

Create each file with the full template content below:

**`.ai-context/quests/{quest-name}/WORLD_MAP.md`:**
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
```

**`.ai-context/quests/{quest-name}/STRATEGY_SCROLL.md`:**

```
---
quest: {quest-name}
realm: {realm}
scroll: STRATEGY_SCROLL
last-updated: {date}
---
# Strategy Scroll — {quest-name}

## Quest Overview
(run /counsel-quest to define — what this quest is and why it exists)

## Acceptance Criteria
(run /counsel-quest to define — observable outcomes, not tasks)

## Scope
**In scope:** (run /counsel-quest to define)
**Out of scope:** (run /counsel-quest to define)

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
(none yet — run /counsel-quest before first expedition)

## The Battle Plan (Implementation Sequence)
(not yet defined — run /counsel-quest to lock the plan before embarking)
```

**`.ai-context/quests/{quest-name}/ADVENTURE_JOURNAL.md`:**
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

**`.ai-context/quests/{quest-name}/TOME_OF_DANGERS.md`:**

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

**`.ai-context/quests/{quest-name}/ADVENTURERS_HANDBOOK.md`:**
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
.ai-context/quests/{quest-name}
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
Paste the contents of context.md at the start of your Copilot Chat session.
Or add to .github/copilot-instructions.md for always-on context (note: becomes stale
between /make-camp runs — paste is more accurate).

**Google Gemini / other AI tools:**
Paste context.md at the start of your chat.

**Recommended opening message:**
"Here is the current project context: [paste context.md]"

## Files

- quests/{quest-name}/context.md  — active quest: status, dangers, decisions (paste this)
- DANGER_REGISTRY.md              — project-wide dangers from all completed quests
- DECISIONS_LOG.md                — project-wide decisions from all completed quests
```

3. Create a placeholder file (will be populated by /embark):
   - `.ai-context/quests/{quest-name}/context.md` with content: `# Quest Context\n(run /embark to populate)`

## Step 7: Announce

Output:
```
⚔️  Quest inscribed: {quest-name}
Realm: {realm}

Scrolls created in .ai-context/quests/{quest-name}/:
  ✓ STRATEGY_SCROLL.md
  ✓ TOME_OF_DANGERS.md
  ✓ ADVENTURE_JOURNAL.md
  ✓ WORLD_MAP.md
  ✓ ADVENTURERS_HANDBOOK.md
{if first quest: "\n  ✓ Adventurer profile created. Run /quest-xp to view."}

Next steps:
  /start-quest {quest-name}  — activate and get guided to next step
  /counsel-quest             — plan the quest (recommended before first expedition)
```
