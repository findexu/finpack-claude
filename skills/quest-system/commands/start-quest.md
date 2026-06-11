---
description: Activate a quest and get guided to the right next step. Reads scroll state and suggests /counsel-quest, /embark, or /quest-log based on where the quest stands. Also picks up a side-quest by slug as a lightweight one-scroll context.
argument-hint: "[quest-name-or-path]"
---

# Start Quest

Activate a quest and get guided to the right next step.

## Step 1: Find the target quest

If $ARGUMENTS is provided: use it as the quest folder path or name.
- If it starts with `.ai-context/side-quests/`, this is a side-quest pickup — skip
  to "Side-quest pickup" below.
- If it does not start with `.ai-context/quests/`, resolve to `.ai-context/quests/{argument}`.
  A side-quest slug also works as a bare name — resolution falls through in Step 2.

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

If not found (folder missing or no `STRATEGY_SCROLL.md`): check for a side-quest
at `.ai-context/side-quests/{argument}/NOTE.md`.
- If it exists: this is a side-quest pickup — skip to "Side-quest pickup" below
  (Steps 3-6 do not apply).
- If neither exists: "Quest not found at {path}. Run /new-quest to create it." Stop.

If BOTH a quest and a side-quest match the name, the quest wins — continue with
Step 3 and mention the ambiguity: "Note: a side-quest with the same name exists.
Run /start-quest .ai-context/side-quests/{name} to pick that up instead."

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

## Side-quest pickup

A side-quest is a one-scroll context: a single `NOTE.md` at
`.ai-context/side-quests/{slug}/`. There are no five scrolls and no /embark
machinery — work happens directly against the NOTE.

Do NOT write `.claude/active-quest.txt`. Side-quests run alongside the active
quest; the pointer keeps pointing at the main quest.

1. Read `.ai-context/side-quests/{slug}/NOTE.md` (YAML frontmatter + all sections).
2. Output the briefing:

```
🧭  Side-quest picked up: {slug}
Parent: {parent or "standalone"}  |  Realm: {realm}  |  Status: {status}

{title line from the NOTE}

Findings so far:
{summary of ## Findings, or "(none recorded yet)"}

Proposed fix / decisions:
{summary of ## Decisions, or "(none recorded yet)"}
```

3. Guide to next step:

```
📋  Work directly against the NOTE — record findings, dangers, and decisions
in it as you go. Your active quest pointer is unchanged.

When done:
  /close-side-quest {slug}            — distill into the parent and archive
  /close-side-quest {slug} --promote  — grow it into a full 5-scroll quest
```
