---
name: quest-system
description: >
  RPG-themed epic and expedition management system for Claude Code.
  Tracks quests (features/epics), expeditions (work loops), realms (app targets),
  and maintains persistent scrolls (docs) across all expeditions.
  Use this skill when working on any feature development in a mono-repo
  with multiple app targets. Triggers: /new-quest, /start-quest, /embark,
  /make-camp, /complete-quest, /quest-log, /quest-xp, /quest-help, /change-quest,
  /counsel-quest, /install-quest-system, /summon-witch-doctor.
version: 1.29.0
---

# Quest System — Skill Definition

## What this skill does

Provides a complete expedition memory and workflow system for feature development.
Every feature is a Quest. Every work loop is an Expedition.
Five persistent scrolls track all knowledge across expeditions so Claude Code
never loses context between conversations.

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
tracker the quest-dashboard renders. Lifecycle of one item:

```
- [ ] surface layer      ← seeded by /counsel-quest (planned)
- [>] surface layer      ← /embark flips it on approval (active)
- [x] surface layer      ← /make-camp flips it at camp (done), then appends the next - [ ]
```

Markers map to dashboard status: `[x]`→done, `[>]`→active, `[ ]` (or anything else)
→planned. Maintained by: `/counsel-quest` (seeds one `- [ ]` per battle-plan phase;
reconciles on MID/PIVOT), `/embark` (next `- [ ]`→`- [>]`, else appends `- [>]`),
`/make-camp` (`- [>]`→`- [x]` + appends the next `- [ ]`). The block lives in the
top-level scroll and is kept in the index on split (the dashboard parses the index
only). All maintenance is a scroll-body edit — never `events.log`/`lifecycle.log`.

## Commands provided (installed by /install-quest-system)

| Command | When to use |
|---|---|
| `/campaign` | Orchestrate a whole problem end to end: clarify what is ambiguous, route to a quest, run the embark/make-camp loop applying the development habits, record decisions — until the goals are met |
| `/new-quest` | Scaffold a brand new quest (folder + scrolls) |
| `/start-quest` | Activate a quest and get guided to next step |
| `/counsel-quest` | Plan (or replan/pivot) the active quest — 3 modes: PRE, MID, PIVOT |
| `/embark` | Start an expedition |
| `/make-camp` | End an expedition and update all scrolls |
| `/quest-log` | Quick status check without opening a full expedition |
| `/change-quest` | Save state and switch to a different quest or realm |
| `/summon-witch-doctor` | Diagnose scroll health: missing files, missing sections, split issues, and legacy terminology migration needs |
| `/complete-quest` | Distill key knowledge to project-level files, archive quest folder, clear active quest |
| `/quest-xp` | Show adventurer profile: level, EXP, progress bar, badges unlocked and locked |
| `/quest-help` | Cheat-sheet of every command and its `--` flags (the VS Code arg-hint is not reliable); pass a command name to show just one |
| `/side-quest` | Capture a small thing found mid-quest (UI bug, font tweak) in one step — does NOT switch your active quest |
| `/close-side-quest` | Close a side-quest, distilling its dangers/decisions up to its parent (or `--promote` it to a full quest) |
| `/ask-sages` | Summon three sages (codebase, web, reason) to counsel a decision; `--critique` adds a cross-examination round |
| `/counsel-plan` | Review a `plan.md` against quest context — paste-back feedback ending in a READY/REVISE verdict; `--critique` runs a lens panel |
| `/counsel-prompt` | Rewrite a rough prompt into a sharp, well-contextualized one |
| `/init-xp` | Bootstrap the adventurer XP profile for an existing project, without starting a new quest |
| `/hunt-bugs` | Hunt real bugs: Haiku scouts fan out, Sonnet reviewers adversarially verify each finding, ranked by severity with a fix plan; `--fix` gates applying them |
| `/setup-obsidian` | Opt in to viewing `.ai-context/` as an Obsidian vault: writes `.obsidian/` config + Bases/Dataview dashboards + `related:` graph links over existing frontmatter; gated by an opt-in marker, decliners unchanged |
| `/open-obsidian` | Open this project's `.ai-context/` vault in Obsidian from the CLI (registers it headlessly first if needed); `--graph` hints the graph view |

## Key concepts

- **Quest** — a feature or epic (e.g. "scan-alignment-floor-annotation")
- **Side-quest** — a small thing found along the way (UI bug, font size, layout), usually independent but sometimes related to the main quest. Cheap to capture (one scroll, no counsel), worked in a separate chat, distilled UP to its parent on close.
- **Realm** — the app target in scope (e.g. "WeScanX")
- **Expedition** — a single focused work loop (`/embark` -> implementation -> `/make-camp`)
- **Conquered** — completed step
- **Cursed** — blocked or uncertain
- **Oath** — a resolved decision
- **Fallen strategy** — a rejected approach (must be recorded to prevent re-proposing)
- **Unsolved riddle** — an open verification item

## Active-quest selection (multi-chat)

