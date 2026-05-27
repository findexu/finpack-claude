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

## Step 5: Confirm

Report:
```
⚔️  Quest created: {quest-name}
Realm: {realm}
Scrolls: 5 files in docs/dev/{quest-name}/
Active quest set.

Run /embark to start your first expedition.
```
