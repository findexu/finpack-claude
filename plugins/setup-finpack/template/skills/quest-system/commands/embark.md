---
description: Start an expedition on the active quest. Scopes today's focus, loads only relevant subfiles, briefs the commander, proposes an expedition plan, and waits for approval before any work begins.
argument-hint: "[--quest <name>] [--realm <realm>] [--counsel [N]] [--strict]"
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
- "Counsel this plan" — run one review round (see Step 6.5) before deciding
- "Run /counsel-quest first" — stop here; the commander wants to lock decisions before executing

**Do not begin any implementation work until the commander approves the expedition plan.**

## Step 6.5: Counsel the expedition plan (opt-in)

This step runs ONLY when the commander picks "Counsel this plan" OR `$ARGUMENTS`
contains `--counsel`. With no counsel requested, skip this step entirely — plain
`/embark` spends no extra tokens.

Parse from `$ARGUMENTS` (after the quest/realm flags are consumed in Step 1):
- `--counsel [N]` — N = max review rounds. Bare `--counsel` (or the menu pick)
  means N=1. Any integer sets the cap.
- `--strict` — only BLOCKING issues drive the loop; minor issues are listed but
  never cause another round.

**Availability check (graceful degrade).** Before the first review round, confirm
the `fp-plan-reviewer` agent is installed:
- Install-script distribution: check that `.claude/agents/fp-plan-reviewer.md` exists.
- Plugin distribution: the agent ships atomically with the quest-system plugin, so
  it is present whenever embark is.

If it is unavailable, WARN and fall through to the normal approval prompt — never
crash the expedition over an optional step:
```
Plan counsel unavailable — fp-plan-reviewer not installed.
Run /install-quest-system (or /update-quest-system) to enable.
Proceeding to manual approval.
```

**Review loop.** Otherwise run:

```
round = 0
prev_blocking = +infinity
loop:
  round += 1
  Spawn fp-plan-reviewer with: the current proposed steps, the loaded quest
    context (dangers, locked decisions, battle status), and --strict if set.
  Read the returned verdict line: "READY | REVISE (blocking: B, minor: M)".

  if B == 0:                  -> READY. Present the plan for approval. Break.
  if not --counsel (menu, N=1 done) or round >= N:
                              -> STOP (cap reached). Present the latest plan plus
                                 the outstanding blocking issues; let the commander
                                 decide (adjust / approve anyway / abort). Break.
  if B >= prev_blocking:      -> STOP (not converging). Present the latest plan plus
                                 the outstanding blockers; hand the decision to the
                                 commander. Break.
  prev_blocking = B
  Apply the agent's BLOCKING fixes to the proposed steps (you, the embark
    context, are the author here — the agent only judges, never edits).
  Re-present the revised steps and continue the loop.
```

The `B >= prev_blocking` guard stops a run that stalls or thrashes: it bails as
soon as a round fails to reduce the blocking count, rather than churning to the
cap. This is intentional — surfacing a stuck plan to the commander beats burning
rounds on it.

After the loop ends for any reason, the approval gate below still applies. Counsel
informs the decision; it never auto-executes.

**Do not begin any implementation work until the commander approves the expedition plan.**

## Step 6.9: Mark the planned expedition active

Runs only AFTER the commander approves the plan (the approval is the human gate — add
no extra confirm). If `STRATEGY_SCROLL.md` has a `## Planned Expeditions` checklist,
find the next `- [ ]` whose label matches `{expedition-focus}` and flip it to `- [>]`;
if none matches, append `- [>] {expedition-focus}` to the checklist. This is the only
scroll `/embark` writes — a STRATEGY_SCROLL body edit. NEVER touch `events.log` or
`lifecycle.log` here (the lifecycle line is Step 8's job; a non-XP append to events.log
would wipe a migrated profile). If the checklist is absent (quest never counselled),
skip silently — do not create it (that is `/counsel-quest`'s job).

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
