---
description: Start an expedition on the active quest. Scopes today's focus, loads only relevant subfiles, briefs the commander, proposes an expedition plan, and waits for approval before any work begins.
argument-hint: "[--quest <name>] [--realm <realm>]"
---

# Embark

Start a new expedition on the active quest.

## Step 1: Resolve the active quest

Resolve the quest for THIS chat (see SKILL.md -> "Active-quest selection"):
1. If a `--quest <name-or-path>` argument was given, use it; read its realm from that
   quest's `STRATEGY_SCROLL.md` frontmatter unless `--realm <realm>` was also passed.
2. Otherwise read `.claude/active-quest.txt` (line 1 = quest folder path, line 2 = realm).

The shared pointer is UNTRUSTED in multi-chat — carry this chat's quest in-conversation
and pass it as `--quest`. `{quest-name}` is the basename of the resolved folder path.

If the file does not exist:
"No active quest. Run /new-quest to create one." Stop.

If the quest folder does not exist on disk:
"Quest folder not found at {path}. Run /new-quest or /change-quest." Stop.

## Step 1.5: Scope this expedition

Before loading anything, ask:

> "What are we working on today?"

Wait for the response. This is not optional — the answer drives what context gets
loaded and what the expedition plan will be.

If the commander says something vague ("not sure", "continue from last time",
"whatever is next"), probe once:
- "What was the last open item from the previous expedition?"
- "Which part of the battle plan is next?"

Do not proceed until you have a concrete focus for this expedition.
Record it as `{expedition-focus}`.

## Step 2: Load project-level knowledge (if exists)

Check for project-level files in `.ai-context/`:
- `.ai-context/DANGER_REGISTRY.md` — distilled dangers from all past quests
- `.ai-context/DECISIONS_LOG.md` — locked architectural decisions from all past quests

If either file exists, read it in full. These are small by design.
Note any dangers or decisions relevant to `{expedition-focus}` — they take priority
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

Using `{expedition-focus}`, load only the subfiles you need for today's work:

- **ADVENTURE_JOURNAL** — if `journal/` exists, read `journal/{YYYY-MM}.md` for the current month only.
  Do not load historical months unless the commander explicitly asks.
- **TOME_OF_DANGERS** — if `dangers/` exists, read only the category files relevant to `{expedition-focus}`
  (e.g. `dangers/rendering.md` if today's work touches rendering logic).
- **STRATEGY_SCROLL** — if `strategy/` exists, read only the module files in scope for `{expedition-focus}`.
- **WORLD_MAP** — if `map/` exists, read only the area files relevant to `{expedition-focus}`.

## Step 5: Brief the commander

Output:
```
⚔️  Expedition begins.
Quest: {quest-name}  |  Realm: {realm}
Focus: {expedition-focus}
Strategy last updated: {last-updated from STRATEGY_SCROLL frontmatter}
```

Then present a briefing scoped to today's focus:
1. **Project dangers** — entries from DANGER_REGISTRY.md relevant to `{expedition-focus}` (if file exists)
2. **Locked decisions** — entries from DECISIONS_LOG.md relevant to `{expedition-focus}` (if file exists)
3. **Battle status** — table from STRATEGY_SCROLL index
4. **Recent history** — last 3 journal entries (from ADVENTURE_JOURNAL index or current month file)
5. **Quest dangers** — top 3 dangers from TOME_OF_DANGERS relevant to `{expedition-focus}`
6. **Open riddles** — list from STRATEGY_SCROLL index

## Step 6: Propose expedition plan and await approval

Based on `{expedition-focus}` and the scroll context, propose a concrete expedition plan:

```
## Expedition Plan

Focus: {expedition-focus}

Proposed steps:
1. {concrete first step}
2. {concrete second step}
...

Dangers to watch:
- {any dangers from TOME_OF_DANGERS directly relevant to today's work}

Open riddles that may block us:
- {any open riddles relevant to today — or "none blocking today's work"}
```

Then ask:

> "Does this plan look right, or do you want to adjust before we start?"

Options:
- "Looks good, let's go" — begin the expedition
- "Adjust the plan" — take the commander's notes and revise; re-present; loop until approved
- "Run /counsel-quest first" — stop here; the commander wants to lock decisions before executing

**Do not begin any implementation work until the commander approves the expedition plan.**

## Step 7: Refresh context.md

Write `{quest-folder}/context.md` using data already loaded:

```
# Quest Context: {quest-name}
Realm: {realm}  |  Last updated: {date}  |  Expedition: active
*Paste this file into any AI tool to load the active quest state.*

## Battle Status
{battle status table from STRATEGY_SCROLL}

## Open Riddles
{open riddles from STRATEGY_SCROLL, or "None"}

## Road Ahead
{last expedition's "The Road Ahead" entry from ADVENTURE_JOURNAL, or "No expeditions yet"}

## Known Dangers
### Quest Dangers
{fast-read summary from TOME_OF_DANGERS index — top 5, or "None yet"}

### Project Dangers
{top 5 rows from .ai-context/DANGER_REGISTRY.md if exists, else "(none yet — complete a quest first)"}

## Locked Decisions
### Quest Decisions
{entries from STRATEGY_SCROLL Oaths Sworn section, or "None yet"}

### Project Decisions
{rows from .ai-context/DECISIONS_LOG.md if exists, else "(none yet — complete a quest first)"}
```

## Step 8: Record the lifecycle transition

After the commander approves the plan, append ONE `state` line to the lifecycle
log with a SHELL APPEND (never Edit/Write). This is the fast-path signal that an
expedition has begun — `/embark` writes no journal entry, so this advances the
dashboard the moment the plan is approved rather than waiting for the first edit.

```bash
printf '%s\n' "{YYYY-MM-DD}|state|{quest-name}|phase=embarked" >> .claude/quest-xp/lifecycle.log
```

`{quest-name}` is the basename of the quest folder (matching the XP event format).
Do this once, silently — it is not part of the expedition work.

If this step is ever missed, the `quest-lifecycle-bump.sh` PostToolUse hook is the
deterministic backstop: it records `phase=embarked` on the first real code edit
(edits to scrolls under `.ai-context/` or `.claude/` do not count). The hook is
idempotent, so running this append as well is harmless.
