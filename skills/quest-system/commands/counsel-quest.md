---
description: >
  Plan, replan, or pivot the active quest. Three modes: PRE-expedition (full feature-dev
  flow with codebase exploration + architecture design), MID-expedition (resolve blockers
  and adjust plan), PIVOT (record fallen strategy and re-plan from scratch).
  Use --pivot flag for a full direction change mid-expedition.
argument-hint: "[--quest <name>] [--realm <realm>] [--pivot] [--expedition-focus <name>]"
---

# Counsel Quest

Plan before you leap. Resolve what's unclear before it blocks an expedition.

This command exists because "discuss and decide" is distinct from "execute".
Ambiguity discovered mid-expedition wastes context and produces inconsistent results.

## Mode detection

Before loading anything, determine the mode:

1. If `$ARGUMENTS` contains `--pivot` → **PIVOT mode**
2. Else check `{quest-folder}/context.md` header for expedition state:
   - If the header line shows `Expedition: active` (set by /embark, not yet
     cleared by /make-camp) → **MID-EXPEDITION mode**
   - Otherwise (no flag present, or `Expedition: camped`) → **PRE-EXPEDITION mode**

If `$ARGUMENTS` contains `--expedition-focus <name>`, record it as `{expedition-focus}`
and use it to scope context loading and riddle filtering throughout.

If `$ARGUMENTS` contains `--phase <name>`, treat as a legacy alias for `--expedition-focus`.

---

## Step 1: Resolve the active quest

Resolve the quest for THIS chat (see SKILL.md -> "Active-quest selection"):
1. If a `--quest <name-or-path>` argument was given, use it; read its realm from that
   quest's `STRATEGY_SCROLL.md` frontmatter unless `--realm <realm>` was also passed.
2. Otherwise read `.claude/active-quest.txt` (line 1 = quest folder path, line 2 = realm).

`--quest` is order-independent with `--pivot` and `--expedition-focus`; it only selects
which quest to counsel. The shared pointer is UNTRUSTED in multi-chat — carry this chat's
quest in-conversation and pass it as `--quest`. `{quest-name}` is the basename of the path.

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

Launch 2–3 `fp-code-explorer` agents in parallel. Each agent investigates a different angle.
(These agents prefer Serena MCP for code navigation when it is connected, falling back to Grep/Glob otherwise — no extra prompting needed; it lives in the agent definition.)

**Agent 1 — Similar Features:**
Prompt the agent with:
- Quest overview, realm, WORLD_MAP summary (if populated), TOME_OF_DANGERS top dangers
- Focus: "Find features similar to {quest-overview} and trace their implementation comprehensively. Identify patterns we should follow."

**Agent 2 — Architecture & Abstractions:**
Prompt the agent with:
- Quest overview, realm, WORLD_MAP summary, TOME_OF_DANGERS top dangers
- Focus: "Map the architecture and abstractions relevant to {quest-overview}. Trace call chains, identify module boundaries and extension points."

**Agent 3 — Integration Points** (launch if the quest involves UI, APIs, or cross-module work):
Prompt the agent with:
- Quest overview, realm, WORLD_MAP summary
- Focus: "Identify integration points, testing patterns, and cross-cutting concerns relevant to {quest-overview}."

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

### PRE Step 6: Architecture Design

Announce: "🏗️ Designing the architecture..."

Launch 2–3 `fp-code-architect` agents in parallel, each with a different focus.
Each agent receives: quest overview, realm, WORLD_MAP findings, TOME_OF_DANGERS,
clarifying answers from Step 5, locked oaths, and any fallen strategies.

**Agent 1 — Minimal Changes:**
Focus: "Design a minimal-changes approach: maximum reuse of existing patterns, smallest possible footprint."

**Agent 2 — Clean Architecture:**
Focus: "Design a clean architecture approach: maintainability, elegant abstractions, clear separation of concerns."

**Agent 3 — Pragmatic Balance:**
Focus: "Design a pragmatic balance: achieves quality without over-engineering, fits the existing codebase patterns."

After all agents return:
1. Review all three blueprints
2. Form a recommendation based on: quest complexity, codebase maturity, time constraints
3. Present comparison:

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
3. Seed a `## Planned Expeditions` checklist in STRATEGY_SCROLL — one `- [ ]` per
   battle-plan phase, each labeled with a short focus phrase (e.g. `- [ ] data layer`,
   `- [ ] surface layer`). This is the upcoming-work tracker the dashboard reads;
   `/embark` flips an item to `- [>]` (active) and `/make-camp` to `- [x]` (done).
   Keep the block in the top-level scroll (it must survive a later split).
4. Update `WORLD_MAP.md` with structural insights from architect agents
5. Update `last-updated` frontmatter in all modified scrolls
6. Refresh `.ai-context/` if it exists
7. **Record the lifecycle transition** with a SHELL APPEND (never Edit/Write) so the
   dashboard reflects planning progress in real time. Use `phase=ready` when no open
   riddles remain (plan is locked and ready to embark), else `phase=planning`:
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

**Anti-patterns:**
- Re-opening settled oaths
- Adding new riddles mid-discussion (note for later, don't derail)
- Proposing fallen strategies

### MID Step 5: Adjust battle plan (if needed)

Ask: "Does the battle plan need adjustment for the remaining work?"
- If yes: draft the revised plan, confirm before writing
- If no: proceed

The plan should stay: **ordered, specific, bounded**.

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

Execute PRE-EXPEDITION Steps 4–8 with these additions:
- Pass fallen strategies to fp-code-explorer and fp-code-architect agents so they
  don't re-propose the abandoned approach
- In Step 4 agent prompts, include: "Fallen strategy to avoid: {abandoned-plan-summary}"
- In Step 6, if any architect approach resembles the fallen strategy, flag it explicitly

### PIVOT Step 7: Confirm

```
⚔️  Pivot recorded — {quest-name}

Fallen strategy archived: {plan-summary}
Interrupted expedition logged: {date}
New direction: {new battle plan summary}
Oaths sworn: {N}

Run /embark to begin the first expedition on the new plan.
```

