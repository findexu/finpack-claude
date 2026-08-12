---
description: >
  Plan, replan, or pivot the active quest. Three modes: PRE-expedition (full feature-dev
  flow with codebase exploration + architecture design), MID-expedition (resolve blockers
  and adjust plan), PIVOT (record fallen strategy and re-plan from scratch).
  Use --pivot flag for a full direction change mid-expedition.
argument-hint: "[--quest <name>] [--realm <realm>] [--pivot] [--expedition-focus <name>] [--critique]"
---

# Counsel Quest

Plan before you leap. "Discuss and decide" is distinct from "execute" — ambiguity
discovered mid-expedition wastes context and produces inconsistent results.

**Mockup-first.** When the quest touches UI/UX, offer a quick visual mockup early
(HTML/SVG artifact, ASCII wireframe, or SwiftUI preview stub — via fp-frontend-designer
or fp-swiftui-designer as fits the realm) before long verbal explanations; iterate on
the visual, not on prose. Applies to the PRE Step 5 discussion and the Step 6 approach
presentation.

**Council execution.** Default: parallel Agent-tool launches exactly as written below.
Only if the commander opts in — the keyword "ultracode" or an explicit ask for
multi-agent orchestration — may the explorer/architect fan-outs run as a Workflow
fan-out instead.

## Mode detection

Before loading anything, determine the mode:

1. If `$ARGUMENTS` contains `--pivot` → **PIVOT mode**
2. Else check `{quest-folder}/context.md` header for expedition state:
   - If the header line shows `Expedition: active` (set by /embark, not yet
     cleared by /make-camp) → **MID-EXPEDITION mode**
   - Otherwise (no flag present, or `Expedition: camped`) → **PRE-EXPEDITION mode**

Flags (all order-independent):
- `--expedition-focus <name>` → record as `{expedition-focus}`; scopes context loading and riddle filtering throughout. `--phase <name>` is a legacy alias.
- `--critique` (bare) → set `{critique} = true` (default `false`); only enables the architect cross-critique in PRE Step 6 (see SKILL.md -> "Council cross-critique (shared)").

---

## Step 1: Resolve the active quest

Resolve the quest for THIS chat (see SKILL.md -> "Active-quest selection"):
1. If `--quest <name-or-path>` was given, use it; read its realm from that quest's
   `STRATEGY_SCROLL.md` frontmatter unless `--realm <realm>` was also passed.
2. Otherwise read `.claude/active-quest.txt` (line 1 = quest folder path, line 2 = realm).

The shared pointer is UNTRUSTED in multi-chat — carry this chat's quest in-conversation
and pass it as `--quest`. `{quest-name}` is the basename of the path.

If neither resolves: "No active quest. Run /new-quest to create one, or pass --quest." Stop.
If quest folder missing: "Quest folder not found. Run /new-quest or /change-quest." Stop.

---

## ══════════════════════════════════════════
## PRE-EXPEDITION MODE
## ══════════════════════════════════════════

*Full planning flow: codebase exploration → clarifying questions → architecture design → lock plan.*

### PRE Step 2: Load quest context

Read:
- `STRATEGY_SCROLL.md` — full content
- `TOME_OF_DANGERS.md` — index only
- `ADVENTURE_JOURNAL.md` — last 2 expedition entries only
- `WORLD_MAP.md` — index only

If split subfolders exist, read index files plus subfiles relevant to `{expedition-focus}`.

Check project-level files if they exist:
- `.ai-context/DANGER_REGISTRY.md` — distilled dangers from past quests
- `.ai-context/DECISIONS_LOG.md` — locked architectural decisions

### PRE Step 3: Present situation

Output:
```
⚔️  Counsel — {quest-name}  |  Realm: {realm}
Mode: Pre-expedition

### Open Riddles
{list from STRATEGY_SCROLL — or "None"}

### Battle Plan
{current battle plan — or "(not yet defined)"}

### Relevant Dangers
{top 3 from TOME_OF_DANGERS relevant to the quest}
```

