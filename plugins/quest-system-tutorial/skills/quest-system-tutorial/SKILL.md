---
name: quest-system-tutorial
description: >
  Dry-run tutorial for the quest-system skill. Simulates the full quest lifecycle
  using a fictional example project with no files written. Run this before using
  quest-system for the first time. Shows realistic output for the current
  command flow: /new-quest, /counsel-quest, /embark, /make-camp, /quest-log,
  /summon-witch-doctor, /complete-quest. Targeted at developers new to the
  system and its terminology.
---

# Quest System Tutorial

This is a **dry run** — no files will be created, no commands will actually execute.
You will see realistic example output for every command in the quest-system.

---

## Step 0: Detect context

Before starting, check whether `.claude/active-quest.txt` exists.

**If the file exists** (user is already inside an active quest):

Read it. Extract quest name (line 1, basename only) and realm (line 2).

Ask the user:

```
You have an active quest: {quest-name}  |  Realm: {realm}

What would you like?
  1. Full tutorial    — simulate the complete lifecycle with a fictional example
                        (ignores your active quest)
  2. Quick reference  — vocabulary decoder + command cheat sheet only
  3. Exit             — you already know the system
```

- If **1**: proceed to Phase 1 below, using the fictional `login-redesign` example.
- If **2**: show the Vocabulary decoder and Closing sections only, then stop.
- If **3**: stop immediately.

**If the file does not exist** (no active quest):

Proceed directly to Phase 1 below. No prompt needed.

---

## Vocabulary decoder

The quest-system uses RPG metaphors. Here is the plain-language translation:

```
Quest           = a feature or epic you are building
Realm           = the app target in scope (e.g. the iOS app, the backend API)
Expedition      = a focused work loop (/embark -> implementation -> /make-camp)
Scrolls         = the five markdown files that store all context between expeditions
Conquered       = done, complete
Cursed          = blocked or uncertain — needs attention
Oath            = a locked decision that will not be re-debated
Fallen strategy = an approach that was tried and rejected (must be recorded)
Witch Doctor    = /summon-witch-doctor — the health-check command for scrolls
```

**The problem quest-system solves:**
Claude Code starts fresh every conversation. Without quest-system, you copy-paste
the same context into every chat or Claude re-discovers the same landmines repeatedly.
Quest-system gives Claude persistent memory across expeditions using plain markdown files
you own — no external services, no database, no sync.

---

## Quest Lifecycle

Two layers: the quest lifecycle (one per feature) and the expedition routine (every session).

**Quest lifecycle:**

```
/new-quest ──► [/counsel-quest] ──► expeditions... ──► /complete-quest
                     ▲                                        |
                     └── re-run when blocked or new riddles ──┘
```

**Expedition routine — the repeating loop inside every quest:**

```
Open Claude ──► /embark ──► [code / build / explore] ──► /make-camp ──► Close Claude
                  ▲                                                          |
                  └──────────────────── next session ────────────────────────┘
```

**Command frequency at a glance:**

```
Every session   /embark (open), /make-camp (close)
As needed       /counsel-quest (blocked or new riddle), /quest-log (status check)
Health check    /summon-witch-doctor (scrolls feel stale or broken)
Once per quest  /new-quest (start), /complete-quest (ship)
Parallel work   /change-quest (switch between active quests)
```

---

## The fictional project

Throughout this tutorial, we are building a `login-redesign` feature
in the `MobileApp` target of a hypothetical iOS project. The tutorial shows
one complete lifecycle: create → work → grow → health-check → complete → start again.

---

## Phase 1 — Create a new quest

**Command:** `/new-quest login-redesign MobileApp`

Quest system creates a folder `docs/dev/login-redesign/` with five scroll files:

```
docs/dev/login-redesign/
  WORLD_MAP.md           ← codebase map: modules, data flow, key files
  STRATEGY_SCROLL.md     ← battle plan: what to build, decisions made, status
  ADVENTURE_JOURNAL.md   ← session history: what happened each expedition
  TOME_OF_DANGERS.md     ← technical traps: known bugs, constraints, workarounds
  ADVENTURERS_HANDBOOK.md ← meta: explains what belongs in each scroll
```

