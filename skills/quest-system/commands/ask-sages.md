---
description: Summon three specialist sages to counsel on a decision or dilemma. Loads quest context, then spawns The Cartographer (codebase), The Emissary (web research), and The Sage (critical reason) in parallel. Synthesizes their findings into council accord.
argument-hint: "[question or dilemma]"
---

# Ask Sages

Convene the council. Three sages examine your matter from different vantage points and deliver their counsel.

## Step 1: Read active quest

Read `.claude/active-quest.txt`.
Line 1 = quest folder path. Line 2 = realm.

If the file does not exist:
"No active quest. Run /new-quest first. The sages cannot advise without a quest." Stop.

If the quest folder does not exist on disk:
"Quest folder not found at {path}. Run /new-quest or /change-quest." Stop.

## Step 2: Take the matter

Read `$ARGUMENTS` as the question or dilemma to seek counsel on.

If `$ARGUMENTS` is empty, ask the commander:
"What matter do you wish to lay before the sages?"

Store the answer as `{matter}`.

## Step 3: Load context

Load in this order:

**Project-level knowledge** (if files exist):
- `.ai-context/DANGER_REGISTRY.md`
- `.ai-context/DECISIONS_LOG.md`

If neither exists, skip silently.

**Quest scrolls** — read the index file only for each:
- `WORLD_MAP.md`
- `STRATEGY_SCROLL.md`
- `ADVENTURE_JOURNAL.md`
- `TOME_OF_DANGERS.md`
- `ADVENTURERS_HANDBOOK.md`

For scrolls with a split subfolder present (`dangers/`, `strategy/`, `journal/`, `map/`):
read the index file only — do not load subfiles.

**Fast path** — if `{quest-folder}/context.md` exists, read it. It contains a pre-synthesized snapshot of battle status, open riddles, road ahead, dangers, and decisions. Use it to supplement scroll data, not replace it.

## Step 4: Announce consultation

Output:
```
🔮  The sages are summoned.
Quest: {quest-name}  |  Realm: {realm}
Matter: {matter}

Three sages answer the call...
```

## Step 5: Summon the three sages

Use the Agent tool to launch all three simultaneously in a single message (three Agent tool calls in one response — they run in parallel):

---

**The Cartographer** (`subagent_type: Explore`)

Prompt:
```
You are The Cartographer — a sage who reads the kingdom's maps (the codebase).
Your mandate: find what already exists in this codebase that is relevant to the matter below.

Quest: {quest-name}
Realm: {realm}
Matter: {matter}

Battle status (from STRATEGY_SCROLL):
{battle status table}

Known dangers relevant to this matter:
{top 3 dangers from TOME_OF_DANGERS}

Key files and areas (from WORLD_MAP):
{world map summary}

Search the codebase for:
- Existing implementations or patterns relevant to the matter
- Files, functions, or modules in scope
- Prior decisions encoded in the code
- Anything that constrains or enables the options in the matter

Report:
1. What exists (specific files and patterns found)
2. What can be reused
3. What the code reveals about the feasibility of each option
4. Any technical risks visible in the codebase

Be direct. Under 300 words. No filler.
```

---

**The Emissary** (`subagent_type: general-purpose`)

Prompt:
```
You are The Emissary — a sage who rides to distant libraries (the internet).
Your mandate: find what the wider world knows about the matter below.

Quest: {quest-name}
Realm: {realm}
Matter: {matter}

Tech stack / realm context:
{ADVENTURERS_HANDBOOK summary if available, else: "iOS/Swift project"}

Use WebSearch and WebFetch to research:
- Best practices for this type of decision
- Known pitfalls and failure modes others have encountered
- Relevant official documentation
- Community discussion or benchmarks

Report:
- Top 3-5 findings, each as: [Source name] (URL) — one-line summary
- One paragraph synthesis: what the wider world recommends

Be direct. Cite sources. Under 350 words. No filler.
```

---

**The Sage** (`subagent_type: general-purpose`)

Prompt:
```
You are The Sage — a sage who speaks from pure reason alone.
No codebase. No internet. Only logic, risk analysis, and first principles.
Your mandate: challenge assumptions and expose what the commander may have missed.

Quest: {quest-name}
Realm: {realm}
Matter: {matter}

Full quest context:
{battle status table}

Open riddles (unresolved decisions):
{open riddles from STRATEGY_SCROLL, or "None"}

Known dangers:
{top 3 dangers from TOME_OF_DANGERS}

Locked oaths (prior decisions to honor):
{oaths sworn from STRATEGY_SCROLL, or "None"}

Project dangers (cross-quest):
{top 3 from DANGER_REGISTRY.md if exists, else "None"}

Examine the matter with pure reason:
1. What assumptions are buried in how the question is framed?
2. What could go wrong with each likely option?
3. What is the commander probably not considering?
4. Is there a better framing of the question entirely?

Report as structured critique. Be direct. Challenge everything. Under 300 words.
```

---

## Step 6: Deliver council accord

After all three sages return, present:

```
📜  The Sages Speak

──────────────────────────────────────────
The Cartographer reports from the kingdom's maps:
──────────────────────────────────────────
{Cartographer's findings}

──────────────────────────────────────────
The Emissary returns from distant lands:
──────────────────────────────────────────
{Emissary's findings with sources}

──────────────────────────────────────────
The Sage speaks from reason alone:
──────────────────────────────────────────
{Sage's critical analysis}

══════════════════════════════════════════
The Council's accord:
{1-3 sentence synthesis — where the sages agree, where they diverge, recommended path forward}
══════════════════════════════════════════
```

## Step 7: Record in journal (optional)

Ask: "Shall the scribes record this counsel in the journal? (y/n)"

If n: stop.

If y: append to `ADVENTURE_JOURNAL.md` (or the current month file if split):

```markdown
### Sage Council — {date}

**Matter:** {matter}

**Council's accord:** {synthesis from Step 6}
```

Do not append the full sage outputs — accord only. Keep journal lean.