You can run several Claude chats in the **same folder** at once, each working a
different quest. There is no per-chat id on disk, so a chat identifies its quest
by **naming it**, not by trusting a shared file.

### `.claude/active-quest.txt` (the default pointer)

Located at `.claude/active-quest.txt`
Line 1: repo-relative path to the quest scrolls folder, no trailing slash
  (e.g. `.ai-context/quests/scan-alignment-floor-annotation`)
Line 2: realm in scope (e.g. `WeScanX`)

`{quest-name}` is the basename of line 1 (the last path segment). Commands that
write this file (`/new-quest`, `/start-quest`, `/change-quest`) normalize any
user-supplied path to this form — relative, no trailing slash — so basename
extraction is unambiguous.

This file is a **single default pointer**. It is reliable when only one chat is
active. When multiple chats run in the same folder it is shared and any chat's
`/start-quest` / `/change-quest` overwrites it, so it is **untrusted** in
multi-chat use.

### Resolution order (every command)

1. If the command was given a `--quest <name-or-path>` argument → use that quest
   (read its realm from `STRATEGY_SCROLL.md` frontmatter unless `--realm` is also
   passed). The argument always wins.
2. Otherwise → read `.claude/active-quest.txt` (the default pointer).
3. Otherwise → "No active quest. Run /new-quest or pass --quest."

The assistant carries the chat's quest in-conversation: once a chat has embarked
on quest X, it resolves every subsequent command against X (supplying it as
`--quest`), and does NOT silently trust the shared pointer.

### Mutating commands confirm first

`/make-camp`, `/complete-quest`, and `/close-side-quest` write scrolls and XP.
Before any write they MUST echo the resolved `quest + realm` and confirm (or
require an explicit `--quest`). This is the backstop against a bare command
acting on a pointer another chat has just repointed.

### Worked examples

- **Single chat:** `/embark` → no arg → reads the pointer → quest X. Normal.
- **Two chats, same folder:** chat A is on `main-feature`, chat B runs
  `/start-quest font-fix` (pointer now = font-fix). Chat A's next `/make-camp`
  resolves `--quest main-feature` from its own conversation (NOT the pointer),
  echoes "camping main-feature / realm app — confirm?", and writes the right
  scrolls. Chat B works font-fix the same way.
- **Explicit override:** `/embark --quest onboarding --realm app` ignores the
  pointer entirely.

> Bonus: if you instead use separate git worktrees, `.claude/` is gitignored and
> not shared between them, so each worktree is isolated for free — but that is
> not required; same-folder multi-chat is the supported model.

## Concurrency (same-folder safety)

Races only exist when multiple chats share one folder. The rules:

- **Single-writer-per-quest.** A quest folder's scrolls are written by one chat
  at a time (each chat is on a different quest). Two chats on the *same* quest is
  the user's choice and out of scope.
- **Project-global files use an advisory lock.** `DANGER_REGISTRY.md` and
  `DECISIONS_LOG.md` are mutated by any `/complete-quest`. Wrap each
  read-modify-write in a `mkdir`-based lock, as a **single bash invocation** that
  acquires, re-reads, appends, and releases — releasing on every exit path:
  ```bash
  L=.claude/locks/danger-registry.lock
  for i in $(seq 1 50); do mkdir "$L" 2>/dev/null && break || sleep 0.1; done
  trap 'rmdir "$L" 2>/dev/null' EXIT
  # re-read the file HERE, append the new rows, write it back
  ```
  `mkdir` is the only atomic, portable primitive (macOS has no `flock`).
  `[ -e ] && touch` is a TOCTOU race — never use it. The lock is **advisory /
  best-effort** (LLM-executed); a stale lock is reported and offered for manual
  `rmdir`, never silently broken.
- **Per-quest scroll writes use the cross-tool-call quest lock.** "Single-writer-
  per-quest" holds for the OWNING chat, but a `/close-side-quest` in another chat
  distills UP into its parent's `TOME_OF_DANGERS.md`, `STRATEGY_SCROLL.md`, and
  `ADVENTURE_JOURNAL.md` — a second writer to the same scrolls. Any command that
  mutates a quest's scrolls from a possibly-concurrent context wraps those writes
  in a per-quest lock. This differs from the registry lock above: the mutation is
  done by the LLM via `Edit` (a mid-file table/section insert), which CANNOT live
  inside one `printf >>`, so the lock spans separate tool calls in THREE phases:

  1. **ACQUIRE** — one bash invocation, mkdir retry loop, **no `trap` release**
     (a trap fires when this bash process exits — i.e. before the Edits run —
     and would release the lock immediately). Budget longer than the registry
     lock's, to outlast a 500-line split rewrite:
     ```bash
     L=".claude/locks/quest-$(printf '%s' "{quest-basename}" | tr ' /' '--').lock"
     mkdir -p .claude/locks
     for i in $(seq 1 150); do mkdir "$L" 2>/dev/null && break || sleep 0.2; done
     [ -d "$L" ] || { echo "quest {quest-basename} busy (lock held)"; exit 1; }
     ```
     If not acquired within the budget (~30s): report the quest is busy and STOP —
     never force-break (stale-lock policy as above: report, offer manual `rmdir`).
  2. **MUTATE** — the LLM performs the scroll Edits (split-aware: write to the
     `dangers/` / `strategy/` / `journal/` subfile if the split subfolder exists,
     else the index section).
  3. **RELEASE** — an explicit bash `rmdir "$L"` (recompute `$L` from the SAME
     basename, never from a moved/archived path). RULE: release runs on **every**
     exit path — normal completion AND any failed/aborted Edit. If any Edit in
     MUTATE fails, immediately RELEASE and STOP (do not leave a half-write).

  `{quest-basename}` is the quest folder's BASENAME (last path segment), never the
  full path. All writers to the same quest compute the identical key. **Invariant:**
  a command holds AT MOST ONE per-quest lock at a time → no lock-ordering cycle →
  no deadlock. A waiter that times out STOPs safely (e.g. a side-quest stays OPEN),
  it never proceeds unguarded. (LLM-executed: the release-on-failure protocol is
  verified by review, not by an automated test.)