Each file starts with YAML frontmatter that `/quest-log` reads without opening
the full file:

```yaml
---
quest: login-redesign
realm: MobileApp
scroll: WORLD_MAP
last-updated: 2026-05-27
---
# World Map — login-redesign
## Realm
All work this quest is scoped to MobileApp only.
...
```

Active quest is set:

```
.claude/active-quest.txt
─────────────────────────
docs/dev/login-redesign
MobileApp
```

**Output:**
```
⚔️  Quest inscribed: login-redesign
Realm: MobileApp
Scrolls created in docs/dev/login-redesign/
  ✓ STRATEGY_SCROLL.md
  ✓ TOME_OF_DANGERS.md
  ✓ ADVENTURE_JOURNAL.md
  ✓ WORLD_MAP.md
  ✓ ADVENTURERS_HANDBOOK.md

Next steps:
  /counsel-quest  — lock decisions and finalize the battle plan
  /embark         — start the first expedition
```

---

## Phase 2 — Lock decisions, then start the first expedition

**Command:** `/counsel-quest`

Counsel quest resolves open riddles and locks decisions before execution.
It can also be re-run later when a new expedition focus appears.

Example output:

```
⚔️  Counsel complete — login-redesign

Oaths sworn this expedition planning round:
- Token storage uses Keychain, not UserDefaults

Battle plan: 4 steps defined
Open riddles remaining: none

Run /embark to begin the expedition.
```

**Command:** `/embark`

Embark reads the active quest, checks for project-level knowledge files
(none yet — this is the first quest), then reads all five scrolls and
produces a briefing:

```
⚔️  Expedition begins.
Quest: login-redesign  |  Realm: MobileApp
Strategy last updated: 2026-05-27

━━━ Battle Status ━━━━━━━━━━━━━━━━━━━━━━━━━
Module               Status
───────────────────  ──────
Auth flow            Pending
Login screen UI      Pending
Token storage        Pending
Biometric unlock     Pending

━━━ Recent History ━━━━━━━━━━━━━━━━━━━━━━━━
(no expeditions yet — first session)

━━━ Known Dangers ━━━━━━━━━━━━━━━━━━━━━━━━
(no dangers recorded yet)

━━━ Open Riddles ━━━━━━━━━━━━━━━━━━━━━━━━━
(no open questions yet)
```

After the briefing, embark proposes a concrete expedition plan and asks whether
it looks right. The options are: "Looks good, let's go", "Adjust the plan",
"Counsel this plan", or "Run /counsel-quest first".

Await orders. Claude is now context-loaded and ready to work.

---

## Phase 2.5 — Counsel the plan before you commit (optional)

Plans usually have a flaw or two. Instead of catching them mid-expedition,
have an independent reviewer (the `fp-plan-reviewer` agent) vet the proposed
steps first. Pick "Counsel this plan", or start with a flag:

**Command:** `/embark --counsel 3`

`--counsel N` iterates up to N rounds: review → apply blocking fixes →
re-review, stopping as soon as the plan is clean. `--strict` makes only
blocking issues drive the loop (minor nits are listed, never looped on).

A reviewer who is the same context that wrote the plan tends to rubber-stamp
it, so the review runs in a SEPARATE agent context. Each round ends in a
verdict — `READY` (0 blocking) or `REVISE` (>=1 blocking):

```
Round 1 — fp-plan-reviewer
### Unclear steps
- Step 2 "wire up auth" has no executable action — name the function/file.
### Suggested additions
- No verification for the token-refresh change.
### Verdict
REVISE (blocking: 2, minor: 1)

  ↳ applying blocking fixes, re-proposing...

Round 2 — fp-plan-reviewer
### Verdict
READY (blocking: 0, minor: 1)

Plan is clean. Presenting for approval.
```

Termination is bounded four ways: READY (clean), cap reached (round N),
non-converging (a round fails to reduce the blocking count — surfaced to you),
or you decline. The approval gate always stays — counsel never auto-executes.

