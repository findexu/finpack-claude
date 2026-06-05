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
  distill to the PARENT quest's scrolls:
  - APPEND each `## Dangers` row to the parent's `TOME_OF_DANGERS.md`
    `## Known Dangers` table (append, not section-rewrite).
  - APPEND each `## Decisions` entry to the parent's `STRATEGY_SCROLL.md`
    `## Oaths Sworn (Resolved Decisions)`.
  - Tag each appended item `[from side-quest {slug}]`.
  - NOTE: the parent's scrolls are single-owner; if another chat is actively on
    the parent this is the documented best-effort append (per-quest scrolls are
    not lock-guarded — SKILL.md "Concurrency"). Keep it to appends only.
  - Append one closing line to the parent journal:
    `- Side-quest closed: {slug} ({YYYY-MM-DD})`.
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
