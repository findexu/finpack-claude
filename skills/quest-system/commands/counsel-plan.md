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

## Step 4: Analyze the plan

Review the plan against:

If `{your-opinion}` is present, treat it as a lens: actively look for evidence that
supports or contradicts it. Address it directly in the feedback output.

**Completeness**
- Does every step have a clear, executable action?
- Is the verification section present and testable?
- Are file paths specific (not vague references)?

**Risks** (check against loaded quest context if available)
- Does any step conflict with a locked decision from DECISIONS_LOG?
- Does any step risk triggering a known danger from DANGER_REGISTRY?
- Are there steps that could break in-progress work (battle status)?

**Gaps**
- What is assumed but not stated?
- What edge cases are not handled?
- Is rollback or undo possible if a step fails?

**Scope**
- Does the plan address the actual goal, or has it drifted?
- Are there unnecessary steps that add risk with no value?

## Step 5: Output

Present as:

---
**Plan feedback** — copy the block below and paste it into your planning session:

```
## Feedback on this plan

{if your-opinion present:}
### On your concern: "{your-opinion}"
{direct response — does the plan address it, ignore it, or contradict it?}

### Gaps
{list — or "None identified"}

### Risks
{list — flag if any conflict with locked decisions or known dangers}

### Unclear steps
{list specific steps with the ambiguity noted — or "None"}

### Scope concerns
{note if plan has drifted or is over/under-scoped — or "None"}

### Suggested additions
{specific additions that would strengthen the plan — or "None"}
```

---
