---
name: quest-system
description: >
  RPG-themed epic and expedition management system for Claude Code.
  Tracks quests (features/epics), expeditions (work loops), realms (app targets),
  and maintains persistent scrolls (docs) across all expeditions.
  Use this skill when working on any feature development in a mono-repo
  with multiple app targets. Triggers: /new-quest, /start-quest, /embark,
  /make-camp, /complete-quest, /quest-log, /quest-help, /change-quest,
  /counsel-quest, /counsel-plan, /ask-sages, /hunt-bugs, /set-bounty,
  /install-quest-system, /summon-witch-doctor.
version: 2.1.0
---

# Quest System — Skill Definition

Expedition memory and workflow system: every feature is a Quest, every work loop an
Expedition; five persistent scrolls carry all knowledge across conversations.

## Scroll structure (created per quest)

| Scroll | Purpose |
|---|---|
| `WORLD_MAP.md` | Codebase structure, navigation, key files |
| `STRATEGY_SCROLL.md` | Battle plan, oaths, fallen strategies, status |
| `ADVENTURE_JOURNAL.md` | Append-only expedition history |
| `TOME_OF_DANGERS.md` | Technical constraints, dangers, workarounds |
| `ADVENTURERS_HANDBOOK.md` | Guide explaining what belongs in each scroll |

### Planned Expeditions convention

`STRATEGY_SCROLL.md` carries a `## Planned Expeditions` checklist — the upcoming-work
tracker:

```
- [ ] surface layer      ← seeded by /counsel-quest (planned)
- [>] surface layer      ← /embark flips it on approval (active)
- [x] surface layer      ← /make-camp flips it at camp (done), then appends the next - [ ]
```

Markers map to status: `[x]`→done, `[>]`→active, `[ ]` (or anything else)
→planned. `/counsel-quest` seeds one `- [ ]` per battle-plan phase (reconciles on
MID/PIVOT). The block lives in the top-level scroll and stays in the index on split
(status readers parse the index only). All maintenance is a scroll-body edit — never
`lifecycle.log`.

## Commands provided

Marketplace-plugin installs get these as native namespaced slash commands
(`/quest-system:new-quest`, tab-completable); repo-copy installs get the bare
forms via `/install-quest-system`. Both forms resolve to the same command files.

| Command | When to use |
|---|---|
| `/set-bounty` | Autonomous party delivers a goal end-to-end, gated for sign-off |
| `/new-quest` | Scaffold a brand new quest (folder + scrolls) |
| `/start-quest` | Activate a quest and get guided to next step |
| `/counsel-quest` | Plan/replan/pivot the active quest — modes PRE, MID, PIVOT |
| `/embark` | Start an expedition |
| `/make-camp` | End an expedition and update all scrolls |
| `/quest-log` | Quick status check |
| `/change-quest` | Save state and switch quest or realm |
| `/summon-witch-doctor` | Diagnose scroll health; gated repair |
| `/complete-quest` | Distill to project files, archive quest, clear active quest |
| `/quest-help` | Cheat-sheet of every command and its `--` flags |
| `/ask-sages` | Three sages (codebase, web, reason) counsel a decision; `--critique` |
| `/counsel-plan` | Review a `plan.md` — READY/REVISE verdict; `--critique` lens panel |
| `/counsel-prompt` | Rewrite a rough prompt into a sharp one |
| `/hunt-bugs` | Scouts fan out, reviewers verify, ranked findings; `--fix` gates applying |
| `/setup-obsidian` | Opt in to `.ai-context/` as an Obsidian vault |
| `/open-obsidian` | Open the vault in Obsidian; `--graph` hints the graph view |

## Key concepts

**Quest** — a feature/epic. **Realm** — the app target in scope. **Expedition** —
one work loop (`/embark` → implementation → `/make-camp`). **Conquered** — done.
**Cursed** — blocked/uncertain. **Oath** — a resolved decision. **Fallen strategy**
— a rejected approach (recorded to prevent re-proposing). **Unsolved riddle** — an
open verification item.

## Active-quest selection (multi-chat)

Several chats can run in the SAME folder on different quests; there is no per-chat id
on disk, so a chat identifies its quest by NAMING it, not by trusting a shared file.

### `.claude/active-quest.txt` (the default pointer)

