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

Create `WORLD_MAP.md`, `ADVENTURE_JOURNAL.md`, `TOME_OF_DANGERS.md`, and
`ADVENTURERS_HANDBOOK.md` in the quest folder from their templates in
SKILL.md -> "Scroll templates" (full content, placeholders filled).

Create `STRATEGY_SCROLL.md` with THIS template (it carries the Quest Overview /
Acceptance Criteria / Scope sections that /counsel-quest and /embark --goal rely on):

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

## Step 4: Set active quest

Write `.claude/active-quest.txt`:
```
.ai-context/quests/{quest-name}
{realm}
```

Then record the starting lifecycle phase with a SHELL APPEND (never Edit/Write).
Create `.claude/quest-xp/` first if it does not exist (the phase record lives
there). A freshly scaffolded quest has no plan yet, so it begins in planning:
```bash
printf '%s\n' "{date}|state|{quest-name}|phase=planning" >> .claude/quest-xp/lifecycle.log
```

## Step 5: Bootstrap the phase record (first quest only)

Ensure `.gitignore` contains `.claude/quest-xp/` (the lifecycle phase record is
local, not shared). Read `.gitignore` if it exists. If the line is absent, append it.

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

Next steps:
  /start-quest {quest-name}  — activate and get guided to next step
  /counsel-quest             — plan the quest (recommended before first expedition)
```
