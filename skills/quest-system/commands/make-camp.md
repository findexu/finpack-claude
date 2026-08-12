---
description: End an expedition. Records expedition results, updates all touched scrolls, updates YAML frontmatter, and splits any scroll that has grown beyond 500 lines.
argument-hint: "[--quest <name>] [--realm <realm>]"
---

# Make Camp

End the current expedition. Record what was done, update scrolls, check for splits.

## Step 1: Resolve the active quest

Resolve the quest for THIS chat (SKILL.md -> "Active-quest selection"): a `--quest
<name-or-path>` argument wins (realm from that quest's `STRATEGY_SCROLL.md` frontmatter
unless `--realm <realm>` was also passed); otherwise read `.claude/active-quest.txt`
(line 1 = quest folder path, line 2 = realm).
If neither resolves: "No active quest. Run /new-quest first, or pass --quest." Stop.

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

## Step 2.5: Council Review (the review-before-camp habit)

This step IS the **review-before-camp** development habit (SKILL.md → "Development habits").
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

## Step 2.9: Acquire the per-quest scroll lock

Steps 3–7 write this quest's `ADVENTURE_JOURNAL.md`, `STRATEGY_SCROLL.md`, and
`TOME_OF_DANGERS.md`. ACQUIRE the per-quest lock now (SKILL.md -> "Concurrency" ->
cross-tool-call quest lock), keyed by this quest's BASENAME, so a concurrent writer
cannot interleave a lost-update append between your write and the Step 7 split rewrite.

If the lock cannot be acquired within the budget, report "quest {quest-name} busy
(another chat is writing its scrolls) — retry shortly" and STOP. The lock is held
across Steps 3–7 (Step 6's world-map write is fine inside too) and RELEASED in
Step 7.5 on every exit path (including a failed Edit). context.md (Step 8) and the
lifecycle line (Step 9) run AFTER release.

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
- If a `## Planned Expeditions` checklist exists: flip the active `- [>]` (this
  expedition's focus) to `- [x]`, then append a new `- [ ]` whose label is a SHORT
  focus phrase summarizing "The Road Ahead" just written (not the full prose). If no
  checklist exists, skip. This is a scroll-body edit — never lifecycle.log.

Update `last-updated: {date}` in YAML frontmatter.

## Step 4.5: Reconcile the session todo list

Reconcile TodoWrite state against the checklist just updated in Step 4: completed
todos are evidence for the `- [x]` flip (if the todo list shows this expedition's
focus unfinished, confirm with the commander before flipping); an in_progress todo
that carries over maps to the `- [>]` marker. Then mark this expedition's todos
completed via TodoWrite so the session list matches the scroll. The scroll markers
are the persistent record; this runs under the same lock as Steps 3–7.

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

## Step 6.6: Maintain Obsidian graph links (if opted in)

If `.ai-context/.obsidian-enabled` exists, ensure every scroll in this quest folder carries
a `related:` frontmatter list — the peer scrolls in the same quest folder plus
`"[[DECISIONS_LOG]]"` and `"[[DANGER_REGISTRY]]"` as quoted, vault-root-relative wikilinks
(e.g. `"[[quests/{quest-name}/TOME_OF_DANGERS]]"`). Add the key to any scroll missing it;
SKIP scrolls that already have `related:` (idempotent). If the marker is absent, do nothing.
This keeps the Obsidian graph connected as scrolls are added (see /setup-obsidian). It is a
scroll-frontmatter edit under the lock — never touches lifecycle.log.

## Step 7: Split check

After every write, count lines in each modified scroll file (index files only for split scrolls).

For each file that exceeds 500 lines:
1. Announce: "📜 {filename} has grown beyond 500 lines. Splitting into subfiles..."
2. Apply SKILL.md -> "Split rules" (split targets + index format), with this
   command-side caveat: the STRATEGY_SCROLL index always keeps the battle status
   table AND the `## Planned Expeditions` checklist (status readers parse the
   checklist from the index only — never strand it in a module subfile).
3. Confirm: "Split complete. {filename} → {list of subfiles created}."

## Step 7.5: Release the per-quest scroll lock

RELEASE the per-quest lock acquired in Step 2.9 (explicit `rmdir`, recomputing the
key from the SAME basename — not from any path changed by a split). This runs on
EVERY exit path: if any Edit in Steps 3–7 failed, release here and STOP rather than
leaving a stranded lock. Steps 8–10 (context.md, lifecycle line, confirm) run after
release.

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

## Step 9: Record the lifecycle transition

Append ONE `state` line to the phase record with a SHELL APPEND (never Edit/Write —
SKILL.md -> "Lifecycle log"):
```bash
printf '%s\n' "{YYYY-MM-DD}|state|{quest-name}|phase=at-camp" >> .claude/quest-xp/lifecycle.log
```
This records "at-camp" in the phase record; the next code edit re-bumps to
"embarked" via the `quest-lifecycle-bump.sh` hook.

## Step 10: Confirm

Report:
```
⛺ Camp made. Expedition {date} recorded.
Files updated: {list}
{any split announcements}
```