If no open riddles AND battle plan is fully defined:
Ask: "The plan looks complete. Re-run architecture review anyway? (y/n)"
If n: output "Run /embark to begin." Stop.

### PRE Step 4: Codebase Exploration

Announce: "🔍 Scouting the codebase before we plan..."

Read the Quest Overview from STRATEGY_SCROLL. Use it as the feature description.

Launch 2–3 `fp-code-explorer` agents in parallel. (They prefer Serena MCP for code
navigation when connected, falling back to Grep/Glob — it lives in the agent definition,
no extra prompting needed.)

Each agent's prompt includes: quest overview, realm, WORLD_MAP summary (if populated),
TOME_OF_DANGERS top dangers — plus one focus each:

1. **Similar Features:** "Find features similar to {quest-overview} and trace their implementation comprehensively. Identify patterns we should follow."
2. **Architecture & Abstractions:** "Map the architecture and abstractions relevant to {quest-overview}. Trace call chains, identify module boundaries and extension points."
3. **Integration Points** (launch if the quest involves UI, APIs, or cross-module work): "Identify integration points, testing patterns, and cross-cutting concerns relevant to {quest-overview}."

After all agents return:
1. Read all key files they identified (their "Essential Files" lists)
2. Update `WORLD_MAP.md` — add findings to ## Module Map and ## Key Files table
3. Add any new dangers flagged by agents to `TOME_OF_DANGERS.md` immediately
4. Present summary: patterns found, key files, architecture insights

### PRE Step 5: Clarifying Questions

Review codebase findings + quest overview + open riddles from STRATEGY_SCROLL.

Identify underspecified aspects:
- Edge cases and error handling
- Scope boundaries (what's in v1, what's explicitly out)
- Integration points and backward compatibility
- Performance or security considerations
- Any ambiguity that could cause a mid-expedition pivot

**Present all questions in a clear, organized list.**
**Wait for answers before proceeding.**

If the commander says "whatever you think is best":
Provide your recommendation for each question and ask for explicit confirmation.

Record confirmed answers as candidate oaths.

Also capture the quest's **Acceptance Criteria** — observable outcomes that mean the
quest is done. Where an outcome is provable from what Claude surfaces in a turn, use
the shared machine-provable contract so it is `/goal`-ready (`/embark --goal` reads
these lines verbatim):

```
- {outcome} — Check: {command} surfaces "{expected string}"
```

Example: `- Suite green — Check: `bash hooks/tests/run-all.sh` surfaces "0 failed"`.
Outcomes not reducible to a transcript-visible check may be plain `- {outcome}` lines
(still valid, just not `/goal`-eligible). Finalized and written to the scroll in Step 7.

### PRE Step 6: Architecture Design

Announce: "🏗️ Designing the architecture..."

Launch 2–3 `fp-code-architect` agents in parallel. Each agent receives: quest overview,
realm, WORLD_MAP findings, TOME_OF_DANGERS, clarifying answers from Step 5, locked
oaths, and any fallen strategies — plus one focus each:

1. **Minimal Changes** — Focus: "Design a minimal-changes approach: maximum reuse of existing patterns, smallest possible footprint."
2. **Clean Architecture** — Focus: "Design a clean architecture approach: maintainability, elegant abstractions, clear separation of concerns."
3. **Pragmatic Balance** — Focus: "Design a pragmatic balance: achieves quality without over-engineering, fits the existing codebase patterns."