Located at `.claude/active-quest.txt`
Line 1: repo-relative path to the quest scrolls folder, no trailing slash
  (e.g. `.ai-context/quests/scan-alignment-floor-annotation`)
Line 2: realm in scope (e.g. `WeScanX`)

`{quest-name}` is the basename of line 1. Writers (`/new-quest`, `/start-quest`,
`/change-quest`) normalize any user-supplied path to this form. A single default
pointer — reliable with one chat, but any chat's `/start-quest` / `/change-quest`
overwrites it, so it is **untrusted** in multi-chat use.

### Resolution order (every command)

1. `--quest <name-or-path>` argument → use that quest (realm from `STRATEGY_SCROLL.md`
   frontmatter unless `--realm` is also passed). The argument always wins.
2. Otherwise → read `.claude/active-quest.txt` (the default pointer).
3. Otherwise → "No active quest. Run /new-quest or pass --quest."

The chat's quest is carried in-conversation: once embarked on quest X, resolve every
subsequent command against X (supplying it as `--quest`) — never silently trust the
shared pointer.

### Mutating commands confirm first

`/make-camp` and `/complete-quest` write scrolls. Before any write they MUST
echo the resolved `quest + realm` and confirm (or require an explicit `--quest`) —
the backstop against a bare command acting on a pointer another chat just repointed.

## Concurrency (same-folder safety)

Races only exist when multiple chats share one folder. The rules:

- **Single-writer-per-quest.** A quest's scrolls are written by one chat at a time.
- **Project-global files use an advisory lock.** `DANGER_REGISTRY.md` /
  `DECISIONS_LOG.md` (mutated by any `/complete-quest`): wrap each read-modify-write
  in a `mkdir` lock, one bash invocation that acquires, re-reads, appends, releases:
  ```bash
  L=.claude/locks/danger-registry.lock
  for i in $(seq 1 50); do mkdir "$L" 2>/dev/null && break || sleep 0.1; done
  trap 'rmdir "$L" 2>/dev/null' EXIT
  # re-read the file HERE, append the new rows, write it back
  ```
  `mkdir` is the only atomic portable primitive (macOS has no `flock`);
  `[ -e ] && touch` is a TOCTOU race — never use it. Advisory lock: a stale lock is
  reported and offered for manual `rmdir`, never silently broken.
- **Per-quest scroll writes use the cross-tool-call quest lock.** Two chats CAN
  target the same quest (e.g. concurrent `/make-camp`). Scroll mutation happens via
  `Edit`, not one `printf >>`, so the lock spans tool calls in THREE phases:

  1. **ACQUIRE** — one bash invocation, mkdir retry loop, **no `trap` release** (a
     trap would fire when this bash process exits, before the Edits run):
     ```bash
     L=".claude/locks/quest-$(printf '%s' "{quest-basename}" | tr ' /' '--').lock"
     mkdir -p .claude/locks
     for i in $(seq 1 150); do mkdir "$L" 2>/dev/null && break || sleep 0.2; done
     [ -d "$L" ] || { echo "quest {quest-basename} busy (lock held)"; exit 1; }
     ```
     Not acquired within budget (~30s) → report busy and STOP — never force-break.
  2. **MUTATE** — the LLM performs the scroll Edits (split-aware: write to the
     `dangers/` / `strategy/` / `journal/` subfile if it exists, else the index).
  3. **RELEASE** — explicit bash `rmdir "$L"` (recompute `$L` from the SAME basename,
     never a moved/archived path), on **every** exit path — normal completion AND any
     failed/aborted Edit; on a failed Edit, RELEASE and STOP.

  `{quest-basename}` is the quest folder's BASENAME, never the full path — all
  writers compute the identical key. **Invariant:** at most ONE per-quest lock held
  at a time → no lock-ordering cycle → no deadlock. A timed-out waiter STOPs safely,
  never proceeds unguarded.
- **The lifecycle log is append-only.** Append `state` lines to
  `.claude/quest-xp/lifecycle.log` via shell append (`printf '%s\n' >>`) ONLY —
  never Edit/Write (a whole-file rewrite reintroduces the lost-update race).
- `.claude/locks/` is gitignored.

## Council cross-critique (shared)

