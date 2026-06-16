---
description: Mark the active quest as complete. Distills key knowledge into project-level files, archives the quest folder, and clears the active quest.
argument-hint: "[--quest <name>] [--realm <realm>]"
---

# Complete Quest

A quest is complete when all modules in the battle status are Conquered
and the commander confirms there is no remaining work.

## Step 1: Resolve the active quest

Resolve the quest for THIS chat (see SKILL.md -> "Active-quest selection"):
1. If a `--quest <name-or-path>` argument was given, use it; read its realm from that
   quest's `STRATEGY_SCROLL.md` frontmatter unless `--realm <realm>` was also passed.
2. Otherwise read `.claude/active-quest.txt` (line 1 = quest folder path, line 2 = realm).
3. If neither resolves: "No active quest to complete. Pass --quest." Stop.

The shared pointer is UNTRUSTED in multi-chat — carry this chat's quest in-conversation
and pass it as `--quest`. `{quest-name}` is the basename of the resolved folder path.

Before ANY write in this command, echo the resolved `quest + realm` and confirm (or
require an explicit `--quest`) — backstop against completing a quest another chat just
repointed the pointer to (SKILL.md -> "Mutating commands confirm first").

## Step 2: Confirm completion

Read STRATEGY_SCROLL.md battle status table.
Show it to the commander.

Ask: "Are all modules conquered and this quest truly complete? (y/n)"
Stop if n — run /make-camp to record remaining work first.

## Step 2.5: Quality gate (optional)

Ask: "Run the quality gate before sealing this quest? (y/n)"
If n, skip to Step 3.

If y, determine the quest's changed files (prefer `git diff --name-only` against
the quest's base branch/commit; else the files the quest touched). Launch in
parallel, scoped to those files:
- `fp-code-reviewer` — correctness bugs and logic errors.
- `fp-security-reviewer` — vulnerabilities (skip if no auth/input/network/secret/fs changes).
- `fp-doc-reviewer` — docs/scrolls vs the actual source: drift, missing params, dead references.

Summarize CONFIRMED findings (ignore style nitpicks). Then ask:
- "Address these before completing, or log them and proceed?"
- If addressing: stop here — completion resumes after fixes (re-run /complete-quest).
- If proceeding: inscribe any unresolved real issues into TOME_OF_DANGERS so they
  carry into DANGER_REGISTRY during Step 3 distillation.

## Step 2.9: Acquire the per-quest scroll lock

Steps 3–6 read this quest's scrolls and then ARCHIVE (move) the folder. A
`/close-side-quest` running in another chat may be distilling a child side-quest
INTO this same quest's scrolls at that moment. ACQUIRE the per-quest lock (SKILL.md
-> "Concurrency" -> cross-tool-call quest lock), keyed by this quest's BASENAME, so
the archive cannot move the folder out from under an in-flight child distill (the
child re-checks parent existence after IT acquires the lock, so once you hold it the
child will see the archived parent and safely fall back to the orphan path).

If the lock cannot be acquired within the budget, report "quest {quest-name} busy —
a side-quest is distilling into it; retry shortly" and STOP.

LOCK ORDER (avoids deadlock): this per-quest lock is the OUTER lock. The registry
locks in Steps 3–4 (`DANGER_REGISTRY.md` / `DECISIONS_LOG.md`) are acquired and
released INSIDE their single-bash invocations — always after this one, never around
it. A command holds at most one per-quest lock; the registry lock only ever nests
within it, so no lock-ordering cycle exists. RELEASE this lock in Step 6.5 on every
exit path.

## Step 3: Distill TOME_OF_DANGERS → DANGER_REGISTRY.md

CONCURRENCY: the project registries are shared across chats. Perform the
read-append-write of `DANGER_REGISTRY.md` (this step) and `DECISIONS_LOG.md`
(Step 4) under the advisory lock (SKILL.md -> "Concurrency") — a single bash
invocation that `mkdir`-locks, RE-READS the current file, appends the new rows,
and releases on every exit path. The re-read inside the lock is what prevents a
concurrent completion from dropping rows.