After all agents return:
1. Review all three blueprints
2. **Cross-critique (only if `--critique`)** — skip entirely unless `{critique}` is true
   (the comparison below is then unchanged). When set (see SKILL.md -> "Council
   cross-critique (shared)"): launch ONE critic with the Agent tool,
   `subagent_type: general-purpose`, passing all three blueprints verbatim. The critic
   does not design — it cross-examines:
   ```
   You are the Council's critic. Three architects independently designed an approach to
   the same feature. Do NOT propose your own design. Cross-examine theirs against each
   other and expose what the comparison table would otherwise hide.

   Feature: {quest-overview}

   Architect 1 (Minimal Changes):
   {Agent 1 blueprint}

   Architect 2 (Clean Architecture):
   {Agent 2 blueprint}

   Architect 3 (Pragmatic Balance):
   {Agent 3 blueprint}

   Report, terse, under 250 words:
   1. Conflicts — where two architects make incompatible structural choices, and which is right.
   2. Hidden coupling / cost — a risk an approach hides that its own author understated.
   3. Cross-refutation — where one blueprint's design quietly invalidates another's premise.
   4. What all three missed — an option or risk absent from every blueprint.
   ```
   Hold the critic's report for the comparison and recommendation.
3. Form a recommendation based on: quest complexity, codebase maturity, time constraints.
   If the critic ran, weigh its findings — do not recommend an approach the critic showed
   to be structurally unsound without saying why.
4. Present comparison (if the critic ran, add a "Critic's cross-examination" block of its
   findings immediately ABOVE the table; omit the block entirely otherwise):

```
### Approach Comparison

| | Minimal Changes | Clean Architecture | Pragmatic Balance |
|---|---|---|---|
| Effort | Low | High | Medium |
| Maintainability | Low | High | Medium |
| Risk | Low | Medium | Low |
| Fits codebase | ✓ | ~ | ✓ |

**Recommendation:** {Approach N} — {one sentence reasoning}
```

**Ask which approach to proceed with. Wait for the commander's choice.**

### PRE Step 7: Lock decisions and finalize plan

1. Move resolved riddles from **Open Riddles** → **Oaths Sworn** in STRATEGY_SCROLL
   Format: `- {decision}: {rationale in one sentence}`
2. Write the chosen architecture as **The Battle Plan** (numbered, specific, bounded steps)
3. **Write/replace the `## Acceptance Criteria` section** of STRATEGY_SCROLL with the
   Step 5 criteria — replacing the `(run /counsel-quest to define …)` placeholder.
   Use the contract line for every provable outcome
   (`- {outcome} — Check: {command} surfaces "{expected}"`), plain `- {outcome}` for
   the rest. `/embark --goal` reads these, so keep the `Check:` phrasing exact.
4. Seed a `## Planned Expeditions` checklist in STRATEGY_SCROLL — one `- [ ]` per
   battle-plan phase with a short focus phrase (e.g. `- [ ] data layer`). Status readers
   parse this tracker; `/embark` flips an item to `- [>]` (active), `/make-camp` to
   `- [x]` (done). Keep the block in the top-level scroll (it must survive a later split).
5. Update `WORLD_MAP.md` with structural insights from architect agents
6. Update `last-updated` frontmatter in all modified scrolls
7. Refresh `.ai-context/` if it exists
8. **Record the lifecycle transition** with a SHELL APPEND (never Edit/Write).
   Use `phase=ready` when no open riddles remain, else `phase=planning`:
   ```bash
   printf '%s\n' "{YYYY-MM-DD}|state|{quest-name}|phase=ready" >> .claude/quest-xp/lifecycle.log
   ```

### PRE Step 8: Confirm

```
⚔️  Counsel complete — {quest-name}

Codebase scouted: {N key files identified, WORLD_MAP updated}
Oaths sworn: {N}
Battle plan: {N steps}
Open riddles remaining: {N — or "none"}

Run /embark to begin the expedition.
```

---

## ══════════════════════════════════════════
## MID-EXPEDITION MODE
## ══════════════════════════════════════════

*Lighter flow: load current state, resolve only what's blocking, adjust plan if needed.*

### MID Step 2: Load current expedition context

Read:
- `STRATEGY_SCROLL.md` — full content
- `TOME_OF_DANGERS.md` — index only
- `ADVENTURE_JOURNAL.md` — current expedition entry (last `## Expedition` block)

If split subfolders exist, load relevant subfiles only.

### MID Step 3: Present blocking state

Output:
```
⚔️  Mid-expedition counsel — {quest-name}  |  Realm: {realm}

Current expedition:
{current expedition entry from ADVENTURE_JOURNAL — Conquered so far, Cursed/Uncertain}

Open riddles blocking progress:
{list from STRATEGY_SCROLL Open Riddles — or "None blocking current work"}

Battle plan remaining:
{unconquered steps from The Battle Plan}
```

If no open riddles and no blockers:
"No blocking riddles. Continue your expedition. Run /make-camp when done."
Stop.

### MID Step 4: Resolve blocking riddles

For each blocking riddle:

1. **State the riddle clearly** — sharpen if vague
2. **Present concrete options** (2–4) — specific enough to implement from
3. **Check TOME_OF_DANGERS** — flag if any option risks a known danger
4. **Lock the decision** — confirm: "Locking: [decision]. This becomes an oath."
5. Move to the next

Anti-patterns: re-opening settled oaths; adding new riddles mid-discussion (note for
later, don't derail); proposing fallen strategies.

### MID Step 5: Adjust battle plan (if needed)

Ask: "Does the battle plan need adjustment for the remaining work?"
If yes: draft the revised plan, confirm before writing. If no: proceed.
The plan stays **ordered, specific, bounded**.

### MID Step 6: Write back to STRATEGY_SCROLL

1. Move locked decisions from Open Riddles → Oaths Sworn
2. Update The Battle Plan if adjusted
3. If the plan changed and a `## Planned Expeditions` checklist exists, reconcile it:
   append a `- [ ]` for any newly added phase (leave existing `[>]`/`[x]` items alone).
4. Update `last-updated` frontmatter

### MID Step 7: Confirm

```
⚔️  Mid-expedition counsel complete — {quest-name}

{N} decision(s) locked. Battle plan {updated / unchanged}.

Continue your expedition.
```

---

## ══════════════════════════════════════════
## PIVOT MODE (--pivot)
## ══════════════════════════════════════════

*Record fallen strategy, preserve partial progress, then run full PRE-EXPEDITION planning with new direction.*

### PIVOT Step 2: Load full quest context

Read all five index scrolls (STRATEGY_SCROLL full, others index only).
Read project-level files if they exist (DANGER_REGISTRY, DECISIONS_LOG).

### PIVOT Step 3: Understand the pivot

Ask: "Describe the pivot — what changed and why are we changing direction?"
Wait. Record as `{pivot-reason}`.

Ask: "What work was completed before the pivot?"
Record as `{pre-pivot-progress}`.

### PIVOT Step 4: Record fallen strategy

Update `STRATEGY_SCROLL.md`:
1. Move current battle plan to **## Fallen Strategies (Rejected Approaches)**:
   ```
   - {plan-summary} (pivoted {date}): {pivot-reason}
   ```
2. Mark any "In Progress" modules as "Cursed" in battle status table
3. Preserve any "Conquered" modules as-is
4. If a `## Planned Expeditions` checklist exists, retire the abandoned in-flight item:
   flip the active `- [>]` to `- [x]` (it is done as far as the fallen plan goes) and
   delete any unstarted `- [ ]` items belonging to the abandoned plan. PIVOT Step 6
   re-runs PRE planning, which re-seeds `- [ ]` for the new direction.

### PIVOT Step 5: Write interrupted journal entry

Append to `ADVENTURE_JOURNAL.md` (or current month file if split):
```
## Expedition {YYYY-MM-DD} (interrupted — pivot)
### Conquered
{pre-pivot-progress, or "none"}
### Pivot Reason
{pivot-reason}
### Fallen Strategy
{summary of abandoned plan}
### The Road Ahead
(replanned by counsel-quest pivot — see new battle plan)
```

### PIVOT Step 6: Run PRE-EXPEDITION planning with new direction

Execute PRE-EXPEDITION Steps 4–8, additionally passing fallen strategies to the
explorer/architect agents — include "Fallen strategy to avoid: {abandoned-plan-summary}"
in Step 4 prompts — so they don't re-propose the abandoned approach. In Step 6, flag
explicitly any architect approach that resembles the fallen strategy.

### PIVOT Step 7: Confirm

```
⚔️  Pivot recorded — {quest-name}

Fallen strategy archived: {plan-summary}
Interrupted expedition logged: {date}
New direction: {new battle plan summary}
Oaths sworn: {N}

Run /embark to begin the first expedition on the new plan.
```

