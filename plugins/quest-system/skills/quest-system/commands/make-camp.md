---
description: End a work session. Records expedition results, updates all touched scrolls, updates YAML frontmatter, and splits any scroll that has grown beyond 500 lines.
---

# Make Camp

End the current expedition. Record what was done, update scrolls, check for splits.

## Step 1: Read active quest

Read `.claude/active-quest.txt`.
Line 1 = quest folder path. Line 2 = realm.

If not found: "No active quest. Run /new-quest first." Stop.

## Step 2: Gather expedition results

Ask the commander:
1. What was conquered (completed) this expedition?
2. Any oaths sworn (decisions made and locked)?
3. Anything cursed or uncertain — blockers, unknowns?
4. What is the road ahead for the next expedition?
5. Any new dangers discovered? (added to TOME_OF_DANGERS)
6. Any structural changes to the codebase? (added to WORLD_MAP)

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

## Step 8: Refresh .ai-context/

If `.ai-context/` directory exists, write all three files using data from the scrolls just updated:

**`.ai-context/quest.md`:**
```
# Active Quest: {quest-name}
Realm: {realm}  |  Last updated: {date}

## Battle Status
{battle status table from STRATEGY_SCROLL — updated version}

## Open Riddles
{open riddles from STRATEGY_SCROLL — updated version, or "None"}

## Road Ahead
{this expedition's "The Road Ahead" entry just written to ADVENTURE_JOURNAL}
```

**`.ai-context/dangers.md`:**
```
# Known Dangers
Quest: {quest-name}  |  Last updated: {date}

## Quest Dangers
{fast-read summary from TOME_OF_DANGERS index — top 5, updated if new dangers were added}

## Project Dangers
{top 5 rows from DANGER_REGISTRY.md if exists, else "(none yet — complete a quest first)"}
```

**`.ai-context/decisions.md`:**
```
# Locked Decisions
Quest: {quest-name}  |  Last updated: {date}

## Quest Decisions
{entries from STRATEGY_SCROLL Oaths Sworn section — updated version}

## Project Decisions
{rows from DECISIONS_LOG.md if exists, else "(none yet — complete a quest first)"}
```

If `.ai-context/` does not exist, skip silently.

## Step 9: Award expedition EXP

If `.claude/quest-xp/profile.md` does not exist, skip this step silently.

Calculate EXP earned this expedition:
- Base: 5 XP (completing the expedition)
- +10 XP if any new dangers were reported in Step 2
- +10 XP if any new oaths were reported in Step 2

Read profile frontmatter from `.claude/quest-xp/profile.md`.
Add earned EXP to `total-exp`.
Increment `total-expeditions` by 1.
Add any new dangers count to `total-dangers-mapped`.
Add any new oaths count to `total-oaths-sworn`.
If a split occurred in Step 7, increment `total-splits` by 1.

Recalculate level using this table — find highest level whose threshold ≤ new `total-exp`:

| Level | Title                 | Total EXP needed |
|-------|-----------------------|------------------|
| 1     | Apprentice Coder      | 0                |
| 2     | Journeyman Developer  | 150              |
| 3     | Skilled Developer     | 450              |
| 4     | Senior Developer      | 900              |
| 5     | Expert Architect      | 1500             |
| 6     | Master Builder        | 2250             |
| 7     | Grand Master          | 3150             |
| 8     | Legendary Coder       | 4200             |
| 9     | Mythic Developer      | 5400             |
| 10    | Transcendent Engineer | 6750             |

If new level > old level: record level-up (announce in Step 10).

Write updated values back to the YAML frontmatter of `.claude/quest-xp/profile.md`.

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
