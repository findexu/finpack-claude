---
description: Hunt real bugs in the codebase. Fans out cheap parallel scout agents across distinct lenses, adversarially verifies every candidate with a separate reviewer, then ranks survivors by severity with a concrete fix plan. Read-only by default; applying fixes is gated.
argument-hint: "[path ...] [--diff] [--all] [--fix] [--quest <name>] [--realm <realm>]"
---

# Hunt Bugs

Find bugs that are actually real. The trap with a single reviewer pass is
plausible-but-wrong findings and a flood of low-signal nits. This command splits
the work into a cheap wide SCOUT pass and an expensive skeptical VERIFY pass, so
only findings that survive an adversarial second opinion reach you.

This follows the loop architecture doctrine (SKILL.md -> "Loop architecture
doctrine"): a strong orchestrator (this command, in the main session) drives cheap
Haiku scouts and Sonnet confirmers. The agents are LEAVES — they cannot spawn — so
every fan-out, dedup, and gate lives here in the command, never inside an agent.

## Step 1: Resolve scope

Parse `[path ...] [--diff] [--all]` from the arguments:
- One or more explicit `path` args → hunt only those files/dirs.
- `--diff` (DEFAULT when no path and no `--all`) → the changed set:
  `git diff --name-only $(git merge-base HEAD main)...HEAD` plus
  `git diff --name-only` (unstaged/staged working changes). If the repo's default
  branch is not `main`, substitute it. If not a git repo, fall back to `--all`.
- `--all` → the whole codebase (respecting `.gitignore`). Warn that this is the
  expensive path and, if the tree is large (> ~200 source files), ask the commander
  to narrow scope or confirm before fanning out.

Collect the resolved file list as `{targets}`. If `{targets}` is empty:
"Nothing in scope to hunt. Pass a path or --all." Stop.

## Step 2: SCOUT — cheap parallel fan-out (Haiku)

Launch scouts with the `Agent` tool, `subagent_type: general-purpose`, `model: haiku`,
IN PARALLEL — one per lens. Cap at FIVE lenses (do not exceed; scale down for a small
`{targets}`):

1. **correctness** — off-by-one, null/undefined, inverted conditions, wrong operator, bad edge cases.
2. **security** — injection, path traversal, authz/IDOR, secrets, unsafe input handling.
3. **performance** — N+1, unbounded work, sync-blocking, leaks (listeners/timers/handles).
4. **concurrency** — races on shared state, read-then-write without atomicity, missing cleanup.
5. **error-handling** — swallowed errors, unhandled rejections, missing failure cases.

Each scout receives `{targets}` and its single lens, and returns CANDIDATES only —
a terse list, each: `file:line | category | one-line hypothesis`. Instruct scouts to
return the list, NOT file dumps or fixes (summaries, per the doctrine). A scout that
finds nothing returns an empty list.

## Step 3: Dedup candidates

In the main session, merge all scout lists and dedup by the key `file:line + category`
(same line flagged under two lenses = two candidates only if the category differs;
identical file:line+category = one). Keep the clearest hypothesis for each. If zero
candidates survive: report "No candidate bugs found across {N} lenses over {M} files."
and skip to Step 6 (nothing to verify).

## Step 4: VERIFY — adversarial confirmation (Sonnet)

For each deduped candidate, spawn its category confirmer with the `Agent` tool, IN
PARALLEL where possible (these fp-* agents are Sonnet via their own frontmatter — do
not override their model):
- correctness / concurrency / error-handling → `fp-code-reviewer`
- security → `fp-security-reviewer`
- performance → `fp-performance-reviewer`

Prompt each confirmer to REFUTE the specific candidate, not to re-hunt: "Here is a
suspected bug at {file:line}: {hypothesis}. Try to prove it is NOT a real bug. Read the
code and its callers. Default to REFUTED if you cannot demonstrate a concrete failure.
If it IS real, give the trigger input/state, the wrong outcome, and a severity
(Critical/High/Medium/Low)." A candidate is CONFIRMED only if the confirmer demonstrates
a concrete failure; otherwise drop it. This adversarial default is what removes the
plausible-but-wrong findings.

## Step 5: Rank + fix plan

Sort CONFIRMED findings by severity (Critical → High → Medium → Low). For each, present:
```
[{severity}] {file:line} — {what breaks}
  Trigger: {input/state that reproduces it}
  Fix: {concrete change} (reversible: Y/N)
```
End with a one-line "highest-severity fix to do first."

## Step 6: Optional — inscribe to the active quest

If confirmed findings exist AND an active quest resolves for THIS chat (see SKILL.md ->
"Active-quest selection": `--quest <name>` arg first, else `.claude/active-quest.txt`),
offer: "Inscribe {N} confirmed bug(s) into {quest-name}'s TOME_OF_DANGERS? (y/n)". On y,
append each to the quest's `TOME_OF_DANGERS.md` `## Known Dangers` table
(Danger | Impact | Remedy) and update its `last-updated` frontmatter. If no active quest
resolves, skip silently — this command does not require a quest.

## Step 7: Optional — apply fixes (gated)

Applying a fix mutates source and is the only non-reversible-ish action here (hunting is
read-only), so it is GATED — never auto-apply. Only when invoked with `--fix`, present the
go/no-go per the escalation contract (SKILL.md -> "Loop architecture doctrine"):
```
DECISION: apply the fix plan for {N} confirmed bug(s)?
RECOMMENDATION: {which subset, if any}
  per-bug: PRO / CON / reversible? Y/N
ASK: "Proceed (y / pick subset / abort)?"
```
On approval, apply the confirmed fixes with Edit, smallest-blast-radius first. Without
`--fix`, stop after Step 6 — reporting is the default.
