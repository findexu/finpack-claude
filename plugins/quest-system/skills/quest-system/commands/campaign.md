---
name: campaign
description: Orchestrate a whole problem to completion. You state a problem + goals; the orchestrator clarifies what is ambiguous, routes the work into quest-system, runs expeditions applying the development habits, records every decision, and loops until the goals are met.
argument-hint: "[problem + goals]"
disable-model-invocation: true
---

# Campaign

Orchestrate a whole problem end to end. You state a problem and its goals; I clarify what is
ambiguous or genuinely your call, route the work into quest-system, then drive the expedition
loop — applying the development habits and recording every decision — until the goals are met.

A campaign is the strategic layer ABOVE a quest: it owns the goal, decides new-vs-existing
quest, and runs the `embark` → `make-camp` loop to convergence. It is a THIN conductor over the
existing commands (`/new-quest`, `/counsel-quest`, `/embark`, `/make-camp`, `/complete-quest`)
plus a clarify-first intake — it never reimplements their logic.

## Step 0: Declare the loop's exit conditions

State the three termination conditions up front (loop doctrine, rule 7 — see SKILL.md →
"Loop architecture doctrine") and hold them for the whole campaign:
- **success** — every Acceptance Criterion met (machine-checkable where possible)
- **failure** — a blocker the commander cannot clear, or an expedition that makes no progress
- **budget** — a max number of expeditions or a token ceiling the commander sets

## Step 1: Intake the problem + goals

Capture `$ARGUMENTS` verbatim as the problem statement. If empty, ask once:
> "What problem are we solving, and what does done look like?"
Do not proceed without a concrete problem and at least one goal.

## Step 2: Clarify — the commander is the decision-maker

Scout the codebase first, then ask. Raise a question ONLY where a wrong guess would be
expensive to undo or the choice is genuinely the commander's: scope boundaries, success
criteria, priorities, hard constraints, irreversible calls. Never ask what you can determine
from the code yourself. One crisp question per real fork, in the escalation GATE FORMAT
(DECISION / RECOMMENDATION / options with pros-cons-reversibility / one ASK). Stop clarifying
once the problem is scoped enough to write Acceptance Criteria.

## Step 3: Route to a quest

Resolve the target quest per SKILL.md → "Active-quest selection", then decide:
- **No fitting quest** → run `/new-quest` to scaffold, then `/counsel-quest` (PRE mode) to plan.
- **A fitting quest exists** → `/start-quest` it; if the plan needs reshaping, `/counsel-quest`
  (MID mode, or `--pivot` for a direction change).

Inscribe the clarified problem into the STRATEGY_SCROLL "Quest Overview" and the goals into
"Acceptance Criteria" as observable outcomes — machine-checkable where possible (WS1 criterion
contract: `- {outcome} — Check: {command} surfaces "{expected}"`). Record each clarify-decision
as an oath in "Oaths Sworn".

## Step 4: Run the expedition loop

Repeat until an exit condition from Step 0 fires:
1. `/embark` — scope the next slice, name the **development habits** in scope (SKILL.md →
   "Development habits"), propose a plan, and gate for approval.
2. Do the work under the escalation contract: proceed autonomously on reversible steps; raise
   ONE crisp go/no-go on irreversible / high-blast-radius actions or a CONFIRMED high-severity
   finding. Apply the habits (test-first, regression-first, cover new code).
3. `/make-camp` — run the review habit, record results, dangers, and decisions; refresh context.
4. Re-check the Acceptance Criteria. All met → Step 5. Budget hit or hard blocker → Step 5 with
   that verdict. Otherwise loop.

Every iteration must move a criterion visibly forward, or surface why it can't and gate.

## Step 5: Converge

- **success** → propose `/complete-quest` (distills dangers + decisions, archives, awards XP).
  Gate before completing — completion is irreversible.
- **failure / budget** → `/make-camp` the current state, record the blocker as an Open Riddle
  and a danger, and hand back a crisp status: what is done, what is blocked, and the
  recommended next move.

## Rules

- You orchestrate; the quest-system commands do the bookkeeping. Never hand-edit a scroll that a
  command owns.
- Clarify BEFORE building; record decisions AS you go, never in conversation history alone
  (Sacred laws).
- Obey the escalation contract at every gate. A gate is a decision request, not a status update.
