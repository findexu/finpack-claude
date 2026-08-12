---
description: Mark the active quest as complete. Distills key knowledge into project-level files, archives the quest folder, and clears the active quest.
argument-hint: "[--quest <name>] [--realm <realm>]"
---

# Complete Quest

A quest is complete when all modules in the battle status are Conquered
and the commander confirms there is no remaining work.

## Step 1: Resolve the active quest

Resolve the quest for THIS chat (SKILL.md -> "Active-quest selection"): a `--quest
<name-or-path>` argument wins (realm from that quest's `STRATEGY_SCROLL.md` frontmatter
unless `--realm <realm>` was also passed); otherwise read `.claude/active-quest.txt`
(line 1 = quest folder path, line 2 = realm).
If neither resolves: "No active quest to complete. Pass --quest." Stop.

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

Steps 3–6 read this quest's scrolls and then ARCHIVE (move) the folder. ACQUIRE the
per-quest lock (SKILL.md -> "Concurrency" -> cross-tool-call quest lock), keyed by
this quest's BASENAME, so a concurrent chat's in-flight write cannot race the archive.

If the lock cannot be acquired within the budget, report "quest {quest-name} busy —
another chat is writing to it; retry shortly" and STOP.

LOCK ORDER: this per-quest lock is the OUTER lock; the registry locks in Steps 3–4
are acquired and released INSIDE their single-bash invocations — always nested within
it, never around it, so no lock-ordering cycle exists. RELEASE this lock in Step 6.5
on every exit path.

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
- If it does not exist yet, create it from SKILL.md -> "DANGER_REGISTRY.md template"
  (fill `{date}`).
- Add each danger to the appropriate category section.
- Set the `Quest` column to the quest name.
- Update `last-updated` in YAML frontmatter.

Do not duplicate entries already in the registry.

## Step 4: Distill STRATEGY_SCROLL → DECISIONS_LOG.md

Read `{quest-folder}/STRATEGY_SCROLL.md` (and all `strategy/` subfiles if split).

Extract every entry from `## Oaths Sworn (Resolved Decisions)`.
Skip entries that are implementation details rather than architectural decisions.

Append to `.ai-context/DECISIONS_LOG.md`:
- If it does not exist yet, create it from SKILL.md -> "DECISIONS_LOG.md template"
  (fill `{date}`).
- Add each decision as a row: Decision | Reason | Quest | Date.
- Update `last-updated` in YAML frontmatter.

Do not duplicate decisions already in the log. Hold the same advisory lock as
Step 3 for this read-append-write (SKILL.md -> "Concurrency").

## Step 4.5: Maintain Obsidian graph links (if opted in)

If `.ai-context/.obsidian-enabled` exists, ensure the two project registries link to each
other: `DECISIONS_LOG.md` carries `related: ["[[DANGER_REGISTRY]]"]` and `DANGER_REGISTRY.md`
carries `related: ["[[DECISIONS_LOG]]"]` (quoted wikilinks in frontmatter). Add the key only
if missing (idempotent). The archived quest's own scrolls keep the `related:` links make-camp
already wrote. If the marker is absent, do nothing. Hold the same advisory lock as Steps 3–4.

## Step 4.8: Reconcile todos and the expedition checklist

The quest is confirmed complete: if STRATEGY_SCROLL's `## Planned Expeditions`
checklist still carries `- [>]` or `- [ ]` items, flip them to `- [x]` (confirm
with the commander first if any look genuinely unfinished — that suggests a
skipped /make-camp). Then mark every remaining todo for this quest completed via
TodoWrite so the session list matches the sealed scroll. Scroll edit only — never
lifecycle.log; runs under the same lock as Steps 3–6.

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
7–9 (clear pointer, clear context.md, confirm) run after release.

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

## Step 9: Confirm

```
🏆 Quest complete: {quest-name}
Dangers distilled: {count} → .ai-context/DANGER_REGISTRY.md
Decisions distilled: {count} → .ai-context/DECISIONS_LOG.md
Archived: .ai-context/archived/{quest-name}/
```

Close with:
```
Run /new-quest to begin the next quest.
```