If the reviewer agent is not installed, embark degrades gracefully:
```
Plan counsel unavailable — fp-plan-reviewer not installed.
Run /install-quest-system (or /update-quest-system) to enable.
Proceeding to manual approval.
```

Plain `/embark` with no flag skips all of this — zero extra tokens. You can
also vet a standalone plan file any time with `/counsel-plan path/to/plan.md`.

---

## Phase 3 — End your first expedition

**Command:** `/make-camp`

make-camp = "save everything to the scrolls before closing Claude Code."
If you skip this step, the next expedition starts blind — Claude will have
no memory of what happened.

Claude presents 6 prompts and records your answers:

```
1. What was conquered (completed) this expedition?
   > Audited the existing login flow. Mapped all auth-related files.
     Identified that LoginViewController handles both biometric and
     password — needs splitting.

2. Any oaths sworn (locked decisions)?
   > Yes — we will use Keychain for token storage, not UserDefaults.
     Security requirement, non-negotiable.

3. Anything cursed or uncertain?
   > BiometricAuthManager has undocumented state machine. Need to
     understand it before touching it.

4. What is the road ahead for next expedition?
   > Split LoginViewController. Start on auth flow redesign.

5. Any new dangers discovered?
   > Yes — LAContext must be instantiated fresh per authentication attempt.
     Reusing instances causes silent failures on device.

6. Any structural changes to record in the world map?
   > Yes — found AuthCoordinator.swift which routes all auth. Key file.
```

After your answers, make-camp writes:

**ADVENTURE_JOURNAL.md** (appended — never overwritten):
```markdown
## Expedition 2026-05-27
### Conquered
- Audited existing login flow and mapped all auth-related files
- Identified LoginViewController as split candidate

### Oaths Sworn
- Token storage: Keychain only, not UserDefaults (security requirement)

### Cursed / Uncertain
- BiometricAuthManager has undocumented state machine — do not touch yet

### The Road Ahead
- Split LoginViewController
- Start auth flow redesign
```

**STRATEGY_SCROLL.md** (battle status and oath updated):
```markdown
## Battle Status
Module               Status
───────────────────  ──────
Auth flow            Pending
Login screen UI      Pending → Scouting done
Token storage        Pending
Biometric unlock     Cursed (undocumented state machine)

## Oaths Sworn (Resolved Decisions)
- Token storage uses Keychain, not UserDefaults
```

**TOME_OF_DANGERS.md** (new danger added):
```markdown
## Known Dangers
Danger                     Impact                    Remedy
─────────────────────────  ────────────────────────  ────────────────────────────────
LAContext reuse            Silent auth failure        Instantiate fresh per attempt
```

**Output:**
```
⛺ Camp made. Expedition 2026-05-27 recorded.
Files updated: ADVENTURE_JOURNAL.md, STRATEGY_SCROLL.md, TOME_OF_DANGERS.md,
               WORLD_MAP.md (AuthCoordinator.swift added to key files)
```

---

## The Expedition Loop

Phase 2 and 3 above show one expedition. A real quest runs that loop many times:

```
Session 1:  /embark → work → /make-camp
Session 2:  /embark → work → /make-camp
Session 3:  /embark → work → /make-camp  ← /counsel-quest if new riddles block you
...
Session N:  /embark → work → /make-camp → /complete-quest
```

**What persists between sessions:** everything in the scrolls.
`/make-camp` writes them. `/embark` reads them. Claude starts each expedition
fully briefed without you re-explaining context.

**What does NOT persist:** conversation history, Claude's in-memory context.
`/make-camp` is the save point. Skip it and the next Claude starts blind.

**When to re-run `/counsel-quest` mid-quest:**
- New open riddles appear that block the next expedition
- The battle plan is stale after a major discovery during scouting
- The commander wants to lock a decision before executing (not mid-expedition)

`/counsel-quest` is NOT required before every expedition — only when riddles
need resolving or the plan needs updating. If the path is clear, go straight
to `/embark`.

---

## Phase 4 — Quick status check (no expedition needed)

**Command:** `/quest-log`

quest-log reads only YAML frontmatter from each file — fast, no full body parse:

