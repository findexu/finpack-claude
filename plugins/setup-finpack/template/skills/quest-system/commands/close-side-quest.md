---
description: Close a side-quest, distilling its dangers/decisions up into its parent quest (or the project registries if standalone). Use --promote to grow it into a full 5-scroll quest instead.
argument-hint: "[slug] [--promote]"
---

# Close Side Quest

Finish a side-quest. By default its findings distill UP to its parent and the
folder is archived. `--promote` instead turns it into a full quest.

## Step 1: Resolve the target side-quest

Strip `--promote` from `$ARGUMENTS`; the remainder (if any) is the `{slug}`.
Resolve the target:
1. If a slug was given, use `.ai-context/side-quests/{slug}/`.
2. Else if `.claude/active-quest.txt` line 1 is a path under `.ai-context/side-quests/`, use it.
3. Else list every `.ai-context/side-quests/*/NOTE.md` with `status: open` and ask which to close.

If none found: "No open side-quest found. Pass a slug or run /side-quest first." Stop.

Read `NOTE.md` frontmatter: `parent`, `realm`, `status`.

## Step 2 (--promote): grow into a full quest

If `--promote` was passed:
1. Target `.ai-context/quests/{slug}/`. If it already exists, suffix `-{date}`
   (reuse the archive collision rule).
2. Scaffold the five scrolls using the `/new-quest` templates (quest = slug,
   realm = the NOTE's realm). Seed `STRATEGY_SCROLL.md`'s Quest Overview from the
   NOTE's title + Findings.
3. Set the NOTE `status: promoted`; move the side-quest folder into the new quest
   folder as `NOTE.md` (or copy its content into the Overview, then remove it).
4. Do NOT touch `.claude/active-quest.txt` — promotion does not switch your chat.
5. Report: "Promoted {slug} -> .ai-context/quests/{slug}/. Run /start-quest {slug} then /counsel-quest." Stop.

## Step 3 (default): distill up + archive

Determine the distill destination:
- If `parent != none` AND `.ai-context/quests/{parent-name}/` still exists ->
  distill to the PARENT quest's scrolls UNDER THE PER-QUEST LOCK (SKILL.md ->
  "Concurrency" -> cross-tool-call quest lock). A concurrent sibling close OR the
  parent's own `/make-camp` writes these same sections, so guard them:
  1. **ACQUIRE** the lock keyed by the PARENT basename (`{parent-name}` = basename
     of the NOTE `parent` path). If it cannot be acquired within the budget,
     report "parent {parent-name} busy — try again shortly", leave the side-quest
     `status: open`, and STOP. Do NOT half-distill.
  2. **RE-CHECK** that `.ai-context/quests/{parent-name}/` still exists (a
     `/complete-quest` may have archived it between Step 1 and now). If it
     vanished: RELEASE the lock and fall through to the project-registry path
     below (treat as orphan).
  3. **MUTATE** (split-aware — write to the subfile if the split subfolder exists,
     else the index section; append only, never section-rewrite):
     - APPEND each `## Dangers` row to the parent's `TOME_OF_DANGERS.md`
       `## Known Dangers` table (or the matching `dangers/` category subfile).
     - APPEND each `## Decisions` entry to the parent's `STRATEGY_SCROLL.md`
       `## Oaths Sworn (Resolved Decisions)` (or the relevant `strategy/` subfile).
     - Tag each appended item `[from side-quest {slug}]`.
     - APPEND one closing line to the parent journal (`ADVENTURE_JOURNAL.md`, or
       `journal/{current-month}.md` if split):
       `- Side-quest closed: {slug} ({YYYY-MM-DD})`.
  4. **RELEASE** the lock (explicit `rmdir`) on EVERY exit path. If any Edit in
     MUTATE fails, RELEASE immediately, leave the side-quest `status: open`, and
     STOP — never a stranded lock or a half-distill.
- Else (`parent = none`, OR the parent folder is missing/archived) -> distill to
  the PROJECT registries under the advisory lock (SKILL.md "Concurrency"):
  append `## Dangers` -> `.ai-context/DANGER_REGISTRY.md`, `## Decisions` ->
  `.ai-context/DECISIONS_LOG.md`, each in a single mkdir-locked bash invocation
  (acquire -> re-read -> append -> release).

Then:
- Set the NOTE `status: done`.
- Move the folder to `.ai-context/side-quests/done/{slug}/` (suffix `-{date}` on
  collision).
- No XP is awarded for side-quests in v1.

## Step 4: Confirm

```
✅ Side-quest closed: {slug}
Distilled to: {parent-name quest scrolls | project registries (orphan/standalone)}
Dangers: {N}   Decisions: {M}
Archived: .ai-context/side-quests/done/{slug}/
```
