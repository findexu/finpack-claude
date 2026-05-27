---
description: Quick status check on the active quest. Reads YAML frontmatter and index summaries only — does not open a full expedition session.
---

# Quest Log

Show current quest status without starting an expedition.

## Step 1: Read active quest

Read `.claude/active-quest.txt`.
Line 1 = quest folder path. Line 2 = realm.

If not found: "No active quest. Run /new-quest first." Stop.

## Step 2: Read YAML frontmatter from all five index scrolls

For each scroll, read only the YAML frontmatter block (lines between the opening
and closing `---` markers at the top of the file).

Do not read the full file body. Extract `last-updated` from each.

Files to read:
- `{quest-folder}/WORLD_MAP.md`
- `{quest-folder}/STRATEGY_SCROLL.md`
- `{quest-folder}/ADVENTURE_JOURNAL.md`
- `{quest-folder}/TOME_OF_DANGERS.md`
- `{quest-folder}/ADVENTURERS_HANDBOOK.md`

If a scroll file is missing, mark it as MISSING.

## Step 3: Read battle status from STRATEGY_SCROLL.md

Read the `## Battle Status` table from the STRATEGY_SCROLL.md index only.
Do not read subfiles.

## Step 4: Check for split subfolders

For each scroll, check whether its split subfolder exists on disk:
- `{quest-folder}/dangers/` for TOME_OF_DANGERS
- `{quest-folder}/strategy/` for STRATEGY_SCROLL
- `{quest-folder}/journal/` for ADVENTURE_JOURNAL
- `{quest-folder}/map/` for WORLD_MAP

If a subfolder exists, count the files in it.

## Step 5: Output

```
📜 Quest Log
Quest: {quest-name}  |  Realm: {realm}

Battle Status:
{battle status table from STRATEGY_SCROLL}

Scroll health (last updated):
  WORLD_MAP.md             {last-updated or MISSING}
  STRATEGY_SCROLL.md       {last-updated or MISSING}
  ADVENTURE_JOURNAL.md     {last-updated or MISSING}
  TOME_OF_DANGERS.md       {last-updated or MISSING}
  ADVENTURERS_HANDBOOK.md  {last-updated or MISSING}

📁 Split scrolls: {comma-separated list of "SCROLL_NAME (subfolder/, N files)"
                   or "None — all scrolls within threshold"}
```