Read `{quest-folder}/TOME_OF_DANGERS.md` (and all `dangers/` subfiles if split).

Extract every entry from `## Known Dangers` and `## Confirmed Safe Paths`.
Skip entries marked as superseded or resolved.

Append to `.ai-context/DANGER_REGISTRY.md`:
- If it does not exist yet, create it with this template:
  ```
  ---
  type: danger-registry
  last-updated: {date}
  ---
  # Project Danger Registry

  Distilled from completed quests. Read before proposing any strategy.
  Each entry survived at least one real quest — do not ignore.

  ## Rendering Dangers
  | Danger | Impact | Remedy | Quest |
  |---|---|---|---|

  ## Memory Dangers
  | Danger | Impact | Remedy | Quest |
  |---|---|---|---|

  ## Concurrency Dangers
  | Danger | Impact | Remedy | Quest |
  |---|---|---|---|

  ## Architecture Dangers
  | Danger | Impact | Remedy | Quest |
  |---|---|---|---|
  ```
- Add each danger to the appropriate category section.
- Set the `Quest` column to the quest name.
- Update `last-updated` in YAML frontmatter.

Do not duplicate entries already in the registry.

## Step 4: Distill STRATEGY_SCROLL → DECISIONS_LOG.md

Read `{quest-folder}/STRATEGY_SCROLL.md` (and all `strategy/` subfiles if split).

Extract every entry from `## Oaths Sworn (Resolved Decisions)`.
Skip entries that are implementation details rather than architectural decisions.

Append to `.ai-context/DECISIONS_LOG.md`:
- If it does not exist yet, create it with this template:
  ```
  ---
  type: decisions-log
  last-updated: {date}
  ---
  # Project Decisions Log

  Architectural decisions locked during completed quests.
  These are oaths — do not re-open without the commander's explicit order.

  | Decision | Reason | Quest | Date |
  |---|---|---|---|
  ```
- Add each decision as a row: Decision | Reason | Quest | Date.
- Update `last-updated` in YAML frontmatter.

Do not duplicate decisions already in the log. Hold the same advisory lock as
Step 3 for this read-append-write (SKILL.md -> "Concurrency").

## Step 5: Write final journal entry

Append to `{quest-folder}/ADVENTURE_JOURNAL.md`
(or `journal/{current-month}.md` if split):

```
## Quest Complete — {YYYY-MM-DD}
### Summary
{2–4 sentence summary of what was built and how it ended}
### Key Dangers Distilled
{count} dangers added to DANGER_REGISTRY.md
### Key Decisions Distilled
{count} decisions added to DECISIONS_LOG.md
### Realm
{realm}
```

## Step 6: Archive quest folder

Move `{quest-folder}/` → `.ai-context/archived/{quest-name}/`

Create `.ai-context/archived/` if it does not exist.

If an archive with the same name already exists, rename to `{quest-name}-{date}`.

## Step 6.5: Release the per-quest scroll lock

RELEASE the per-quest lock acquired in Step 2.9 (explicit `rmdir`, key recomputed
from the ORIGINAL quest basename — never from the moved/archived path). Runs on
every exit path: if any step 3–6 operation failed, release here and STOP. Steps
7–10 (clear pointer, clear context.md, XP, confirm) run after release.

## Step 7: Clear active quest

Clear the default pointer ONLY if it points at the quest just completed: if
`.claude/active-quest.txt` line 1 resolves to this quest folder, delete it;
otherwise leave it untouched (another chat may be using it as its default).

## Step 8: Clear context.md

If `{quest-folder}/context.md` exists, overwrite with:
```
# Quest Context
(no active quest — run /new-quest to start one)
```

## Step 9: Calculate and award quest EXP

If `.claude/quest-xp/profile.md` does not exist, skip to Step 10.

