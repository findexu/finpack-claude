---
description: End an expedition. Records expedition results, updates all touched scrolls, updates YAML frontmatter, and splits any scroll that has grown beyond 500 lines.
argument-hint: "[--quest <name>] [--realm <realm>]"
---

# Make Camp

End the current expedition. Record what was done, update scrolls, check for splits.

## Step 1: Resolve the active quest

Resolve the quest for THIS chat (see SKILL.md -> "Active-quest selection"):
1. If a `--quest <name-or-path>` argument was given, use it; read its realm from that
   quest's `STRATEGY_SCROLL.md` frontmatter unless `--realm <realm>` was also passed.
2. Otherwise read `.claude/active-quest.txt` (line 1 = quest folder path, line 2 = realm).
3. If neither resolves: "No active quest. Run /new-quest first, or pass --quest." Stop.

The shared pointer is UNTRUSTED in multi-chat — carry this chat's quest in-conversation
and pass it as `--quest`. `{quest-name}` is the basename of the resolved folder path.

Before ANY write in this command, echo the resolved `quest + realm` and confirm (or
require an explicit `--quest`) — backstop against camping a quest another chat just
repointed the pointer to (SKILL.md -> "Mutating commands confirm first").

## Step 2: Gather expedition results

Ask the commander:
1. What was conquered (completed) this expedition?
2. Any oaths sworn (decisions made and locked)?
3. Anything cursed or uncertain — blockers, unknowns?
4. What is the road ahead for the next expedition?
5. Any new dangers discovered? (added to TOME_OF_DANGERS)
6. Any structural changes to the codebase? (added to WORLD_MAP)

## Step 2.5: Council Review (optional)

Ask: "Summon the review council on this expedition's changes? (y/n)"
If n, skip to Step 3.

If y, determine the expedition's changed files (prefer `git diff --name-only`
against the expedition's start; fall back to the files you touched this session).
If there are no code changes, note that and skip.

Launch these agents in parallel, each scoped to the changed files:
- `fp-code-reviewer` — correctness bugs, logic errors, error handling.
- `fp-security-reviewer` — vulnerabilities (only if the changes touch auth, input,
  network, secrets, or filesystem; otherwise skip it).
- `fp-performance-reviewer` — hot-path / allocation / query regressions (only if
  the changes touch data processing, loops, rendering, or endpoints).

Collect their findings. For each CONFIRMED issue (ignore style nitpicks and
low-confidence noise):
- Inscribe it as a new danger in Step 5 (TOME_OF_DANGERS Known Dangers), with the
  remedy the reviewer proposed.
- Surface a short summary to the commander; ask whether to fix now or log-and-defer.

Findings inscribed here count as "new dangers" for Steps 5 and 9.

## Step 3: Update ADVENTURE_JOURNAL.md

If `journal/` subfolder exists, write to `journal/{YYYY-MM}.md` (current month).
Otherwise write to `ADVENTURE_JOURNAL.md` directly.

Append — never overwrite history:
```
## Expedition {YYYY-MM-DD}
### Conquered
{conquered items}
### Oaths Sworn
{oaths, or "none"}
### Cursed / Uncertain
{cursed items, or "none"}
### The Road Ahead
{road ahead}
```

Update `last-updated: {date}` in the YAML frontmatter of the index file.

## Step 4: Update STRATEGY_SCROLL.md

If `strategy/` subfolder exists, update the relevant module file.
Always update the index file's battle status table.

Changes to make:
- Mark newly conquered modules as Conquered in battle status table
- Add new oaths to `## Oaths Sworn (Resolved Decisions)`
- Add fallen strategies to `## Fallen Strategies (Rejected Approaches)`
- Remove resolved items from `## Open Riddles (Decisions Needed)`

Update `last-updated: {date}` in YAML frontmatter.

## Step 5: Update TOME_OF_DANGERS.md (if new dangers reported)

If any new dangers were reported in Step 2:
- Add to `## Known Dangers` table: Danger | Impact | Remedy
- Add any confirmed safe paths to `## Confirmed Safe Paths`
- Add any discarded approaches to `## Fallen Strategies (Tried and Abandoned)`

If `dangers/` subfolder exists, write to the appropriate category file
(rendering, memory, swift-concurrency, ui, file-io).

Update `last-updated: {date}` in YAML frontmatter.

## Step 6: Update WORLD_MAP.md (if structural changes reported)

If any structural changes were reported in Step 2:
- Update Module Map, Navigation Flow, Data Flow, or Key Files as appropriate
- Move deleted or replaced files to `## Retired Files`

If `map/` subfolder exists, write to the relevant area file
(navigation, data-flow, key-files).

Update `last-updated: {date}` in YAML frontmatter.

## Step 7: Split check