```
📜 Quest Log
Quest: login-redesign  |  Realm: MobileApp

Battle Status:
Module               Status
───────────────────  ──────
Auth flow            Pending
Login screen UI      Scouting done
Token storage        Pending
Biometric unlock     Cursed

Scroll health (last updated):
  WORLD_MAP.md             2026-05-27
  STRATEGY_SCROLL.md       2026-05-27
  ADVENTURE_JOURNAL.md     2026-05-27
  TOME_OF_DANGERS.md       2026-05-27
  ADVENTURERS_HANDBOOK.md  2026-05-27

📁 Split scrolls: None — all scrolls within threshold
```

---

## Phase 5 — Three months later: a scroll grows too large

**Narration:** Three months have passed. The team has run 40+ expeditions.
TOME_OF_DANGERS.md has grown to 520 lines — above the 500-line threshold.

During the next `/make-camp`, after writing the journal entry, the split check fires:

```
📜 TOME_OF_DANGERS.md has grown beyond 500 lines. Splitting into subfiles...
```

The scroll is reorganized into a `dangers/` subfolder:

```
docs/dev/login-redesign/
  TOME_OF_DANGERS.md         ← now a lightweight index
  dangers/
    rendering.md             ← UIKit rendering-specific dangers
    memory.md                ← retain cycles, memory pressure
    swift-concurrency.md     ← async/await, actor isolation
    ui.md                    ← layout, autoresizing, safe area
```

The TOME_OF_DANGERS.md index is rewritten:

```markdown
---
quest: login-redesign
realm: MobileApp
scroll: TOME_OF_DANGERS
last-updated: 2026-08-14
---
# Tome of Dangers — login-redesign

## Fast-Read Summary (3 most critical)
| Danger | Impact | Remedy |
|---|---|---|
| LAContext reuse | Silent auth failure | Instantiate fresh per attempt |
| MainActor missing on UI updates from auth callbacks | Crash on device | Always dispatch to MainActor |
| Keychain accessibility kSecAttrAccessibleAfterFirstUnlock | App unusable on reboot until unlock | Use kSecAttrAccessibleWhenUnlocked |

## Content Index
| File | Contents |
|---|---|
| dangers/rendering.md | 3 dangers |
| dangers/memory.md | 5 dangers |
| dangers/swift-concurrency.md | 8 dangers |
| dangers/ui.md | 4 dangers |
```

Next `/embark` only loads `dangers/swift-concurrency.md` if today's work
involves async patterns — not all 4 files.

**Output:**
```
⛺ Camp made. Expedition 2026-08-14 recorded.
Files updated: ADVENTURE_JOURNAL.md, STRATEGY_SCROLL.md
📜 TOME_OF_DANGERS.md split complete → dangers/ (4 subfiles)
```

---

## Phase 6 — Health check (including migration readiness)

**Command:** `/summon-witch-doctor`

The witch doctor inspects every scroll and reports:

```
Quest: login-redesign  |  Realm: MobileApp

Scroll                   Status        Issues
─────────────────────────────────────────────────────────────────────────────
WORLD_MAP.md             OK
STRATEGY_SCROLL.md       WARN          Missing frontmatter key: last-updated
ADVENTURE_JOURNAL.md     OK
TOME_OF_DANGERS.md       SPLIT         dangers/ (4 subfiles, index has Content Index)
ADVENTURERS_HANDBOOK.md  OK

📁 Split scrolls: TOME_OF_DANGERS (dangers/)

Repair affected scrolls? (y/n)
> y

Repaired: STRATEGY_SCROLL.md — added missing frontmatter key last-updated
          <!-- repaired by /summon-witch-doctor -->
```

SPLIT is not an error — it means the scroll has been correctly split and
the index structure is healthy. Only WARN and MISSING require repair.

---

## Phase 7 — The feature ships: complete the quest

All four modules are now Conquered. The commander confirms.

**Command:** `/complete-quest`

```
Battle Status:
Module               Status
───────────────────  ──────
Auth flow            Conquered
Login screen UI      Conquered
Token storage        Conquered
Biometric unlock     Conquered

Are all modules conquered and this quest truly complete? (y/n)
> y
```

