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
2. Read the split rules from `.claude/skills/quest-system/SKILL.md` — section `## Split rules`.
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

## Step 8: Confirm

Report:
```
⛺ Camp made. Expedition {date} recorded.
Files updated: {list}
{any split announcements}
```