- **XP is append-only.** Append XP events to `.claude/quest-xp/events.log` with a
  shell append (`printf '%s\n' >> events.log`) ONLY — never via Edit/Write (a
  whole-file rewrite reintroduces the lost-update race). See the XP section.
- `.claude/locks/` is gitignored.

## Council cross-critique (shared)

A reusable round that council-style commands (`/ask-sages`, `/counsel-quest`, and the
`/embark --counsel` plan loop) can run AFTER their independent advisors return but BEFORE
the chairman synthesis. It adapts the LLM-Council peer-review idea to our grounded
councils: independent voices are good, but they never challenge EACH OTHER before the
synthesis — so a confident-but-wrong voice survives, and tensions between voices get
smoothed over instead of surfaced. This round adds the missing adversarial pass.

**Opt-in.** Never runs by default. A command enables it only when invoked with the
`--critique` flag (or its own documented prompt). With the flag absent, the command's
default output is byte-for-byte unchanged — the round adds nothing to the fast path.

**Orchestration lives in the command.** fp-* agents and the inline sages are leaves —
they have no Agent/Task tool and cannot spawn anything. Only the command (running in the
main session) can launch the critic. This section DOCUMENTS the contract; the literal
`Agent` tool call lives in the consuming command, never here.

**The critic contract.** When `--critique` is set, after all round-1 advisors return the
command spawns exactly ONE critic via the `Agent` tool with `subagent_type: general-purpose`,
passing it every round-1 output verbatim. The critic does NOT re-do the advisors' work and
is given no tools to re-research — it only judges what was said. It reports, terse:
- **Conflicts** — where the advisors directly contradict each other, and who is right.
- **Blind spots** — a claim a majority assumed but none verified.
- **What all missed** — a risk or option absent from every round-1 output.
- **Trust map** — which advisor to believe on which point.

**Chairman fold.** The command then synthesizes as it normally would, but treats the
critic's report as an additional input: resolve flagged conflicts explicitly, and surface
the critic's tensions in the final output. The line/section that carries the critic's
output is CONDITIONALLY EMITTED — present only when `--critique` ran, fully omitted (not
blank) otherwise, so the default template is preserved exactly.

**Lens-rotation sub-pattern (for loop consumers).** A command that runs the SAME single
reviewer in a loop (e.g. `/embark --counsel N`) escapes local minima not by adding agents
but by ROTATING the reviewer's lens each round: round 1 the base rubric, round 2 a
contrarian lens ("what fails?"), round 3 an executor lens ("Monday-morning gaps?"), then
cycle. A single fixed lens is gradient descent on one rubric — it deepens a basin, never
leaves it; rotating the lens perturbs the loss axis so a different class of flaw surfaces
each round. The reviewer's underlying rubric is unchanged — only the emphasis passed in
the prompt rotates.

Two consequences a loop consumer MUST handle:
- **Per-lens convergence guard.** A non-convergence guard that bails when the blocking
  count fails to drop assumes a fixed lens. Under rotation a new lens legitimately raises
  the count, so track the prior blocking count PER LENS and trip the guard only when the
  SAME lens twice fails to reduce its own count (it is inert until a lens recurs). Keep an
  absolute round cap as the backstop.
- **Rotation is multi-round.** At N=1 only the base lens runs — a single pass has no
  iteration and no minimum to escape, so this is identical to an unrotated single review.
  The benefit needs N>=2 (and a full cycle N>=3); recommend `--counsel 3` when a local
  minimum is a real risk. Do not silently floor N — respect the caller's explicit cap.