**Distillation — TOME_OF_DANGERS → DANGER_REGISTRY.md:**
```
docs/dev/DANGER_REGISTRY.md  (created — first completed quest)

## Swift Concurrency Dangers
| Danger | Impact | Remedy | Quest |
|---|---|---|---|
| LAContext reuse | Silent auth failure | Instantiate fresh per attempt | login-redesign |
| Missing MainActor on auth callbacks | Crash on device | Dispatch to MainActor | login-redesign |

## Architecture Dangers
| Danger | Impact | Remedy | Quest |
|---|---|---|---|
| Keychain accessibility wrong flag | App unusable after reboot | Use kSecAttrAccessibleWhenUnlocked | login-redesign |
```

**Distillation — STRATEGY_SCROLL oaths → DECISIONS_LOG.md:**
```
docs/dev/DECISIONS_LOG.md  (created — first completed quest)

| Decision | Reason | Quest | Date |
|---|---|---|---|
| Token storage: Keychain only | Security requirement | login-redesign | 2026-05-27 |
| BiometricAuth: fresh LAContext per attempt | Prevents silent failures | login-redesign | 2026-06-03 |
```

**Archive:**
```
docs/dev/login-redesign/ → docs/dev/archived/login-redesign/
.claude/active-quest.txt  → deleted
```

**Output:**
```
🏆 Quest complete: login-redesign
Dangers distilled: 3 → docs/dev/DANGER_REGISTRY.md
Decisions distilled: 2 → docs/dev/DECISIONS_LOG.md
Archived: docs/dev/archived/login-redesign/

Run /new-quest to begin the next quest.
```

---

## Phase 8 — The "aha" moment: starting a second quest

**Command:** `/new-quest payment-flow MobileApp`

Then immediately: `/embark`

This time, embark finds the project-level files created by the completed quest:

```
⚔️  Expedition begins.
Quest: payment-flow  |  Realm: MobileApp
Strategy last updated: 2026-09-01

━━━ Project Dangers (from past quests) ━━━━━━━━━━━━
Danger                              Impact                  Remedy
──────────────────────────────────  ──────────────────────  ─────────────────────────────
LAContext reuse                     Silent auth failure     Instantiate fresh per attempt
Missing MainActor on auth callbacks Crash on device        Dispatch to MainActor
Keychain accessibility wrong flag   App unusable on reboot  Use kSecAttrAccessibleWhenUnlocked

━━━ Locked Decisions (from past quests) ━━━━━━━━━━
Token storage: Keychain only (security requirement)
BiometricAuth: fresh LAContext per attempt

━━━ Battle Status (this quest) ━━━━━━━━━━━━━━━━━━
Module               Status
───────────────────  ──────
Payment form UI      Pending
...
```

Claude already knows about the LAContext trap — from the previous quest —
without you having to explain it again. The full 40-expedition history of
login-redesign is in the archive, never loaded. Only the distilled lessons
travel forward.

**This is why `/complete-quest` is not optional.**

---

## Tutorial complete

You just saw the full lifecycle:

```
create feature  →  work across expeditions  →  scrolls grow and split
→  diagnose health  →  ship the feature  →  institutional memory persists
```

Everything lives in markdown files in your repo. No external services.
No database. No sync. Claude reads them at the start of every expedition.

```
Your commands:

  -- Every session --
  /embark              — start of every work session (loads context, proposes plan)
  /make-camp           — end of every work session (saves to scrolls — do not skip)

  -- Once per quest --
  /new-quest           — create a new quest (interview → 5 scrolls → set active)
  /complete-quest      — ship the feature (distill lessons, archive, clear active)

  -- As needed --
  /counsel-quest       — resolve open riddles and lock decisions (before first
                         expedition, or when blocked mid-quest)
  /quest-log           — fast status check between expeditions (no full scroll load)
  /change-quest        — switch active quest when running parallel features

  -- Health check --
  /summon-witch-doctor — inspect and repair scrolls (run when something feels off)
```
