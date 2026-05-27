---
description: Start a work session (expedition) on the active quest. Loads project-level danger registry and decisions log first, then scroll indexes, then only subfiles relevant to today's work.
---

# Embark

Start a new expedition on the active quest.

## Step 1: Read active quest

Read `.claude/active-quest.txt`.
Line 1 = quest folder path. Line 2 = realm.

If the file does not exist:
"No active quest. Run /new-quest to create one." Stop.

If the quest folder does not exist on disk:
"Quest folder not found at {path}. Run /new-quest or /change-quest." Stop.

## Step 2: Load project-level knowledge (if exists)

Before reading quest scrolls, check for project-level files in `docs/dev/`:
- `docs/dev/DANGER_REGISTRY.md` — distilled dangers from all past quests
- `docs/dev/DECISIONS_LOG.md` — locked architectural decisions from all past quests

If either file exists, read it in full. These are small by design.
Note any dangers or decisions relevant to today's planned work — they take priority
over anything in the quest's own scrolls.

If neither file exists, skip this step silently.

## Step 3: Read all five index scrolls

Read these files from the quest folder:
- `WORLD_MAP.md`
- `STRATEGY_SCROLL.md`
- `ADVENTURE_JOURNAL.md`
- `TOME_OF_DANGERS.md`
- `ADVENTURERS_HANDBOOK.md`

For each scroll that has a split subfolder present on disk
(`dangers/`, `strategy/`, `journal/`, `map/`):
read the index file only — do not load all subfiles at this stage.

## Step 4: Load relevant subfiles

Based on the planned work for this expedition, load only the subfiles you need:

- **ADVENTURE_JOURNAL** — if `journal/` exists, read `journal/{YYYY-MM}.md` for the current month only.
  Do not load historical months unless the commander explicitly asks.
- **TOME_OF_DANGERS** — if `dangers/` exists, read only the category files relevant to today's work
  (e.g. `dangers/rendering.md` if the work touches rendering logic).
- **STRATEGY_SCROLL** — if `strategy/` exists, read only the module files in scope today.
- **WORLD_MAP** — if `map/` exists, read only the area files relevant to today's work.

## Step 5: Announce expedition

Output:
```
⚔️  Expedition begins.
Quest: {quest-name}  |  Realm: {realm}
Strategy last updated: {last-updated from STRATEGY_SCROLL frontmatter}
```

Then present a briefing:
1. **Project dangers** — any entries from DANGER_REGISTRY.md relevant to today's work (if file exists)
2. **Locked decisions** — any entries from DECISIONS_LOG.md relevant to today's work (if file exists)
3. **Battle status** — table from STRATEGY_SCROLL index
4. **Recent history** — last 3 journal entries (from ADVENTURE_JOURNAL index or current month file)
5. **Quest dangers** — fast-read summary from TOME_OF_DANGERS index (top 3 dangers)
6. **Open riddles** — list from STRATEGY_SCROLL index

Await the commander's orders.

## Step 6: Refresh .ai-context/

If `.ai-context/` directory exists, write all three files using data already loaded:

**`.ai-context/quest.md`:**
```
# Active Quest: {quest-name}
Realm: {realm}  |  Last updated: {date}

## Battle Status
{battle status table from STRATEGY_SCROLL}

## Open Riddles
{open riddles from STRATEGY_SCROLL, or "None"}

## Road Ahead
{last expedition's "The Road Ahead" entry from ADVENTURE_JOURNAL, or "No expeditions yet"}
```

**`.ai-context/dangers.md`:**
```
# Known Dangers
Quest: {quest-name}  |  Last updated: {date}

## Quest Dangers
{fast-read summary from TOME_OF_DANGERS index — top 5, or "None yet"}

## Project Dangers
{top 5 rows from DANGER_REGISTRY.md if exists, else "(none yet — complete a quest first)"}
```

**`.ai-context/decisions.md`:**
```
# Locked Decisions
Quest: {quest-name}  |  Last updated: {date}

## Quest Decisions
{entries from STRATEGY_SCROLL Oaths Sworn section, or "None yet"}

## Project Decisions
{rows from DECISIONS_LOG.md if exists, else "(none yet — complete a quest first)"}
```

If `.ai-context/` does not exist, skip silently.
