---
description: Rewrite a rough prompt into a sharp, well-contextualized Claude prompt. Loads quest context so the rewritten prompt includes relevant project details. Output is a single copyable block.
argument-hint: "[rough prompt text] [--quest <name>]"
---

# Counsel Prompt

Rewrite a rough or vague prompt into a precise, effective Claude prompt.

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

First strip any `--quest <token>` / `--realm <token>` flags from `$ARGUMENTS`
(already consumed in Step 1). Read what remains as the rough prompt to rewrite.

If empty, ask: "What do you want to ask Claude? Paste your rough prompt."

## Step 3: Analyze the rough prompt

Identify:
- The actual goal (what outcome does the user need?)
- Missing context (what does Claude need to know to answer well?)
- Ambiguities (what could be misread?)
- Scope drift risks (is it too broad or too narrow?)

If quest context is loaded, identify which quest details are relevant to include
(battle status, tech stack, realm, known dangers — only what's directly relevant).

## Step 4: Rewrite

Produce a single polished prompt that:
- Opens with a clear one-sentence goal
- Includes only the context Claude needs (no bloat)
- Specifies expected output format if relevant
- Is direct — no filler, no pleasantries

## Step 5: Output

Present as:

---
**Rewritten prompt** — copy the block below:

```
{rewritten prompt here}
```

**What changed:** {1-2 sentence summary of what was added, clarified, or removed}

---
