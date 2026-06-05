---
description: Capture a small thing found mid-quest (UI bug, font tweak, layout) as a lightweight side-quest. One scroll, no counsel. Does NOT switch your active quest — pick it up later in another chat.
argument-hint: "[description] [--quest <parent>] [--standalone] [--realm <realm>]"
---

# Side Quest

Capture a side-quest in one step. A side-quest is a small, usually-independent
thing you notice while working a main quest. This command records it and gets out
of your way — it does NOT change what you are working on.

## Step 1: Resolve parent + description

Strip flags from `$ARGUMENTS` first (`--quest <token>` / `--realm <token>` each
consume the next token; `--standalone` is a bare flag). Everything left is the
one-line `{description}`. If nothing remains, ask: "What is the side-quest?"

Determine the parent (see SKILL.md -> "Active-quest selection"):
1. If `--standalone` was passed, `parent = none`.
2. Else if `--quest <name-or-path>` was passed, that quest is the parent.
3. Else if `.claude/active-quest.txt` exists, its quest is the parent.
4. Else `parent = none`.

Realm: from the parent's `STRATEGY_SCROLL.md` frontmatter; if `parent = none`,
use `--realm` if given, else ask once (or leave blank).

## Step 2: Slug + uniqueness

Derive a kebab-case `{slug}` from the description (e.g. "badge label font too
small" -> `badge-label-font`). If `.ai-context/side-quests/{slug}/` OR
`.ai-context/side-quests/done/{slug}/` already exists, append `-2` (then `-3`, ...)
until unique — never overwrite an existing side-quest.

## Step 3: Create the NOTE

Create `.ai-context/side-quests/{slug}/NOTE.md`:
```
---
type: side-quest
slug: {slug}
parent: .ai-context/quests/{parent-name} | none
realm: {realm}
status: open
created: "{YYYY-MM-DD}"
---
# Side-Quest: {description}
## Findings
## Dangers     (distills to parent TOME_OF_DANGERS / project DANGER_REGISTRY on close)
## Decisions   (distills to parent STRATEGY_SCROLL / project DECISIONS_LOG on close)
```
Keep `created` quoted (unquoted ISO dates parse to a Date).

## Step 4: Breadcrumb in the parent journal

If `parent != none`, append ONE line to the parent's `ADVENTURE_JOURNAL.md`
(or `journal/{current-month}.md` if split) — append-only, never rewrite:
```
- Side-quest spun off: {slug} — {description} ({YYYY-MM-DD})
```
If `parent = none`, skip this step.

## Step 5: Confirm (no switch)

This command does NOT touch `.claude/active-quest.txt`. You stay on your current
quest.

```
🧭 Side-quest captured: {slug}
Parent: {parent-name or "standalone"}  |  Realm: {realm}
You are still on your current quest — nothing switched.

Pick it up later in another chat:
  /start-quest {slug}     (separate chat / worktree)
  or pass --quest {slug} to commands in that chat
Close it with /close-side-quest {slug} (or --promote to grow it into a full quest).
```
