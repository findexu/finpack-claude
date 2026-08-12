---
description: Summon three specialist sages to counsel on a decision or dilemma. Loads quest context, then spawns The Cartographer (codebase), The Emissary (web research), and The Sage (critical reason) in parallel. Synthesizes their findings into council accord.
argument-hint: "[question or dilemma] [--quest <name>] [--realm <realm>] [--critique]"
---

# Ask Sages

Convene the council. Three sages examine your matter from different vantage points and deliver their counsel.

**Mockup-first.** When `{matter}` is a UI/UX question, offer a quick visual mockup
(HTML/SVG artifact, ASCII wireframe, or SwiftUI preview stub) alongside — or instead
of — prose counsel, and offer to iterate on it after the accord.

## Step 1: Resolve the active quest

Strip `--quest <token>` / `--realm <token>` (each consumes the next whitespace-delimited
token) and the bare `--critique` flag (set `{critique} = true`, default `false`) from
`$ARGUMENTS`. `--critique` MUST be removed here so it never leaks into `{matter}`;
everything left over after all three flags is the question/dilemma (Step 2 reads it).

Resolve the quest for THIS chat (see SKILL.md -> "Active-quest selection"):
1. If `--quest` was given, use it; read its realm from `STRATEGY_SCROLL.md`
   frontmatter unless `--realm` was also passed.
2. Otherwise read `.claude/active-quest.txt` (line 1 = quest folder path, line 2 = realm).
3. If neither resolves: "No active quest. Run /new-quest first, or pass --quest. The sages cannot advise without a quest." Stop.

The shared pointer is UNTRUSTED in multi-chat — carry this chat's quest in-conversation
and pass it as `--quest`. The sages are scoped to the RESOLVED quest. If the quest
folder does not exist on disk: "Quest folder not found at {path}. Run /new-quest or
/change-quest." Stop.

## Step 2: Take the matter

Store the remaining `$ARGUMENTS` as `{matter}`. If empty, ask the commander:
"What matter do you wish to lay before the sages?"

## Step 3: Load context

Load in this order:

1. **Project-level** (if present, else skip silently): `.ai-context/DANGER_REGISTRY.md`, `.ai-context/DECISIONS_LOG.md`.
2. **Quest scrolls** — the index file ONLY for each (even when a split subfolder `dangers/`, `strategy/`, `journal/`, `map/` exists — never load subfiles): `WORLD_MAP.md`, `STRATEGY_SCROLL.md`, `ADVENTURE_JOURNAL.md`, `TOME_OF_DANGERS.md`, `ADVENTURERS_HANDBOOK.md`.
3. **Fast path** — if `{quest-folder}/context.md` exists, read it: a pre-synthesized snapshot of battle status, open riddles, road ahead, dangers, and decisions. Use it to supplement scroll data, not replace it.

## Step 4: Announce consultation

Output:
```
🔮  The sages are summoned.
Quest: {quest-name}  |  Realm: {realm}
Matter: {matter}

Three sages answer the call...
```

## Step 5: Summon the three sages

Default: use the Agent tool to launch all three simultaneously in a single message
(three Agent tool calls in one response — they run in parallel). Only if the commander
opts in — the keyword "ultracode" or an explicit ask for multi-agent orchestration —
may the three sages (plus the optional critic) run as a Workflow fan-out instead.

Each sage's prompt includes, after its opening mandate lines, the shared header:

```
Quest: {quest-name}
Realm: {realm}
Matter: {matter}
```

---

**The Cartographer** (`subagent_type: Explore`)

Prompt:
```
You are The Cartographer — a sage who reads the kingdom's maps (the codebase).
Your mandate: find what already exists in this codebase that is relevant to the matter below.

{shared header}

Battle status (from STRATEGY_SCROLL):
{battle status table}

Known dangers relevant to this matter:
{top 3 dangers from TOME_OF_DANGERS}

Key files and areas (from WORLD_MAP):
{world map summary}

Tooling: if Serena MCP tools (mcp__serena__*) are connected, prefer them for symbol navigation — find_symbol, find_referencing_symbols, get_symbols_overview, search_for_pattern — over text search. Fall back to Grep/Glob when Serena is absent or for plain-text matches.

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

{shared header}

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

{shared header}

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

## Step 5.5: Cross-critique (only if `--critique`)

Skip this step entirely unless `{critique}` is true (see SKILL.md ->
"Council cross-critique (shared)"); when skipped, the council accord below is
byte-for-byte unchanged from the default flow. When true, after all three sages
return, launch ONE critic with the Agent tool, `subagent_type: general-purpose` —
it judges what the sages said, is given no codebase or web tools, and does not
re-research.

Prompt:
```
You are the Council's critic. Three sages have answered the matter below, each from
a different vantage. Your job is NOT to re-answer — it is to cross-examine their
answers against each other and expose what the chairman should not gloss over.

Matter: {matter}

The Cartographer (codebase) said:
{Cartographer's findings}

The Emissary (web research) said:
{Emissary's findings}

The Sage (pure reason) said:
{Sage's findings}

Report, terse, under 250 words, in these four sections:
1. Conflicts — where the sages directly contradict each other, and who is right.
2. Blind spots — a claim two or more sages assumed but none actually verified.
3. What all missed — a risk or option absent from all three answers.
4. Trust map — which sage to believe on which point.

No filler. No restating their answers. Only the tensions between them.
```

Hold the critic's report for the accord below.

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

{ONLY IF `--critique` ran — otherwise omit this entire block, divider and all, so the
output is identical to the default flow:}
──────────────────────────────────────────
The critic's cross-examination:
──────────────────────────────────────────
{critic's report — conflicts, blind spots, what all missed, trust map}

══════════════════════════════════════════
The Council's accord:
{1-3 sentence synthesis — where the sages agree, where they diverge, recommended path
forward. If the critic ran, fold its tensions in: resolve flagged conflicts explicitly
rather than averaging over them.}
══════════════════════════════════════════
```

## Step 7: Record in journal (optional)

Ask: "Shall the scribes record this counsel in the {quest-name} journal? (y/n)"
(naming the resolved quest is the echo — confirm it is the intended one).
If n: stop. If y: append to `ADVENTURE_JOURNAL.md` (or the current month file if split):

```markdown
### Sage Council — {date}

**Matter:** {matter}

**Council's accord:** {synthesis from Step 6}
```

Do not append the full sage outputs — accord only. Keep journal lean.
