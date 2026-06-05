---
description: Quick status check on the active quest. Reads YAML frontmatter and index summaries only — does not open a full expedition. Pass --all for the multi-tasking board across every quest and side-quest.
argument-hint: "[--all] [--quest <name>] [--realm <realm>]"
---

# Quest Log

Show current quest status without starting an expedition.

## Step 0: `--all` board mode

If `$ARGUMENTS` contains `--all`, render the multi-tasking board instead of the
single-quest view, then stop:

1. Scan `.ai-context/quests/*/` — for each, read `STRATEGY_SCROLL.md` frontmatter
   + `## Battle Status` and (if present) `context.md` `Expedition:` flag.
2. Scan `.ai-context/side-quests/*/NOTE.md` with `status: open` (EXCLUDE
   `.ai-context/side-quests/done/`). Group each under its `parent`.
3. Read `.claude/active-quest.txt` and mark which quest the default pointer targets
   (`<- pointer`).

```
📋 Quest Board
Quests:
  {quest-name}  | realm {realm} | {expedition flag} {<- pointer if matched}
    side-quests (open): {slug}, {slug}   (or "none")
  ...
Standalone side-quests (open): {slug}, ...   (or "none")

Note: in multi-chat use the pointer is only one chat's default; other chats
carry their own quest via --quest.
```
Stop after the board.

## Step 1: Resolve the active quest

Resolve the quest for THIS chat (see SKILL.md -> "Active-quest selection"):
1. If a `--quest <name-or-path>` argument was given, use it; read its realm from that
   quest's `STRATEGY_SCROLL.md` frontmatter unless `--realm <realm>` was also passed.
2. Otherwise read `.claude/active-quest.txt` (line 1 = quest folder path, line 2 = realm).

The shared pointer is UNTRUSTED in multi-chat — carry this chat's quest in-conversation
and pass it as `--quest`. `{quest-name}` is the basename of the resolved folder path.

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
