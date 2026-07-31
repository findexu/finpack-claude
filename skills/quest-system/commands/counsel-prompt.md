---
description: Triage a messy prompt into a pre-cleaned, routed command. Sorts the raw brief into an intake card (goal, answer-now questions, open decisions, constraints, pain history, non-goals), flags dangling references, recommends the right command to run it with, and outputs a single copyable block. Loads quest context so the rewrite includes relevant project details.
argument-hint: "[rough prompt text] [--quest <name>] [--no-route]"
---

# Counsel Prompt

Turn a messy brief into a pre-cleaned, routed prompt. Real briefs arrive as a
mix of vision, questions, doubts, history, and constraints — not orderly steps.
Untangling them is this command's job, never the commander's. The rewrite
preserves the commander's facts and voice; it adds structure only where
structure is signal.

## Step 1: Read quest context (optional)

Resolve the quest for THIS chat (see SKILL.md -> "Active-quest selection"), context only:
1. If a `--quest <name-or-path>` argument was given, use that quest.
2. Otherwise use `.claude/active-quest.txt` if it exists.
3. Otherwise proceed WITHOUT quest context (this command is valid with no active quest — do not stop).

If a quest resolved, load:
- `{quest-folder}/context.md` if it exists (fast path — pre-synthesized snapshot)
- Otherwise: read STRATEGY_SCROLL.md for battle status and open riddles,
  ADVENTURERS_HANDBOOK.md for tech stack

## Step 2: Take the rough prompt

First strip any `--quest <token>` / `--realm <token>` / bare `--no-route` flags
from `$ARGUMENTS` (quest flags already consumed in Step 1). Read what remains as
the rough prompt.

If empty, ask: "What do you want to ask Claude? Paste your rough prompt."

## Step 3: Triage into an intake card

Sort every sentence of the rough prompt into these buckets. A sentence can land
in two buckets; none may be dropped silently.

- **End state** — the actual goal, in the commander's words.
- **Answer-now questions** — factual, answerable by reading code ("is X already
  applied to Y?"). These belong at the TOP of the rewrite: their answers may
  reshape everything after them.
- **Open decisions** — anything the commander marks unsure ("I'm not sure if we
  need Z"). Preserve the doubt verbatim as an explicit "Open decision, do not
  assume:" line — a rewrite that resolves the commander's doubt by assumption
  has failed.
- **Hard constraints** — regressions, testability, thread safety, style. Carry
  these through near-verbatim; do not soften or summarize them away.
- **History / pain** — past failures mentioned ("we split before and lost the
  connections"). Keep them: they are targeting data for whoever executes.
- **Non-goals** — what the commander refuses ("no quick fixes"), with the WHY
  if given.
- **Targets** — the apps/modules/artifacts in scope, as an explicit list.
- **Rule conflicts** — if the brief's interest may collide with CLAUDE.md or
  project rules, add a line telling the executing agent to surface the conflict
  to the commander instead of silently obeying or overriding.

If quest context is loaded, pull in ONLY details that sharpen a bucket (known
dangers matching the pain history, concrete paths, battle status) — no bloat.

## Step 4: Gap check

Hunt for what the rewrite cannot fix because it is not there:

- **Dangling references** — "the first screenshot", "that file we discussed",
  "like before". Resolve from quest context or the codebase when possible
  (e.g. replace "the earlier iPhone work" with its actual scroll path). What
  cannot be resolved becomes an "Attach before sending" item in the output.
- **Vague paths** — replace "the annotation stuff" with concrete
  paths/module names when the codebase or quest context answers it cheaply.
- **Missing exit conditions** — if Step 5 routes to `/set-bounty`, the prompt
  needs success criteria and a budget ceiling. Draft the success line from the
  brief; leave budget as a visible `<N>` placeholder if the commander gave none.

Ask the commander AT MOST one batched question, and only for gaps the rewrite
genuinely cannot proceed without. Everything else is flagged in the output, not
asked about.

## Step 5: Route (skip if `--no-route`)

Recommend the command the cleaned prompt should be given to, and prefix the
rewritten prompt with it:

- Pure bug hunting -> `/hunt-bugs`. Pure decision/dilemma -> `/ask-sages`.
- Small and concrete (1-2 files, one clear change) -> no command; a plain
  prompt (or `/embark` if quest-tracked) is cheapest.
- Big with a sequential spine (steps build on each other, contracts/decisions
  come first) -> `/set-bounty`.
- 3+ INDEPENDENT write-streams ready to run simultaneously -> `/orchestrate`,
  ONLY if the project provides that skill; otherwise `/set-bounty`.
- Mixed briefs default to the command that owns the spine (usually
  `/set-bounty`) — it can dispatch the parallel slices itself.

One sentence of routing rationale goes in the output. The commander may
disagree; the route is a recommendation, not a gate.

## Step 6: Rewrite

Produce a single prompt from the intake card:

- Answer-now questions first, then end state, then the structured body
  (targets, open decisions, constraints, non-goals), then exit conditions.
- Keep the commander's voice and vocabulary; this is their prompt, cleaned —
  not a formal spec.
- Every "Open decision, do not assume" and every hard constraint from Step 3
  appears explicitly. Nothing the commander wrote is silently dropped.
- Direct — no filler, no pleasantries.

## Step 7: Output

Present as:

---
**Pre-cleaned prompt** — copy the block below{, attach the listed items,} and
run it in a fresh session:

```
{/recommended-command} {rewritten prompt}
```

**Route:** {command} — {one-sentence rationale}
**Attach before sending:** {list, or omit the line entirely if nothing}
**Fill in:** {placeholders like <N>, or omit the line}
**What changed:** {1-2 sentences: what was reordered, resolved, or flagged}

---
