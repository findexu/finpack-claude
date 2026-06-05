---
description: Activate a quest and get guided to the right next step. Reads scroll state and suggests /counsel-quest, /embark, or /quest-log based on where the quest stands.
argument-hint: "[quest-name-or-path]"
---

# Start Quest

Activate a quest and get guided to the right next step.

## Step 1: Find the target quest

If $ARGUMENTS is provided: use it as the quest folder path or name.
- If it does not start with `.ai-context/quests/`, resolve to `.ai-context/quests/{argument}`.

If $ARGUMENTS is empty:
- Scan `.ai-context/quests/` for subdirectories containing `STRATEGY_SCROLL.md`.
- List them as numbered options with realm (read from YAML frontmatter).
- Ask the commander to pick one.

Example listing:
```
Available quests:
  1. scan-alignment-floor-annotation  (realm: WeScanX)
  2. onboarding-redesign               (realm: WeScanX)
  3. backend-auth-refactor             (realm: CoreAPI)
```

If no quests are found: "No quests found. Run /new-quest to create one." Stop.

## Step 2: Validate the target quest

Check that the quest folder exists on disk and contains `STRATEGY_SCROLL.md`.

If not found: "Quest not found at {path}. Run /new-quest to create it." Stop.

## Step 3: Set the default pointer

Rewrite `.claude/active-quest.txt`:
```
{quest-folder-path}
{realm}
```

Read realm from the YAML frontmatter of `STRATEGY_SCROLL.md` if not already known.

This pointer is the single-chat DEFAULT. In multi-chat use it is shared, so this
write intentionally changes what a bare command in another chat would resolve to;
other chats stay safe by carrying their own quest and passing `--quest`
(SKILL.md -> "Active-quest selection").

## Step 4: Read scroll state

Read these from the quest folder (YAML frontmatter + key sections only):

- `STRATEGY_SCROLL.md` — battle status table, open riddles, last-updated, whether The Battle Plan section is populated
- `ADVENTURE_JOURNAL.md` — count any `## Expedition` entries (proxy for "has work started?")
- `TOME_OF_DANGERS.md` — count known dangers

Check for project-level files:
- `.ai-context/DANGER_REGISTRY.md` — note if it exists

## Step 5: Build briefing

Output:
```
⚔️  Quest activated: {quest-name}
Realm: {realm}

Battle Status:
{battle status table from STRATEGY_SCROLL}

Scrolls last updated:
  STRATEGY_SCROLL  {last-updated}
  ADVENTURE_JOURNAL  {last-updated}
  TOME_OF_DANGERS  {last-updated} ({N} known dangers)
```

## Step 6: Guide to next step

Based on scroll state, output one of the following guidance blocks:

**State A — No battle plan yet** (The Battle Plan section is empty or "(not yet defined)"):
```
📋  This quest has no battle plan yet.

Run /counsel-quest to plan before embarking.
  → Explores the codebase, clarifies requirements, designs architecture, locks the plan.
```

**State B — Battle plan exists, no expeditions started** (ADVENTURE_JOURNAL has no `## Expedition` entries):
```
📋  Battle plan is ready. No expeditions started yet.

Options:
  /embark         — start the first expedition now
  /counsel-quest  — refine the plan first (explore codebase, adjust architecture)
```

**State C — Expeditions exist with open riddles** (ADVENTURE_JOURNAL has entries AND STRATEGY_SCROLL has open riddles):
```
📋  Active quest — {N} open riddle(s) need resolution.

Open riddles:
{list from STRATEGY_SCROLL}

Options:
  /counsel-quest  — resolve riddles and adjust plan (recommended)
  /embark         — start next expedition (riddles unresolved)
  /quest-log      — full status overview
```

**State D — Expeditions exist, no open riddles**:
```
📋  Active quest — {N} expedition(s) logged, no open riddles.

Options:
  /embark    — start next expedition
  /quest-log — full status overview
```