After every write, count lines in each modified scroll file (index files only for split scrolls).

For each file that exceeds 500 lines:
1. Announce: "📜 {filename} has grown beyond 500 lines. Splitting into subfiles..."
2. Apply split rules:
   | Scroll | Split folder | Split by |
   |---|---|---|
   | TOME_OF_DANGERS.md | dangers/ | category: rendering, memory, swift-concurrency, ui, file-io |
   | STRATEGY_SCROLL.md | strategy/ | one file per major module |
   | ADVENTURE_JOURNAL.md | journal/ | one file per month: YYYY-MM.md |
   | WORLD_MAP.md | map/ | area: navigation, data-flow, key-files |
   | ADVENTURERS_HANDBOOK.md | never splits | — |
3. Create the split subfolder if it does not exist.
4. Move content into subfiles according to the split rules for that scroll type.
5. Rewrite the main file as a lightweight index:
   - Keep YAML frontmatter (update `last-updated`)
   - Keep summary / overview (~50 lines max)
   - Add `## Content Index` table pointing to each subfile
   - STRATEGY_SCROLL: always keep battle status table in the index
   - ADVENTURE_JOURNAL: keep last 3 entries in the index
   - TOME_OF_DANGERS: keep 3 most critical dangers as fast-read summary
6. Confirm: "Split complete. {filename} → {list of subfiles created}."

## Step 8: Refresh context.md

Write `{quest-folder}/context.md` using data from the scrolls just updated:

```
# Quest Context: {quest-name}
Realm: {realm}  |  Last updated: {date}  |  Expedition: camped
*Paste this file into any AI tool to load the active quest state.*

## Battle Status
{battle status table from STRATEGY_SCROLL — updated version}

## Open Riddles
{open riddles from STRATEGY_SCROLL — updated version, or "None"}

## Road Ahead
{this expedition's "The Road Ahead" entry just written to ADVENTURE_JOURNAL}

## Known Dangers
### Quest Dangers
{fast-read summary from TOME_OF_DANGERS index — top 5, updated if new dangers were added}

### Project Dangers
{top 5 rows from .ai-context/DANGER_REGISTRY.md if exists, else "(none yet — complete a quest first)"}

## Locked Decisions
### Quest Decisions
{entries from STRATEGY_SCROLL Oaths Sworn section — updated version}

### Project Decisions
{rows from .ai-context/DECISIONS_LOG.md if exists, else "(none yet — complete a quest first)"}
```

## Step 9: Award expedition EXP

If `.claude/quest-xp/profile.md` does not exist, skip this step silently.

XP is an append-only event log — do NOT read-modify-write the counters. See
SKILL.md -> "XP derivation (the fold)".

1. **Seed if needed (idempotent):** if `.claude/quest-xp/events.log` is ABSENT,
   append ONE `seed` line carrying the full current profile (all 6 counters +
   the `badges` list, verbatim). The log-absent check is the guard — never seed twice.
2. **Append the expedition event** with a SHELL APPEND (never Edit/Write):
   ```bash
   printf '%s\n' "{YYYY-MM-DD}|expedition|{quest-name}|dangers={N};oaths={N};split={0|1}" >> .claude/quest-xp/events.log
   ```
   `dangers`/`oaths` = COUNTS of new dangers/oaths reported in Step 2; `split` = 1
   if a split occurred in Step 7, else 0. (The expedition reward — base 5,
   +10 if dangers>0, +10 if oaths>0 — is computed by the fold, not here.)
3. **Recompute the cache:** fold the WHOLE `events.log` (SKILL.md derivation) and
   rewrite `profile.md` — all 7 numeric keys + `adventurer` + `badges`
   (UNION of seed + derived; never dropped) + `derived-from-events`. Record old vs
   new `level` for Step 10.
4. **Record the lifecycle transition** (separate append-only log, not events.log —
   it carries no XP and must never enter the XP fold):
   ```bash
   printf '%s\n' "{YYYY-MM-DD}|state|{quest-name}|phase=at-camp" >> .claude/quest-xp/lifecycle.log
   ```
   This flips the dashboard from "Embarked" back to "At Camp" the moment camp is made.

## Step 10: Confirm

Report:
```
⛺ Camp made. Expedition {date} recorded.
Files updated: {list}
{any split announcements}

+{exp_earned} XP  ({reason breakdown})
Total EXP: {total-exp}  |  Level {level} — {title}
```

If level-up occurred:
```
╔══════════════════════════════════════╗
║  🌟  LEVEL UP!  Level {new level}     ║
║  {new title}                          ║
╚══════════════════════════════════════╝
```

If any new badges unlocked, display after the level-up block:
```
🎖️  Badge unlocked: {badge emoji}  {badge name}
```
(one line per badge, in order unlocked)
