---
description: Review a plan.md file against active quest context. Flags gaps, risks, and unclear steps. Output is a single copyable feedback block to paste back into the planning session.
argument-hint: "[path/to/plan.md] [--quest <name>] [optional: your opinion or concern]"
---

# Counsel Plan

Review a plan file and produce structured feedback ready to paste into the planning session.

## Step 1: Read quest context (optional)

Resolve the quest for THIS chat (see SKILL.md -> "Active-quest selection"), context only:
1. If a `--quest <name-or-path>` argument was given, use that quest.
2. Otherwise use `.claude/active-quest.txt` if it exists.
3. Otherwise proceed WITHOUT quest context (this command is valid with no active quest — do not stop).

If a quest resolved, load:
- `{quest-folder}/context.md` if it exists (battle status, open riddles, road ahead, dangers, decisions)
- `.ai-context/DANGER_REGISTRY.md` if it exists (cross-quest dangers to watch for)
- `.ai-context/DECISIONS_LOG.md` if it exists (locked decisions the plan must honor)

## Step 2: Parse arguments

First strip any `--quest <token>` / `--realm <token>` flags from `$ARGUMENTS`
(already consumed in Step 1). From what remains:
- First token = `{plan-path}` (the file to review)
- Remaining text = `{your-opinion}` (optional — your concern, doubt, or perspective on the plan)

If nothing remains, ask for the plan path.

## Step 3: Read the plan file

Read the file at `{plan-path}`.

If `{plan-path}` is empty, look for these locations in order:
1. `.claude/plans/` — list any `.md` files found and ask which to review
2. `PLAN.md` in project root
3. Ask: "Path to the plan file?"

If file not found: "Plan file not found at {plan-path}." Stop.

## Step 4: Delegate the review to fp-plan-reviewer

Spawn the `fp-plan-reviewer` agent. It owns the review rubric and verdict logic
(single source — this command does not restate the criteria). Pass it:

- The full plan text read in Step 3.
- Any quest context loaded in Step 1 (DECISIONS_LOG entries, DANGER_REGISTRY
  entries, battle status) — so it can flag conflicts with locked decisions or
  known dangers.
- The `{your-opinion}` lens if present — instruct it to address the concern
  directly.

The agent runs in its own context, so the review is independent of whoever
authored the plan.

If the `fp-plan-reviewer` agent is not available (not installed), say so:
"Plan reviewer not available — run /install-quest-system or /update-quest-system
to enable counsel." Then stop.

## Step 5: Output

Relay the agent's feedback block verbatim, framed for pasting:

---
**Plan feedback** — copy the block below and paste it into your planning session:

{the agent's returned block, which ends with a `### Verdict` line of the form
`READY | REVISE (blocking: N, minor: M)`}

---

If the verdict is `REVISE`, remind the commander they can revise the plan and
re-run `/counsel-plan` to re-check — or run `/embark --counsel N` to iterate
automatically up to N rounds.
