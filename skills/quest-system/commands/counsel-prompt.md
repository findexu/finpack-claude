---
description: Rewrite a rough prompt into a sharp, well-contextualized Claude prompt. Loads quest context so the rewritten prompt includes relevant project details. Output is a single copyable block.
argument-hint: "[rough prompt text]"
---

# Counsel Prompt

Rewrite a rough or vague prompt into a precise, effective Claude prompt.

## Step 1: Read quest context (optional)

Check if `.claude/active-quest.txt` exists. If it does, read it and load:
- `.ai-context/quest.md` if it exists (fast path — already synthesized)
- Otherwise: read STRATEGY_SCROLL.md for battle status and open riddles,
  ADVENTURERS_HANDBOOK.md for tech stack

If no active quest, proceed without quest context.

## Step 2: Take the rough prompt

Read `$ARGUMENTS` as the rough prompt to rewrite.

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
