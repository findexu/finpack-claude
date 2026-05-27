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

Read the templates from `.claude/skills/quest-system/SKILL.md` — section `## Scroll templates`.
Fill in `{quest-name}`, `{realm}`, and `{date}` (today's date in YYYY-MM-DD format).

Create each file with the full template content including YAML frontmatter:

- `docs/dev/{quest-name}/WORLD_MAP.md`
- `docs/dev/{quest-name}/STRATEGY_SCROLL.md`
- `docs/dev/{quest-name}/ADVENTURE_JOURNAL.md`
- `docs/dev/{quest-name}/TOME_OF_DANGERS.md`
- `docs/dev/{quest-name}/ADVENTURERS_HANDBOOK.md`

Each file must begin with the YAML frontmatter block from the template:
```
---
quest: {quest-name}
realm: {realm}
scroll: {scroll-type}
last-updated: {date}
---
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
