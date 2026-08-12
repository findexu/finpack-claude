---
name: set-bounty
description: Set a bounty on a goal and let an autonomous party deliver it. You state the problem + goals and answer the few real judgment forks; the party then explores, plans, builds, self-tests, reviews (code + security), and presents a near-done solution for your sign-off — recording every decision to the quest scrolls.
argument-hint: "[problem + goals]"
disable-model-invocation: true
---

# Set Bounty

You are the quest-giver. You post a bounty — a problem and what "done" looks like — and an
autonomous party takes the contract and works on your behalf: explore → analyze → plan →
refine → build → self-test → review → present. You are no longer the adventurer doing every
step; you set the terms, answer the few genuine judgment calls, and sign off at the end.

This is the AUTONOMOUS counterpart to the manual loop (`/counsel-quest` → `/embark` →
`/make-camp`). It drives those same commands under the hood but does not stop at every step —
it proceeds on its own authority for reversible work and returns to you only at real forks.
It is a conductor over the existing commands, never a reimplementation of them.

## Step 0: Set the contract terms (exit conditions)

State up front (loop doctrine rule 7 — see SKILL.md → "Loop architecture doctrine"):
- **success** — every Acceptance Criterion met, machine-checkable where possible
- **failure** — a blocker the party cannot clear without you
- **budget** — a ceiling you set (max expeditions / token budget); hitting it forces a report

## Step 1: Post the bounty (intake)

Capture `$ARGUMENTS` verbatim as the problem + goals. If empty, ask once:
> "What's the bounty — what problem, and what does done look like?"
Do not proceed without a concrete problem and at least one goal.

## Step 2: Negotiate terms (clarify — the ONLY place you interrupt the commander early)

Scout the codebase first, then ask. Raise a question ONLY where a wrong guess is expensive to
undo or the choice is genuinely the commander's: scope, success criteria, priorities, hard
constraints, irreversible calls. Never ask what the code can answer. Batch the real forks into
as few crisp questions as possible (escalation GATE FORMAT). Once the terms are clear, the
party works on its own until Step 7 — do not narrate every step or ask permission for
reversible work.

## Step 3: Take the contract (route to a quest)

Resolve the target quest per SKILL.md → "Active-quest selection":
- **No fitting quest** → `/new-quest` to scaffold, then drive `/counsel-quest` (PRE) to plan.
- **A fitting quest exists** → `/start-quest`; reshape via `/counsel-quest` (MID / `--pivot`) if needed.

Inscribe the problem into the STRATEGY_SCROLL "Quest Overview" and the goals into "Acceptance
Criteria" as machine-checkable outcomes (WS1 contract:
`- {outcome} — Check: {command} surfaces "{expected}"`). Every clarify answer becomes an oath.

## Step 4: Work the bounty autonomously (the party's loop)

Drive the expedition loop WITHOUT step-by-step approval — proceed on the escalation contract:
autonomous on reversible steps, one crisp go/no-go only on irreversible / high-blast-radius
actions or a CONFIRMED high-severity finding. For each expedition (`/embark` → work →
`/make-camp`), run the party's pipeline against the current slice:

1. **Explore** — map the affected code (`fp-code-explorer`).
2. **Analyze & plan** — turn findings into a blueprint (`fp-code-architect`).
3. **Refine the plan** — pressure-test it (`fp-plan-reviewer`, or `/counsel-plan --critique`)
   and revise until READY.
4. **Build** — implement, applying the development habits (test-first, regression-first,
   cover new code — SKILL.md → "Development habits").
5. **Self-test** — run the tests / drive the change; a red suite is a failure condition, not a
   thing to report and move past.
6. **Review** — `fp-code-reviewer` for correctness, `fp-security-reviewer` if auth/input/
   network/secret/fs changed, `fp-performance-reviewer` on hot paths. CONFIRMED findings are
   fixed or inscribed as dangers.
7. `/make-camp` — record results, dangers, and decisions; refresh context.

**Judge first (behaviour-preserving bounties):** when the bounty refactors, migrates, or
extracts, the FIRST slice builds the referee — characterization tests capturing current
behaviour (oddities recorded as findings, not fixed) plus one run-all script that becomes
every later slice's exit gate. Validate it by deliberate breakage: break behaviour, confirm
the suite goes red, revert; uncaught breakage is a coverage gap to close before continuing.
A later change that requires editing the referee is a gate for the commander, never a fix.

**Rule-not-patch:** a review finding repeated across slices is a defect in the plan's rules,
not in the slices — amend the rule once, regenerate the affected work, inscribe the rule as
a decision. And when 3+ upcoming slices will follow the same translation rules, stress-test
the rules first: migrate ONE unit twice in separate worktrees (strictly-by-rules vs
freestyle), have a third agent diff them and propose the missing rules, then DISCARD both
implementations — the deliverable is better rules, not progress.

**Parallel dispatch (optional):** if the project provides an `/orchestrate` skill AND the
current slice decomposes into 3+ independent write-streams (separate modules/libraries, many
independent call sites), dispatch steps 4-6 for that slice to `/orchestrate` — parallel
builders in isolated worktrees, per-package fresh-context review, sequential test-gated
merge. Its plan gate still counts as a real gate. When steps build on each other, stay with
the sequential pipeline above: it is the default and far cheaper (~4x tokens vs ~15x).

Loop until an exit condition from Step 0 fires. Every iteration must move a criterion forward
or surface — as a gate — why it can't.

## Step 5: Deliver for sign-off

- **success** → present a near-done summary: what was built, how it was validated, the review
  verdict, and any residual risk. Then propose `/complete-quest` (distill + archive) —
  gate before completing, since completion is irreversible.
- **failure / budget** → `/make-camp` the state, record the blocker as an Open Riddle + danger,
  and hand back a crisp status: what's done, what's blocked, the recommended next move.

## Rules

- You post the bounty and sign off; the party does the work and the bookkeeping. Never
  hand-edit a scroll a command owns.
- Interrupt the commander only at Step 2 (terms) and at genuine gates — not for reversible work.
- Record decisions AS you go, never in conversation history alone (Sacred laws). Obey the
  escalation contract at every gate: a gate is a decision request, not a status update.
