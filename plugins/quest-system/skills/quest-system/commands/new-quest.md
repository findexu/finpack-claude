---
description: Begin a brand new quest (feature/epic) from scratch. Interviews the commander to extract real context, then creates all five scrolls populated with that knowledge.
argument-hint: "[quest-name] [realm]"
---

# New Quest

Begin a new quest. A quest is a feature or epic tracked with five persistent scrolls.

**Do not create any files until the discovery interview is complete and the commander approves.**

## Step 1: Discovery Interview

### 1a. Open the conversation

Ask plainly — not as a structured form:

> "What are we building?"

Wait for the response. This answer gives you the thread to follow.

### 1b. Follow the thread

Based on what they said, ask follow-up questions that dig deeper. Use structured
options (2-4 choices) when they help the commander think — present concrete
interpretations to react to, not open-ended blanks.

Keep following threads. Each answer opens new ones.

Track these as a **background checklist** — not a sequential script. Weave
questions naturally as gaps appear:

- [ ] **What it is** — specific enough to explain to a stranger
- [ ] **Why now** — the problem or desire driving it
- [ ] **What done looks like** — observable acceptance criteria, not vague goals
- [ ] **Scope** — what's in v1, what's explicitly excluded
- [ ] **Known dangers** — constraints, technical risks, or traps already suspected
- [ ] **Approach sketch** — any strong opinions on how to tackle it

**Clarify vagueness — never accept fuzzy answers:**
- "faster" → faster how? sub-second? handles 10k rows?
- "users" → which users? internal team? mobile-only?
- "simple" → simple compared to what? what's being removed?
- "improve" → improve by what measure? how will we know it worked?

**Anti-patterns to avoid:**
- Checklist-walking ("Next question: what are your constraints?")
- Canned corporate questions ("What are your success criteria?")
- Accepting vague answers without probing
- Rushing to scroll creation before the vision is clear
- Asking about tech stack before understanding the problem

### 1c. Decision gate

When you have enough to populate the scrolls with real content, ask:

> "I think I have what I need to set up the quest. Ready to inscribe the scrolls?"

Options:
- "Yes, inscribe the scrolls" — proceed to Step 2
- "Not yet, keep exploring" — ask what's unclear, probe the gaps

Loop until the commander approves.

## Step 2: Confirm quest name and realm

If $ARGUMENTS was provided, parse: first token = quest name, second token = realm.

Otherwise, propose both derived from the discovery interview:
- Quest name: a kebab-case slug that captures what this is (e.g. `scan-alignment-floor-annotation`)
- Realm: the app target in scope (e.g. `WeScanX`)

Confirm with the commander before proceeding.

## Step 3: Create quest folder

Create the folder: `docs/dev/{quest-name}/`

If the folder already exists and any scroll files are present, warn:
"Quest folder already exists. Continue and overwrite scrolls? (y/n)"
Stop if n.

## Step 4: Create all five scrolls

**Populate scrolls from the discovery interview. Do not leave placeholders where
you have actual knowledge.** Empty scaffolding is worse than no scaffolding.

Fill in `{quest-name}`, `{realm}`, `{date}` (YYYY-MM-DD) throughout.

Create each file with the full template content below:

**`docs/dev/{quest-name}/WORLD_MAP.md`:**
```
---
quest: {quest-name}
realm: {realm}
scroll: WORLD_MAP
last-updated: {date}
---
# World Map — {quest-name}
## Realm
This workspace contains multiple realms (app targets).
All work this quest is scoped to **{realm}** only.
Do not venture into other realms unless explicitly commanded.
## Module Map
(to be charted during first expedition scouting)
## Navigation Flow
(to be charted during first expedition scouting)
## Data Flow
(to be charted during first expedition scouting)
## Key Files
| File | Role |
|---|---|
## Retired Files
(none yet)
```

**`docs/dev/{quest-name}/STRATEGY_SCROLL.md`:**

Populate from the discovery interview. Fill every section you have real answers for.
Do not write "(to be charted)" if the commander already told you.

```
---
quest: {quest-name}
realm: {realm}
scroll: STRATEGY_SCROLL
last-updated: {date}
---
# Strategy Scroll — {quest-name}

## Quest Overview
{1-3 sentence summary of what this quest is and why it exists — from the interview}

## Acceptance Criteria
What "done" looks like for this quest (observable outcomes, not tasks):
{list from the interview — be specific. Vague criteria are useless.}

## Scope
**In scope:** {what the commander confirmed is in v1}
**Out of scope:** {what the commander explicitly excluded, with brief reason}

## Battle Status
| Module | Status |
|---|---|

## Oaths Sworn (Resolved Decisions)
{any decisions locked during the interview, or "(none yet)"}

## Fallen Strategies (Rejected Approaches)
(none yet)

## Scouting Findings (Audit Results)
(none yet)

## Open Riddles (Decisions Needed)
{gray areas raised in the interview that were not resolved, or "(none yet — run /counsel-quest before first expedition)"}

## The Battle Plan (Implementation Sequence)
{initial approach sketch from the interview as ordered steps.
If none given: "(not yet defined — run /counsel-quest to lock the plan before embarking)"}
```

**`docs/dev/{quest-name}/ADVENTURE_JOURNAL.md`:**
```
---
quest: {quest-name}
realm: {realm}
scroll: ADVENTURE_JOURNAL
last-updated: {date}
---
# Adventure Journal — {quest-name}
Append-only. One entry per expedition. Never rewrite history.
```

**`docs/dev/{quest-name}/TOME_OF_DANGERS.md`:**

Populate known dangers from the interview. If the commander described constraints,
technical risks, or "things that could go wrong" — they belong here now, not
discovered later mid-expedition.