An adversarial round council commands (`/ask-sages`, `/counsel-quest`, the
`/embark --counsel` loop) run AFTER independent advisors return, BEFORE chairman
synthesis. **Opt-in**: only via `--critique` (or the command's documented prompt);
flag absent → default output byte-for-byte unchanged.

**Orchestration lives in the command** (main session). fp-* agents and inline sages
are leaves — no Agent/Task tool, cannot spawn. This section is the contract; the
literal `Agent` call lives in the consuming command.

**Critic contract.** Spawn exactly ONE critic (`Agent`,
`subagent_type: general-purpose`) with every round-1 output verbatim. It gets no
research tools and does NOT re-do the work — it only judges. Terse report:
- **Conflicts** — where advisors directly contradict each other, and who is right.
- **Blind spots** — a claim a majority assumed but none verified.
- **What all missed** — a risk or option absent from every round-1 output.
- **Trust map** — which advisor to believe on which point.

**Chairman fold.** Synthesize as normal with the critic's report as extra input:
resolve flagged conflicts explicitly, surface tensions. The section carrying the
critic's output is CONDITIONALLY EMITTED — present only when `--critique` ran,
fully omitted (not blank) otherwise.

**Lens rotation (loop consumers, e.g. `/embark --counsel N`).** Rotate the single
reviewer's lens each round — base rubric, contrarian ("what fails?"), executor
("Monday-morning gaps?"), cycle. Rubric unchanged; only prompt emphasis rotates.
Consumers MUST: (a) track the prior blocking count PER LENS and trip the
non-convergence guard only when the SAME lens twice fails to reduce its own count (a
new lens legitimately raises the count), keeping an absolute round cap as backstop;
(b) know rotation is multi-round — N=1 equals an unrotated review, benefit needs
N>=2 (full cycle N>=3; recommend `--counsel 3`), and never silently floor N.

**Panel variant (one-shot consumers, e.g. `/counsel-plan --critique`).** Run the SAME
reviewer under each lens IN PARALLEL (base / contrarian / executor), fold with one
`general-purpose` critic that MUST emit a verdict line. Fold rule: `READY` iff every
lens returned zero blockers; folded blocking/minor = the DEDUP'D UNION count across
lenses; a missing/unparseable lens verdict = REVISE (blocking >= 1), never dropped.

## Loop architecture doctrine (shared)

The strong model runs in the main session as ORCHESTRATOR — decompose, delegate to
cheaper WORKER subagents, synthesize. Dev-facing; RUNTIME tiers are set in agent
frontmatter (see table note).

**The 8 rules.**
1. **Orchestrate, don't execute** — workers do bounded legwork and return summaries/references, not raw dumps.
2. **Tier by task, not by habit** — strong model only for judgment/synthesis.
3. **Scale effort to complexity** — trivial → 1 worker; comparison → 2-4; broad → more; fan out only for parallel high-value work.
4. **Isolate context** — each worker gets its own window; the orchestrator holds distilled returns (the token-budget mechanism).
5. **Autonomous on reversible, gate on irreversible** — proceed silently on reads/searches/scroll edits/fan-out.
6. **One crisp go/no-go, with pros/cons — never babysit** — a gate is a decision request, not a status update (format below).
7. **Every loop declares its exit up front** — success (verdict/tests pass), failure (retry limit), budget (max iterations + token ceiling).
8. **Converge on a verdict token** (`READY|REVISE`, `PASS|FAIL`) so loops terminate deterministically.

**Model-tier table (dev-facing mirror — runtime source of truth is each agent's
`model:` frontmatter key; keep in sync with `agents/fp-*.md`).**

| Worker | Tier | Why |
|---|---|---|
| fp-code-explorer | sonnet | High-volume comprehension |
| fp-code-architect | opus | Design cascades downstream — reasoning-bound |
| fp-code-reviewer | opus | Subtle correctness bugs |
| fp-security-reviewer | opus | Costly false-negatives; **sonnet FLOOR** — never below |
| fp-performance-reviewer | sonnet | Mostly pattern-matchable |
| fp-doc-reviewer | haiku | Mechanical cross-referencing |
| fp-plan-reviewer | sonnet | `READY\|REVISE` verdict — loop-terminating judgment |
| fp-frontend-designer, fp-swiftui-designer | sonnet | Production UI generation |
| bug-hunt scouts, summon-seer, danger/doc extraction (command-spawned general-purpose) | haiku | Cheap fan-out; orchestrator curates |
| goal-evaluator (command-spawned) | strong | IS the gate reasoning — must not be cheap |

Orchestrator is always the session model. Workers set their tier in their own
frontmatter via model aliases (`sonnet`/`haiku`), never dated model IDs.
Command-spawned general-purpose workers pass `model` on the `Agent` call.

**The escalation contract (replaces babysitting).**
```
PROCEED autonomously when ALL hold:
  - reversible (git-recoverable, or a scroll edit)
  - inside the approved plan / budget
  - no destructive fs / network / external side effect
STOP and gate when ANY holds:
  - irreversible or high-blast-radius (delete, archive, branch/direction lock, external effect)
  - a CONFIRMED high-severity finding
  - budget/iteration ceiling hit without convergence
  - genuine ambiguity a wrong guess would make expensive to undo

GATE FORMAT (required):
  DECISION: <one line>
  RECOMMENDATION: <Option N> — <one-sentence why>
  ┌ Option A  PRO: … | CON: … | reversible? Y/N
  └ Option B  PRO: … | CON: … | reversible? Y/N
  ASK: "Proceed with <rec>? (y / pick other / abort)"
```
Orchestration lives in the command (main session) — fp-* workers are leaves and
cannot spawn, exactly as the Council cross-critique contract above.

## Development habits (applied within expeditions)

Behaviors, not commands. `/embark` names which habits are in scope; `/make-camp`
honors the review habit before recording. Each obeys the escalation contract:
tests/reviews are reversible, run autonomously; gate only on CONFIRMED high-severity.

- **Test-first (TDD).** Failing test → minimum code → refactor, commit per green
  cycle. Skip for exploratory spikes / pure config.
- **Regression-first bug fixing.** Reproduce with a FAILING test, then fix — never
  blind. Emergency: smallest change on `hotfix/`, critical tests, `[HOTFIX]` PR;
  escalate to the full path if the fix turns non-trivial.
- **Cover new/changed code.** Happy/edge/error/concurrency paths that actually fail
  when the code breaks. Mock only at system boundaries; one behavior per test.
- **Review before camp.** Delegate changed files to `fp-code-reviewer`
  (+ `fp-security-reviewer` on auth/input/network/secret/fs, `fp-performance-reviewer`
  on hot paths, `fp-doc-reviewer` on docs). CONFIRMED findings go into
  `TOME_OF_DANGERS`. This IS make-camp's Council Review step.

## Sacred laws (enforced by all commands)

- Never rely on conversation history for SCROLL CONTENT — always write to the scrolls
  (the chat's *active quest* is the one exception: carried in-conversation, per Active-quest selection)
- TOME_OF_DANGERS.md must be updated the moment a new danger is found
- ADVENTURE_JOURNAL.md is append-only — history is never rewritten
- Work is always scoped to the active realm only
- No code is written until the commander approves the battle plan
- Project-global state files are append-only or lock-guarded — never a bare rewrite

## Split rules

Scrolls beyond 500 lines are split into subfiles to keep context loading efficient.

### Split targets

| Scroll | Split folder | Split by |
|---|---|---|
| TOME_OF_DANGERS.md | dangers/ | category: rendering, memory, swift-concurrency, ui, file-io |
| STRATEGY_SCROLL.md | strategy/ | one file per major module |
| ADVENTURE_JOURNAL.md | journal/ | one file per month: YYYY-MM.md |
| WORLD_MAP.md | map/ | area: navigation, data-flow, key-files |
| ADVENTURERS_HANDBOOK.md | never splits | — |

### Index format after split

The main scroll becomes a lightweight index:
- Keep YAML frontmatter (update `last-updated`)
- Keep summary / overview (~50 lines max)
- Add a `## Content Index` table pointing to subfiles
- STRATEGY_SCROLL: always keep battle status table in the index
- ADVENTURE_JOURNAL: keep last 3 entries in the index
- TOME_OF_DANGERS: keep 3 most critical dangers as a fast-read summary

### Announce on split

"📜 {filename} has grown beyond 500 lines. Splitting into subfiles..."

## Project-level files

Two small files at `.ai-context/` persist across all quests: created by
`/complete-quest`, loaded by `/embark` FIRST (quest scrolls second). They hold only
lessons that survived — not trial-and-error history.

| File | Purpose |
|---|---|
| `DANGER_REGISTRY.md` | Distilled dangers from all completed quests |
| `DECISIONS_LOG.md` | Locked architectural decisions from all completed quests |

### DANGER_REGISTRY.md template
---
type: danger-registry
last-updated: {date}
---
# Project Danger Registry

Distilled from completed quests. Read before proposing any strategy.
Each entry survived at least one real quest — do not ignore.

## Rendering Dangers
| Danger | Impact | Remedy | Quest |
|---|---|---|---|

## Memory Dangers
| Danger | Impact | Remedy | Quest |
|---|---|---|---|

## Concurrency Dangers
| Danger | Impact | Remedy | Quest |
|---|---|---|---|

## Architecture Dangers
| Danger | Impact | Remedy | Quest |
|---|---|---|---|

### DECISIONS_LOG.md template
---
type: decisions-log
last-updated: {date}
---
# Project Decisions Log

Architectural decisions locked during completed quests.
These are oaths — do not re-open without the commander's explicit order.

| Decision | Reason | Quest | Date |
|---|---|---|---|

## /summon-witch-doctor — Scroll health check

Read-only diagnosis of the active quest's scrolls (missing files/sections/frontmatter,
split state, legacy terminology), with a gated repair pass. Full spec, checks, output
format, and repair templates live in `commands/summon-witch-doctor.md`.

## .ai-context/ — portable AI context

All quest state and project memory lives here. Committed to git so the whole team benefits.

```
.ai-context/
  DANGER_REGISTRY.md              ← project-wide dangers (all completed quests)
  DECISIONS_LOG.md                ← project-wide decisions (all completed quests)
  README.md                       ← how to use with each AI tool
  quests/{quest-name}/            ← one folder per quest (5 scrolls + context.md)
    context.md                    ← merged fast-read: paste into any AI tool
    WORLD_MAP.md
    STRATEGY_SCROLL.md
    ADVENTURE_JOURNAL.md
    TOME_OF_DANGERS.md
    ADVENTURERS_HANDBOOK.md
  archived/{quest-name}/          ← completed quests (moved by /complete-quest)
```

**context.md** (updated by `/embark` and `/make-camp`) is the one file to paste into
any AI tool to resume work; `README.md` is created once by `/new-quest`.

### context.md format
```
# Quest Context: {quest-name}
Realm: {realm}  |  Last updated: {date}
*Paste this file into any AI tool to load the active quest state.*

## Battle Status
{battle status table from STRATEGY_SCROLL}

## Open Riddles
{open riddles from STRATEGY_SCROLL, or "None"}

## Road Ahead
{last expedition's "The Road Ahead" entry from ADVENTURE_JOURNAL}

## Known Dangers
### Quest Dangers
{fast-read summary from TOME_OF_DANGERS index — top 5}

### Project Dangers
{top 5 rows from DANGER_REGISTRY.md if exists, else "(none yet — complete a quest first)"}

## Locked Decisions
### Quest Decisions
{oaths from STRATEGY_SCROLL Oaths Sworn section}

### Project Decisions
{rows from DECISIONS_LOG.md if exists, else "(none yet — complete a quest first)"}
```

## Transparency

How to see what the quest system — and Claude — is doing at any moment:

- **Todo list (live).** `/embark` seeds the session todo list (TodoWrite) from the
  scroll's `## Planned Expeditions`; `/make-camp` and `/complete-quest` reconcile
  it back to the checklist's `- [x]`/`- [>]` markers. Press **Ctrl+T** to toggle
  the live checklist in the terminal.
- **Background work.** `/tasks` lists running shells and subagents; `/workflows`
  drills into multi-phase runs (council reviews, bounties) — phases, agents,
  token usage, pause/stop.
- **Surface caveat.** `/tasks`, `/workflows`, and Ctrl+T are terminal-CLI views.
  The VSCode extension exposes only a subset of commands (its task panel below
  the input shows a one-line progress summary); for full visibility there, run
  `claude` in the integrated terminal, or use the desktop app's Background
  tasks panel via Remote Control. The todo list is visible in all surfaces.
- **Persistent phase record.** `.claude/quest-xp/lifecycle.log` (append-only
  `date|state|quest|phase=` lines, backstopped by `hooks/quest-lifecycle-bump.sh`)
  plus `.claude/active-quest.txt` are the durable cross-session record of which
  quest is active and what phase it is in — and the seed data for a future
  graph-based tracking system. Both are plain files, so Cowork can read quest
  status directly from a granted project folder.

## Lifecycle log (persistent phase record)

`.claude/quest-xp/lifecycle.log` is the append-only phase record — the durable
cross-session trail of quest phases, and the seed data for a future graph-based
tracking system. Each lifecycle command appends ONE `state` line via shell append
(`printf '%s\n' >> .claude/quest-xp/lifecycle.log`) the moment a quest changes phase:

```
{YYYY-MM-DD}|state|{quest-name}|phase={planning|ready|embarked|at-camp}
```

| phase | written by |
|---|---|
| `planning` | `/new-quest` (fresh scaffold, no plan yet) |
| `ready` | `/counsel-quest` PRE/PIVOT once the plan is locked (`planning` if open riddles remain) |
| `embarked` | `/embark` after the commander approves the plan; also the `quest-lifecycle-bump.sh` PostToolUse hook on the first real code edit |
| `at-camp` | `/make-camp` |

The `quest-lifecycle-bump.sh` hook (PostToolUse on `Edit|Write`) is the deterministic
backstop for `embarked`: it records `phase=embarked` on the first edit to a real
project file (edits under `.ai-context/` or `.claude/` never bump); idempotent —
appends only when the last recorded phase is not already `embarked`. Phase-record
readers take the LAST `state` line for the active quest and trust it over scroll
inference. `/complete-quest` and `/change-quest` write no `state` line — they update
`.claude/active-quest.txt`, which phase-record readers consult directly.

## Obsidian integration (opt-in)

`.ai-context/` can open as an Obsidian vault (Bases dashboards + graph via `related:`
quoted-wikilink frontmatter — no `[[brackets]]` in prose, scrolls stay
GitHub-portable). Nothing changes until `/setup-obsidian` drops the marker
`.ai-context/.obsidian-enabled`; once opted in, `make-camp`/`complete-quest` emit
`related:` on scrolls they touch (gated on the marker). `/open-obsidian` opens the
vault from the CLI. Full spec: `commands/setup-obsidian.md` / `commands/open-obsidian.md`.

## Installation

Installing the `quest-system` plugin from the finpack-claude marketplace is enough —
its commands register natively as `/quest-system:<command>`. For repo-copy setups
(no plugin manager), run `/install-quest-system` once per project to copy the bare
`/<command>` forms into `.claude/commands/`.

## Scroll templates

Canonical scroll templates live in `commands/new-quest.md` (repair copies in
`commands/summon-witch-doctor.md`) — do not duplicate them here. Every scroll,
however created or repaired, MUST keep these parsed anchors:

- Frontmatter keys on every scroll: `quest`, `realm`, `scroll`, `last-updated`
- ADVENTURE_JOURNAL entries: `## Expedition [DATE]` with `### Conquered`,
  `### Oaths Sworn`, `### Cursed / Uncertain`, `### The Road Ahead`
- STRATEGY_SCROLL: `## Battle Status`, `## Open Riddles`, `## Planned Expeditions`
  (markers per the Planned Expeditions convention above)
- Split indexes: `## Content Index`

## Changelog

### 2.0.0 — XP/gamification removed (migration note)

BREAKING: `/quest-xp` and `/init-xp` are removed, along with the EXP formula,
levels, badges, `events.log`, `profile.md`, `agents.log`, and `quest-history.md`.
The lifecycle phase record is KEPT.

`.claude/quest-xp/` in consumer projects is NOT inert: `hooks/quest-lifecycle-bump.sh`
hardcodes `.claude/quest-xp/lifecycle.log`, so that directory and file stay live —
never delete them. `/update-quest-system` OFFERS (never auto-deletes) a cleanup
scoped to the dead files only — `events.log`, `profile.md`, `agents.log`,
`quest-history.md` — and additionally offers to delete the retired consumer hook
`.claude/hooks/quest-agent-trace.sh` and strip its PostToolUse(`Agent|Task`)
registration from `.claude/settings.json` (the hook is the live writer that would
otherwise recreate `agents.log` on the next agent call). The directory itself and
`lifecycle.log` are never touched.