**Panel variant (for one-shot consumers).** A command that does NOT loop (e.g.
`/counsel-plan --critique`) gets the same diversity in one shot: run the SAME reviewer
under each lens IN PARALLEL (base / contrarian / executor), then fold with a single
`general-purpose` critic. Unlike the prose-synthesis critic above, this fold critic MUST
emit a verdict line. Fold rule: `READY` iff every lens returned zero blockers; folded
blocking/minor = the count of the DEDUP'D UNION across lenses (an issue raised by two
lenses counts once); a lens whose verdict is missing or unparseable is treated as REVISE
(blocking >= 1), never silently dropped.

## Loop architecture doctrine (shared)

Design narrative for how commands orchestrate work. The strong model runs in the main
session as the ORCHESTRATOR; it decomposes, delegates to cheaper WORKER subagents, and
synthesizes. Grounded in the measured tradeoffs: token usage explains ~80% of agent
performance variance and a multi-agent run burns ~15x a plain chat's tokens, so an
Opus/Fable orchestrator with cheaper workers cuts cost 5-10x versus running the strong
model everywhere. This section is dev-facing; the RUNTIME tiers are set in agent
frontmatter (see the table note), because the install-script distribution does not ship
this file.

**The 8 rules.**
1. **Orchestrate, don't execute.** The main session does the judgment and the writing;
   workers do bounded, parallelizable legwork and return summaries/references, not raw dumps.
2. **Tier by task, not by habit.** Reserve the strong model for judgment/synthesis; push
   volume work to cheaper tiers.
3. **Scale effort to complexity.** Trivial → 1 worker; comparison → 2-4; broad → more. Fan
   out only when work is parallel and the value is high; otherwise stay single-agent.
4. **Isolate context.** Each worker gets its own window; the orchestrator holds only distilled
   returns. This is the token-budget mechanism, not an accident.
5. **Autonomous on reversible, gate on irreversible.** Only ~0.8% of real agent actions are
   irreversible — proceed silently on reversible steps (reads, searches, scroll edits, worker
   fan-out), stop only at high-blast-radius points.
6. **One crisp go/no-go, with pros/cons — never babysit.** A gate is a decision request, not a
   status update (format below).
7. **Every loop declares its exit before it starts.** Three termination conditions always:
   success (verdict/tests pass), failure (retry limit), budget (max iterations + token ceiling).
8. **Converge on a verdict token.** Reviewer/evaluator workers return a machine-checkable
   verdict (`READY|REVISE`, `PASS|FAIL`) so the orchestrator loop terminates deterministically.

**Model-tier table (dev-facing mirror — runtime source of truth is each agent's `model:`
frontmatter key; keep this table in sync with `agents/fp-*.md`).**

| Worker | Tier | Why |
|---|---|---|
| fp-code-explorer | sonnet | High-volume comprehension; the decisive pick stays with the orchestrator |
| fp-code-architect | opus | Design blueprint cascades into all downstream code — reasoning-bound |
| fp-code-reviewer | opus | Subtle correctness bugs are where opus beats sonnet |
| fp-security-reviewer | opus | Vulnerability false-negatives are costly; **sonnet FLOOR** — never below |
| fp-performance-reviewer | sonnet | Impact reasoning; bottlenecks are mostly pattern-matchable |
| fp-doc-reviewer | haiku | Docs-vs-code cross-referencing is mechanical |
| fp-plan-reviewer | sonnet | Returns a `READY\|REVISE` verdict — loop-terminating judgment |
| fp-frontend-designer, fp-swiftui-designer | sonnet | Production UI generation |
| bug-hunt scouts, session-audit, danger/doc extraction (command-spawned general-purpose) | haiku | Cheap fan-out to grep/trace/extract candidates; the orchestrator curates |
| goal-evaluator (command-spawned) | strong | This IS the gate reasoning — must not be cheap |

Orchestrator is always the session model (Opus 4.8 / Fable 5). Workers set their tier in
their own frontmatter via model aliases (`sonnet`/`haiku`), never dated model IDs, so they
auto-track the latest release without drift. Command-spawned general-purpose workers pass
`model` on the `Agent` tool call at the launch site.

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
Orchestration lives in the command (main session) — fp-* workers are leaves and cannot spawn,
exactly as the Council cross-critique contract above.

## Development habits (applied within expeditions)

Disciplines the orchestrator applies DURING an expedition — behaviors, not separate commands.
`/embark` names which habits are in scope for the expedition and folds them into the plan;
`/make-camp` honors the review habit before recording. Each habit obeys the escalation
contract above: tests and reviews are reversible, so run them autonomously; gate only on a
CONFIRMED high-severity finding.

- **Test-first (TDD).** For new behavior with a checkable contract: write a failing test →
  minimum code to pass → refactor, committing per green cycle. Use when the change has a spec;
  skip for exploratory spikes and pure config.
- **Regression-first bug fixing.** For a bug: reproduce it with a FAILING test first, then fix
  so the test locks it out — never fix blind. Emergency variant (production down): smallest
  correct change on a `hotfix/` branch, critical tests only, ship a `[HOTFIX]` PR; escalate to
  the full careful path the moment the fix turns out non-trivial.