```
---
quest: {quest-name}
realm: {realm}
scroll: TOME_OF_DANGERS
last-updated: {date}
---
# Tome of Dangers — {quest-name}
Source of truth for every monster, trap, and curse encountered.
Always read before proposing any strategy involving rendering,
memory, or architecture.
## Confirmed Safe Paths
(to be discovered during scouting)
## Known Dangers
| Danger | Impact | Remedy |
|---|---|---|
{populate from interview if any dangers/constraints were mentioned, otherwise leave table empty}
## Fallen Strategies (Tried and Abandoned)
(none yet)
## Unsolved Riddles (Open Verification Items)
(none yet)
```

**`docs/dev/{quest-name}/ADVENTURERS_HANDBOOK.md`:**
```
---
quest: {quest-name}
realm: {realm}
scroll: ADVENTURERS_HANDBOOK
last-updated: {date}
---
# Adventurer's Handbook — How to Use the Scrolls

Read this scroll if you are unsure what belongs where.
These scrolls are the party's shared memory.
Never rely on conversation history — always inscribe to the scrolls.

## WORLD_MAP.md
The map of the realm — how the codebase is structured.
Inscribe: module map, navigation flow, data flow, key files, retired files.
Do NOT inscribe: decisions, constraints, expedition history.
Update when: any structural or navigational change is made.

## STRATEGY_SCROLL.md
The agreed battle plan — what we are building and why.
Inscribe: battle status, implementation sequence, oaths, fallen strategies,
scouting findings, open riddles.
Do NOT inscribe: realm structure, dangers, expedition history.
Update when: step conquered, oath sworn, strategy falls, riddle resolved.

## ADVENTURE_JOURNAL.md
Append-only chronicle. Format every entry as:
## Expedition [DATE]
### Conquered
### Oaths Sworn
### Cursed / Uncertain
### The Road Ahead
Update when: end of every expedition, no exceptions.

## TOME_OF_DANGERS.md
Every confirmed danger, curse, and trap encountered.
Inscribe: safe paths, known dangers, remedies, fallen strategies,
unsolved riddles, safe limits.
Update when: new danger found, remedy validated, assumption confirmed.
STOP mid-expedition and inscribe immediately when a new danger is found.

## Sacred Laws
- Not in the scrolls = does not exist as shared knowledge
- TOME_OF_DANGERS.md prevents fighting the same monster twice — keep it current
- ADVENTURE_JOURNAL.md is append-only — history is sacred
```

## Step 5: Set active quest

Write `.claude/active-quest.txt`:
```
docs/dev/{quest-name}
{realm}
```

## Step 6: Bootstrap adventurer profile (first quest only)

Check if `.claude/quest-xp/profile.md` exists.

If it does NOT exist:

1. Get adventurer name: run `git config user.name`. If unavailable, use "Adventurer".

2. Create `.claude/quest-xp/` directory.

3. Create `.claude/quest-xp/profile.md`:
```
---
adventurer: {git-user-name}
level: 1
total-exp: 0
quests-completed: 0
total-expeditions: 0
total-dangers-mapped: 0
total-oaths-sworn: 0
total-splits: 0
badges: []
---
# {git-user-name}'s Adventurer Profile

Complete quests, log expeditions, and map dangers to earn EXP.
Run /quest-xp to view your profile.
```

4. Create `.claude/quest-xp/quest-history.md`:
```
# Quest History

Append-only EXP log. One entry per completed quest.
```

5. Ensure `.gitignore` contains `.claude/quest-xp/`.
   Read `.gitignore` if it exists. If the line is absent, append it.

## Step 7: Bootstrap .ai-context/ (first quest only)

Check if `.ai-context/` exists.

If it does NOT exist:

1. Create `.ai-context/` directory.

2. Create `.ai-context/README.md`:
```
# AI Context

This folder is maintained by quest-system. Refreshed at every /embark and /make-camp.
Do NOT edit manually — changes will be overwritten.

## How to use

**GitHub Copilot:**
Paste the contents of quest.md at the start of your Copilot Chat session.
Or add to .github/copilot-instructions.md for always-on context (note: becomes stale
between /make-camp runs — paste is more accurate).

**Google Gemini / other AI tools:**
Paste quest.md, dangers.md, and decisions.md at the start of your chat.

**Recommended opening message:**
"Here is the current project context: [paste quest.md] [paste dangers.md]"

## Files

- quest.md      — active quest status, battle progress, open questions, road ahead
- dangers.md    — known technical dangers and constraints to avoid
- decisions.md  — locked architectural decisions that must not be re-debated
```

3. Create placeholder files (will be populated by /embark):
   - `.ai-context/quest.md` with content: `# Active Quest\n(run /embark to populate)`
   - `.ai-context/dangers.md` with content: `# Known Dangers\n(run /embark to populate)`
   - `.ai-context/decisions.md` with content: `# Locked Decisions\n(run /embark to populate)`

## Step 8: Announce

Output:
```
⚔️  Quest inscribed: {quest-name}
Realm: {realm}

Scrolls created in docs/dev/{quest-name}/:
  ✓ STRATEGY_SCROLL.md  — overview, acceptance criteria, battle plan
  ✓ TOME_OF_DANGERS.md  — {N pre-loaded dangers, or "no pre-loaded dangers"}
  ✓ ADVENTURE_JOURNAL.md
  ✓ WORLD_MAP.md
  ✓ ADVENTURERS_HANDBOOK.md
{if first quest: "\n  ✓ Adventurer profile created. Run /quest-xp to view."}

Next steps:
  /counsel-quest  — lock implementation decisions and finalize the battle plan
  /embark         — start the first expedition (skip /counsel-quest if the plan is clear)
```
