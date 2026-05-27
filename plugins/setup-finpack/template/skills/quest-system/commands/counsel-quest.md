---
description: Lock implementation decisions and finalize the battle plan before embarking. Run before the first expedition on a new quest, before starting a new expedition focus, or whenever open riddles need resolving.
argument-hint: "[--expedition-focus <name>] [--phase <name>]"
---

# Counsel Quest

Lock open decisions and finalize the battle plan. This command exists because
"discuss and decide" is distinct from "execute". Unresolved riddles mid-expedition
waste context and produce inconsistent results.

Run this when:
- Starting a new quest that has no battle plan yet
- Starting a new expedition focus on an existing quest
- Multiple open riddles are blocking progress
- The battle plan feels stale or incomplete

## Step 1: Read active quest

Read `.claude/active-quest.txt`.
Line 1 = quest folder path. Line 2 = realm.

If the file does not exist:
"No active quest. Run /new-quest to create one." Stop.

## Step 2: Load scrolls

Read from the quest folder:
- `STRATEGY_SCROLL.md` — full content (battle plan, open riddles, oaths, status)
- `TOME_OF_DANGERS.md` — index only (dangers shape decisions)
- `ADVENTURE_JOURNAL.md` — last 2 expedition entries only (what was recently learned)

If split subfolders exist (`strategy/`, `dangers/`, `journal/`), read index files
plus any subfiles directly relevant to the open riddles.

If $ARGUMENTS contains `--expedition-focus <name>`, focus only on riddles and
plan sections relevant to that expedition focus.

If $ARGUMENTS contains `--phase <name>`, treat it as a legacy alias for
`--expedition-focus <name>` (migration compatibility for older command usage).

## Step 3: Present the situation

Output a concise state-of-the-quest summary:

```
## Counsel — {quest-name}

### Open Riddles (Decisions Needed)
{list from STRATEGY_SCROLL — or "None. The battle plan is clear."}

### Battle Plan Status
{current battle plan from STRATEGY_SCROLL, with status of each step}

### Relevant Dangers
{top dangers from TOME_OF_DANGERS that affect pending decisions}
```

If there are no open riddles and the battle plan is fully defined:

> "No open riddles and the battle plan is clear. You're ready to /embark."

Stop here — do not invent work.

## Step 4: Work through open riddles

For each open riddle, run a focused discussion:

1. **State the riddle clearly** — what is the actual decision that needs to be made?
   If the riddle is vague, sharpen it first: *"This riddle is about X — specifically,
   we need to decide Y. Is that right?"*

2. **Present concrete options** (2-4 choices) — not open-ended blanks.
   Each option should be specific enough that a stranger could implement it from
   the description alone.

3. **Probe for constraints** — what makes some options dangerous?
   Check TOME_OF_DANGERS for anything that rules out an approach.

4. **Lock the decision** — once the commander chooses, confirm:
   *"Locking: [decision]. This becomes an oath — it won't be re-debated."*

5. Move to the next riddle.

**Anti-patterns:**
- Presenting options that are too vague to act on ("Option A: use a service layer")
- Moving on without explicit commander confirmation
- Re-opening a riddle that was already resolved in a previous expedition
- Adding new riddles mid-discussion (note them for later, don't derail)

## Step 5: Finalize the battle plan

After all riddles are resolved (or confirmed as still open with a reason):

1. Review the current battle plan in `STRATEGY_SCROLL.md`
2. Ask: *"Does the battle plan reflect what we just decided, or does it need updating?"*
3. If updating: draft the revised plan and confirm with the commander before writing

The battle plan should be:
- **Ordered** — numbered steps, each building on the last
- **Specific** — each step names what gets built, not just "implement X"
- **Bounded** — if a step is too large, split it

## Step 6: Write decisions back to STRATEGY_SCROLL

Update `STRATEGY_SCROLL.md`:

1. Move each locked decision from **Open Riddles** to **Oaths Sworn**
   Format: `- {decision}: {rationale in one sentence}`

2. Update **The Battle Plan** with the finalized sequence

3. Update `last-updated` in YAML frontmatter

Do not update any other scroll.

## Step 7: Confirm

Output:
```
⚔️  Counsel complete — {quest-name}

Oaths sworn this expedition planning round:
{list of decisions locked}

Battle plan: {N steps defined / updated / unchanged}

Open riddles remaining: {N — or "none"}

Run /embark to begin the expedition.
```