- **Cover new/changed code.** After a feature lands, add tests across happy / edge / error /
  concurrency paths and verify they actually fail when the code breaks. Mock only at system
  boundaries (network, fs, clock, randomness); prefer real implementations. One behavior per test.
- **Review before camp.** Before `/make-camp` records the expedition, delegate the changed files
  to `fp-code-reviewer` (+ `fp-security-reviewer` if auth/input/network/secret/fs changed,
  `fp-performance-reviewer` on hot paths, `fp-doc-reviewer` if docs changed). CONFIRMED findings
  are inscribed into `TOME_OF_DANGERS`. This IS make-camp's Council Review step.

## Sacred laws (enforced by all commands)

- Never rely on conversation history for SCROLL CONTENT — always write to the scrolls
  (the chat's *active quest* is the one exception: it is carried in-conversation, per Active-quest selection)
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

After splitting, the main scroll becomes a lightweight index:
- Keep YAML frontmatter (update `last-updated`)
- Keep summary / overview (~50 lines max)
- Add a `## Content Index` table pointing to subfiles
- STRATEGY_SCROLL: always keep battle status table in the index
- ADVENTURE_JOURNAL: keep last 3 entries in the index
- TOME_OF_DANGERS: keep 3 most critical dangers as a fast-read summary

### Announce on split

When a split occurs, announce:
"📜 {filename} has grown beyond 500 lines. Splitting into subfiles..."

## Project-level files

Two lightweight files live at `.ai-context/` and persist across all quests.
Created by `/complete-quest`. Read by `/embark` before quest scrolls.

| File | Purpose |
|---|---|
| `DANGER_REGISTRY.md` | Distilled dangers from all completed quests — the project's institutional memory |
| `DECISIONS_LOG.md` | Locked architectural decisions from all completed quests |

These files are small by design. They contain only the lessons that survived — not trial-and-error history.
`/embark` loads them first. Quest scrolls load second.

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

Reads the active quest's scrolls and reports their health without modifying anything.

### What it checks

1. `.claude/active-quest.txt` — exists, 2 non-empty lines, quest folder path exists on disk
2. Each scroll — exists, non-empty, all required headings present
3. YAML frontmatter — each scroll must have `quest`, `realm`, `scroll`, `last-updated` keys
4. Split state — if a split subfolder (dangers/, journal/, strategy/, map/) exists, check: at least one subfile exists, each subfile is non-empty, index has a `## Content Index` section; if no subfolder but file is >500 lines, flag as SPLIT_NEEDED
5. Expedition migration readiness — detects legacy `session` / `phase` terminology in scroll content and flags `MIGRATION_NEEDED` when older wording should be migrated

### Output format

```
Quest: scan-alignment-floor-annotation  |  Realm: WeScanX

Scroll                   Status        Issues
-----------------------  ------------  ------
WORLD_MAP.md             OK
STRATEGY_SCROLL.md       WARN          Missing frontmatter: last-updated
ADVENTURE_JOURNAL.md     SPLIT         journal/ (3 subfiles, current: 2026-05.md)
TOME_OF_DANGERS.md       MISSING       File does not exist
ADVENTURERS_HANDBOOK.md  SPLIT_NEEDED  File is 612 lines — run /make-camp to trigger split

📁 Split scrolls: ADVENTURE_JOURNAL (journal/)
```

### Repair

If issues are found, `/summon-witch-doctor` asks: "Repair affected scrolls? (y/n)"
- **y**: recreates missing scrolls from the current template; for scrolls with missing sections only, appends the missing sections at the end with a `<!-- repaired by /summon-witch-doctor -->` marker; adds missing frontmatter keys to scrolls that have an incomplete frontmatter block; applies narrow terminology replacements for legacy `session` / `phase` entries.
- **n**: exits after reporting.

Never rewrites unrelated content. Never touches OK scrolls. Never merges or reorganizes split subfiles.

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
  side-quests/{slug}/             ← lightweight side-quests (one NOTE.md each)
    NOTE.md
  side-quests/done/{slug}/        ← closed side-quests (moved by /close-side-quest)
  archived/{quest-name}/          ← completed quests (moved by /complete-quest)
```

### Side-quest layout — `NOTE.md`

A side-quest is one file. Created by `/side-quest`, it does not disturb the
current chat's active quest. `parent` links it to the quest that was active when
it was spawned (or `none`). On `/close-side-quest` its findings/decisions distill
up to the parent's TOME/STRATEGY (or the project registries if `parent: none`).
```
---
type: side-quest
slug: {slug}
parent: .ai-context/quests/{parent-name} | none
realm: {realm}
status: open | done | promoted
created: "{YYYY-MM-DD}"          # quoted — unquoted ISO dates parse to Date
---
# Side-Quest: {one-line description}
## Findings
## Dangers     (distills to parent TOME_OF_DANGERS / project DANGER_REGISTRY)
## Decisions   (distills to parent STRATEGY_SCROLL / project DECISIONS_LOG)
```

### Canonical multi-chat walkthrough

The intended end-to-end flow, two chats in one folder:

1. **Chat A** `/embark --quest dashboard-redesign` → works the main quest; carries
   `dashboard-redesign` in-conversation.
2. Mid-work, A spots a font bug: `/side-quest "badge label font too small"` →
   creates `.ai-context/side-quests/badge-label-font/NOTE.md` with
   `parent: .ai-context/quests/dashboard-redesign`, appends a one-line breadcrumb
   to the parent journal, and **leaves A on dashboard-redesign** (no switch).
3. **Chat B** (new chat, same folder) picks it up: `/start-quest badge-label-font`
   (or any command with `--quest badge-label-font`). Side-quest pickup activates
   the NOTE as a lightweight one-scroll context and does NOT touch the shared
   pointer — it still reads dashboard-redesign — so Chat A is unaffected either
   way; Chat B works directly against the NOTE.
4. Both finish together. Chat A `/make-camp` echoes "camping dashboard-redesign /
   realm app — confirm?", appends an `expedition` line to `events.log` via `>>`,
   recomputes `profile.md`. Chat B `/close-side-quest` distills the font danger up
   into dashboard-redesign's `TOME_OF_DANGERS.md`, moves the NOTE to
   `side-quests/done/`. No shared file is rewritten from a stale read; both XP
   events land.

| File | Contents | Updated by |
|---|---|---|
| `quests/{quest-name}/context.md` | Battle status + open riddles + road ahead + top dangers + locked decisions | `/embark`, `/make-camp` |
| `DANGER_REGISTRY.md` | All dangers distilled from completed quests | `/complete-quest` |
| `DECISIONS_LOG.md` | All decisions distilled from completed quests | `/complete-quest` |
| `README.md` | How to use with each AI tool | Created once by `/new-quest` |

**context.md** is the one file to paste into any AI tool. It includes everything needed to resume work: battle status, open riddles, road ahead, top quest dangers, and locked decisions (quest + project-level).

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

## XP system

Developers earn EXP for completing work. Profile is stored in `.claude/quest-xp/`
(gitignored — local to your machine, not shared).

### Profile files

| File | Purpose |
|---|---|
| `.claude/quest-xp/profile.md` | Adventurer stats, level, EXP, badges |
| `.claude/quest-xp/quest-history.md` | EXP log per completed quest |

Created by `/new-quest` on first use. Both files gitignored automatically.

### EXP formula (awarded by /complete-quest)

EXP is derived from quest data — no manual difficulty rating needed.

| Source | EXP |
|---|---|
| Base reward | 100 |
| Per module conquered | 25 |
| Per expedition logged | 10 |
| Per danger in TOME_OF_DANGERS | 15 |
| Per oath sworn | 20 |
| Per split scroll | 50 |
| Clean sweep (zero open riddles at completion) | +75 bonus |
| Speed run (completed in ≤ 3 expeditions) | +50 bonus |

Per-expedition EXP (awarded by /make-camp):

| Source | EXP |
|---|---|
| Completing an expedition | 5 |
| New danger discovered this expedition | +10 |
| New oath sworn this expedition | +10 |

### Level table

Levels run 1–50. Each level costs `level × 300` EXP over the previous one, so the
total EXP to REACH level N is:

    threshold(N) = 150 × N × (N − 1)          (exp-to-next at level L = 300 × L)

Titles are tiered every 5 levels, with rank `I`–`V` for the 1st–5th level inside a
tier. A full title is `{tier} {rank}` — e.g. level 1 = `Apprentice Coder I`,
level 26 = `Master Builder I`, level 50 = `Transcendent Engineer V` (MAX LEVEL).

| Levels | Tier title | Threshold at tier start |
|---|---|---|
| 1–5 | Apprentice Coder | 0 |
| 6–10 | Journeyman Developer | 4,500 |
| 11–15 | Skilled Developer | 16,500 |
| 16–20 | Senior Developer | 36,000 |
| 21–25 | Expert Architect | 63,000 |
| 26–30 | Master Builder | 97,500 |
| 31–35 | Grand Master | 139,500 |
| 36–40 | Legendary Coder | 189,000 |
| 41–45 | Mythic Developer | 246,000 |
| 46–50 | Transcendent Engineer | 310,500 |

### Badges

| Badge | Name | Unlock condition |
|---|---|---|
| 🗡️ | First Blood | Complete your first quest |
| 📜 | Scroll Keeper | Complete 5 quests |
| ⚔️ | Veteran | Complete 10 quests |
| 🏆 | Legend | Complete 25 quests |
| 🕵️ | Danger Mapper | Map 10 total dangers |
| ☠️ | Danger Hoarder | Map 50 total dangers |
| 🤝 | Oath Keeper | Swear 10 total oaths |
| 📚 | Lore Master | Swear 50 total oaths |
| 🚀 | Speed Runner | Complete a quest in ≤ 3 expeditions |
| 🧘 | Marathoner | Log 50 total expeditions |
| 🔥 | Unstoppable | Log 200 total expeditions |
| ✨ | Clean Sweep | Complete a quest with zero open riddles |
| 📂 | Split Master | Trigger 5 scroll splits |
| 🌟 | Rising Star | Reach level 5 |
| 💎 | Diamond | Reach level 10 |

### Event log (source of truth) + profile cache

Because several chats in one folder can finish work at the same time, XP is NOT a
counter that commands read-modify-write (that loses updates). Instead:

- **`.claude/quest-xp/events.log` is the append-only source of truth.** Every
  XP-earning action appends ONE self-contained line via a shell append
  (`printf '%s\n' >> .claude/quest-xp/events.log`) — never Edit/Write. Concurrent
  appends interleave whole lines; a torn/garbled line is skipped on fold.
  ```
  {iso-date}|{event}|{quest-name}|key=val;key=val;...
  2026-06-04|expedition|scan-align|base=5;dangers=1;oaths=0
  2026-06-04|quest-complete|scan-align|modules=4;expeditions=3;dangers=6;oaths=2;splits=1;clean=1;speed=1
  2026-06-02|seed|-|total-exp=2790;expeditions=10;dangers=16;oaths=33;splits=0
  ```
- **`profile.md` is a derived cache**, recomputed by folding the log. It keeps the
  same frontmatter keys (the read-only quest-dashboard reads this file, not the
  log), plus `derived-from-events: {N}` = the line count it was built from. Any
  command that appends an event MUST recompute and rewrite `profile.md` in the
  same run. `/quest-xp` recomputes if `derived-from-events` ≠ actual line count
  (self-healing).
- **Seeding (migration):** if `events.log` is absent but `profile.md` has totals,
  append ONE `seed` line carrying the current totals, then recompute. Guarded by
  the log-absent check so it never double-seeds.

### XP derivation (the fold)

`events.log` is the source of truth; totals/level/badges are DERIVED by folding the
WHOLE log every time (idempotent — never patch the cache incrementally).

Event line format (pipe-delimited; shell `>>` append ONLY, never Edit/Write):
`{YYYY-MM-DD}|{type}|{quest-name}|{k=v;k=v;...}`

| type | emitted by | fields |
|---|---|---|
| `seed` | first XP write on a pre-events.log install | total-exp; quests-completed; total-expeditions; total-dangers-mapped; total-oaths-sworn; total-splits; badges=A,B,C (the FULL current profile, verbatim) |
| `expedition` | /make-camp | dangers=N; oaths=N; split=0\|1 |
| `quest-complete` | /complete-quest | modules; expeditions; dangers; oaths; splits; clean=0\|1; speed=0\|1 |

Fold algorithm — start all counters at 0 and the badge set empty, then per line:
- `seed` → add its counters to the accumulators; UNION its badges into the set.
  (Baseline for migrated installs; absent on fresh installs.)
- `expedition` → total-expeditions += 1; total-dangers-mapped += dangers;
  total-oaths-sworn += oaths; total-splits += split;
  total-exp += 5 + (dangers>0 ? 10 : 0) + (oaths>0 ? 10 : 0).
- `quest-complete` → quests-completed += 1;
  total-exp += 100 + modules*25 + expeditions*10 + dangers*15 + oaths*20 + splits*50
  + (clean ? 75 : 0) + (speed ? 50 : 0).
  Does NOT re-add expedition/danger/oath/split counters — those were already counted
  by the expedition events; the quest-complete fields drive the REWARD only.
- Skip any malformed/torn line (warn, do not abort).

Then derive:
- `level` = highest level whose threshold ≤ total-exp (Level table above).
- derived badges = every badge whose condition holds against the folded
  counters/level (Badges table); Speed Runner / Clean Sweep additionally unlock
  from any `quest-complete` event with speed=1 / clean=1.
- **`badges` = UNION(seed badges, derived badges). NEVER recompute badges from
  scratch** — the seed carries historically-earned badges that may not be
  re-derivable (e.g. quest-completion badges), and they must never be dropped.

Write the result to `profile.md` (the cache): all 7 numeric keys + `adventurer` +
`badges` + `derived-from-events: {lines folded}`. The read-only dashboard reads
this cache, so every one of those keys MUST be present on every write.

Seeding (migration), idempotent: if `events.log` is ABSENT and `profile.md` has
totals, append ONE `seed` line carrying the full current profile, then proceed.
The log-absent check is the guard — never seed twice.

Self-healing: `/quest-xp` (and any XP write) recomputes when `derived-from-events`
≠ the actual line count. The cache rewrite is itself unlocked, but because it is a
full-log fold, a lost cache write just self-heals on the next recompute.

Reference + regression oracle: `scripts/quest-xp-fold.sh` is the authoritative
implementation of this fold (input: an events.log; output: the derived
KEY=VALUE profile fields). Keep this prose and that script in lockstep; the fold
is regression-tested by `hooks/tests/quest-xp-fold-test.sh`.

### Lifecycle log (live phase for the dashboard)

`.claude/quest-xp/lifecycle.log` is a SEPARATE append-only log — a sibling of
`events.log`, never the same file. Each lifecycle command appends ONE `state`
line via a shell append (`printf '%s\n' >> .claude/quest-xp/lifecycle.log`) the
moment a quest changes phase:

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
backstop for `embarked`: command appends depend on the model running a buried shell
step, so a skipped step or interrupted session left the dashboard stuck. The hook
records `phase=embarked` on the first edit to a real project file (edits under
`.ai-context/` or `.claude/` are planning artifacts and never bump). It is idempotent
— it appends only when the last recorded phase is not already `embarked`.

Why a separate file, not `events.log`: `/embark` is the only command that must
signal a transition yet writes no scroll and earns no XP. Folding state lines
into `events.log` would be unsafe — the XP seed guard keys off `events.log`
existence and the fold keys off its line count, so an `/embark` append before the
first XP event could suppress the migration seed and zero out a migrated profile.
Keeping lifecycle state in its own log means a state append can never perturb XP.

The read-only quest-dashboard reads the LAST `state` line for the active quest and
trusts it over scroll inference (which only changes at `/make-camp` boundaries).
`/complete-quest` and `/change-quest` write no `state` line — they update
`.claude/active-quest.txt`, which the dashboard watches directly.

### Profile file format

`.claude/quest-xp/profile.md` (derived cache — recomputed from events.log):
```
---
adventurer: {git user.name or "Adventurer"}
level: 1
total-exp: 0
quests-completed: 0
total-expeditions: 0
total-dangers-mapped: 0
total-oaths-sworn: 0
total-splits: 0
badges: []
derived-from-events: 0
---
# {adventurer}'s Adventurer Profile
...rendered by /quest-xp...
```

`.claude/quest-xp/quest-history.md`: append-only log, one entry per completed quest.

## Obsidian integration (opt-in)

`.ai-context/` can be opened as an Obsidian vault for dashboards + a knowledge graph over
your scrolls. Fully opt-in: nothing changes until you run `/setup-obsidian`, and no other
command reads the marker, so declining leaves scrolls byte-for-byte identical.

- **`/setup-obsidian`** — writes `.ai-context/.obsidian/` config (Bases enabled), three
  Bases dashboards (Quest Status / Dangers / Decisions) over the existing frontmatter, and
  injects `related:` quoted-wikilink frontmatter so the graph connects. Quoted frontmatter
  links create native graph edges since Obsidian 1.4 and live in YAML — no `[[brackets]]`
  in prose, so the scrolls stay GitHub-portable. Drops the opt-in marker
  `.ai-context/.obsidian-enabled`. Idempotent; `--force` regenerates.
- **`/open-obsidian`** — opens the vault from the CLI (registers it headlessly if needed).
- **Living connectivity (MCP)** — install the "Local REST API with MCP" Obsidian plugin,
  enable its non-encrypted loopback server, and `claude mcp add` it. Then Claude keeps the
  graph current and can read/search/patch scrolls directly via `mcp__obsidian__*`.
  `/setup-obsidian` detects this and guides the setup when it is missing.
- **Self-maintaining** — once opted in, `make-camp` and `complete-quest` emit `related:`
  on the scrolls they touch (gated on the marker), so new scrolls join the graph without
  re-running setup.

Requires Obsidian 1.9+ for Bases (older versions use the Dataview `Dashboards.md`
fallback). One vault per project = one `.ai-context/`.

## Installation

Run `/install-quest-system` once per project.
To reuse in a new project: copy this SKILL.md file, then run `/install-quest-system`.

## Scroll templates

These templates are used by /new-quest to create fresh scrolls.
Claude Code should reference these when creating quest folders.

### WORLD_MAP.md template
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

### STRATEGY_SCROLL.md template
---
quest: {quest-name}
realm: {realm}
scroll: STRATEGY_SCROLL
last-updated: {date}
---
# Strategy Scroll — {quest-name}
## Battle Status
| Module | Status |
|---|---|
## Oaths Sworn (Resolved Decisions)
(none yet)
## Fallen Strategies (Rejected Approaches)
(none yet)
## Scouting Findings (Audit Results)
(none yet)
## Open Riddles (Decisions Needed)
(none yet)
## The Battle Plan (Implementation Sequence)
(to be written before the next expedition)

## Planned Expeditions
(seeded by /counsel-quest from the battle plan; flipped [ ]→[>]→[x] by /embark and /make-camp)

### ADVENTURE_JOURNAL.md template
---
quest: {quest-name}
realm: {realm}
scroll: ADVENTURE_JOURNAL
last-updated: {date}
---
# Adventure Journal — {quest-name}
Append-only. One entry per expedition. Never rewrite history.

### TOME_OF_DANGERS.md template
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
## Fallen Strategies (Tried and Abandoned)
(none yet)
## Unsolved Riddles (Open Verification Items)
(none yet)

### ADVENTURERS_HANDBOOK.md template
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