**Count quest data** (the quest folder was moved in Step 6 — read these from the archived scrolls at `.ai-context/archived/{quest-name}/`):
- `modules`: number of rows in STRATEGY_SCROLL battle status table
- `expeditions`: number of `## Expedition` entries in ADVENTURE_JOURNAL
- `dangers`: number of rows in TOME_OF_DANGERS Known Dangers table (plus all subfiles if split)
- `oaths`: number of entries in STRATEGY_SCROLL Oaths Sworn section
- `splits`: number of split subfolders present (dangers/, strategy/, journal/, map/)
- `open_riddles`: number of entries in STRATEGY_SCROLL Open Riddles section
- `clean_sweep`: true if `open_riddles` == 0
- `speed_run`: true if `expeditions` <= 3

**Award via the event log** — XP is append-only; do NOT read-modify-write the
counters. See SKILL.md -> "XP derivation (the fold)".

1. **Seed if needed (idempotent):** if `.claude/quest-xp/events.log` is ABSENT,
   append ONE `seed` line with the full current profile (all 6 counters +
   `badges`, verbatim). The log-absent check is the guard — never seed twice.
2. **Append the quest-complete event** with a SHELL APPEND (never Edit/Write):
   ```bash
   printf '%s\n' "{YYYY-MM-DD}|quest-complete|{quest-name}|modules={M};expeditions={E};dangers={D};oaths={O};splits={S};clean={0|1};speed={0|1}" >> .claude/quest-xp/events.log
   ```
   `clean`=1 if `clean_sweep`, `speed`=1 if `speed_run`. The reward
   (`100 + modules*25 + expeditions*10 + dangers*15 + oaths*20 + splits*50
   + (clean?75) + (speed?50)`) and the badge unlocks (incl. Speed Runner / Clean
   Sweep from this event's flags) are computed by the fold, not here.
3. **Recompute the cache:** fold the WHOLE `events.log` (SKILL.md derivation) and
   rewrite `profile.md` — all 7 numeric keys + `adventurer` + `badges`
   (UNION of seed + derived; never dropped) + `derived-from-events`. Record old vs
   new `level` for Step 10.

Let `exp` (for the history entry below) = the quest-complete reward computed in
step 2's formula.

**Append at the END of `.claude/quest-xp/quest-history.md`** (entries are chronological;
the dashboard's per-quest chart plots them in file order, so a new entry MUST go after
the last existing one — never after the header). Read the WHOLE file first; never assume
it is empty from its head alone:
```
## {quest-name} — {date}
EXP earned: {exp}
  Base reward:   100
  Modules:       {modules} × 25 = {modules×25}
  Expeditions:   {expeditions} × 10 = {expeditions×10}
  Dangers:       {dangers} × 15 = {dangers×15}
  Oaths:         {oaths} × 20 = {oaths×20}
  Splits:        {splits} × 50 = {splits×50}
  {if clean_sweep: "Clean sweep bonus: +75"}
  {if speed_run:   "Speed run bonus: +50"}
Total EXP after: {total-exp}  |  Level: {new level}
```

## Step 10: Confirm

```
🏆 Quest complete: {quest-name}
Dangers distilled: {count} → .ai-context/DANGER_REGISTRY.md
Decisions distilled: {count} → .ai-context/DECISIONS_LOG.md
Archived: .ai-context/archived/{quest-name}/
```

If XP was awarded, add:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+{exp} XP  (modules: {modules×25}  expeditions: {expeditions×10}
            dangers: {dangers×15}  oaths: {oaths×20}  splits: {splits×50}
            {bonuses if any})
Total EXP: {total-exp}  |  Level {new-level} — {title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If level-up occurred, display BEFORE the EXP breakdown:
```
╔══════════════════════════════════════════════╗
║  🌟  LEVEL UP!                                ║
║  Level {old} → Level {new}                    ║
║  {new title}                                  ║
╚══════════════════════════════════════════════╝
```

If any new badges unlocked, display AFTER the EXP breakdown:
```
🎖️  Badge unlocked: {badge emoji}  {badge name}
    {unlock condition description}
```
(one line per badge, in order unlocked)

Close with:
```
Run /new-quest to begin the next quest.
Run /quest-xp to view your full profile.
```
