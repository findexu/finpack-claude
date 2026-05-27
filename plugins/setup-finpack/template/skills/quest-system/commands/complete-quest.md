---
description: Mark the active quest as complete. Distills key knowledge into project-level files, archives the quest folder, and clears the active quest.
---

# Complete Quest

A quest is complete when all modules in the battle status are Conquered
and the commander confirms there is no remaining work.

## Step 1: Read active quest

Read `.claude/active-quest.txt`.
Line 1 = quest folder path. Line 2 = realm.

If not found: "No active quest to complete." Stop.

## Step 2: Confirm completion

Read STRATEGY_SCROLL.md battle status table.
Show it to the commander.

Ask: "Are all modules conquered and this quest truly complete? (y/n)"
Stop if n — run /make-camp to record remaining work first.

## Step 3: Distill TOME_OF_DANGERS → DANGER_REGISTRY.md

Read `{quest-folder}/TOME_OF_DANGERS.md` (and all `dangers/` subfiles if split).

Extract every entry from `## Known Dangers` and `## Confirmed Safe Paths`.
Skip entries marked as superseded or resolved.

Append to `docs/dev/DANGER_REGISTRY.md`:
- Create the file from the template in `.claude/skills/quest-system/SKILL.md`
  if it does not exist yet.
- Add each danger to the appropriate category section.
- Set the `Quest` column to the quest name.
- Update `last-updated` in YAML frontmatter.

Do not duplicate entries already in the registry.

## Step 4: Distill STRATEGY_SCROLL → DECISIONS_LOG.md

Read `{quest-folder}/STRATEGY_SCROLL.md` (and all `strategy/` subfiles if split).

Extract every entry from `## Oaths Sworn (Resolved Decisions)`.
Skip entries that are implementation details rather than architectural decisions.

Append to `docs/dev/DECISIONS_LOG.md`:
- Create the file from the template in `.claude/skills/quest-system/SKILL.md`
  if it does not exist yet.
- Add each decision as a row: Decision | Reason | Quest | Date.
- Update `last-updated` in YAML frontmatter.

Do not duplicate decisions already in the log.

## Step 5: Write final journal entry

Append to `{quest-folder}/ADVENTURE_JOURNAL.md`
(or `journal/{current-month}.md` if split):

```
## Quest Complete — {YYYY-MM-DD}
### Summary
{2–4 sentence summary of what was built and how it ended}
### Key Dangers Distilled
{count} dangers added to DANGER_REGISTRY.md
### Key Decisions Distilled
{count} decisions added to DECISIONS_LOG.md
### Realm
{realm}
```

## Step 6: Archive quest folder

Move `{quest-folder}/` → `docs/dev/archived/{quest-name}/`

Create `docs/dev/archived/` if it does not exist.

If an archive with the same name already exists, rename to `{quest-name}-{date}`.

## Step 7: Clear active quest

Delete `.claude/active-quest.txt`.

## Step 8: Update .ai-context/

If `.ai-context/quest.md` exists, overwrite with:
```
# Active Quest
(no active quest — run /new-quest to start one)
```

If `.ai-context/dangers.md` exists, overwrite with:
```
# Known Dangers
(no active quest)

## Project Dangers
{top 5 rows from DANGER_REGISTRY.md if exists, else "(none yet)"}
```

If `.ai-context/decisions.md` exists, overwrite with:
```
# Locked Decisions
(no active quest)

## Project Decisions
{rows from DECISIONS_LOG.md if exists, else "(none yet)"}
```

If `.ai-context/` does not exist, skip silently.

## Step 9: Calculate and award quest EXP

If `.claude/quest-xp/profile.md` does not exist, skip to Step 10.

**Count quest data** (read from scrolls before archive):
- `modules`: number of rows in STRATEGY_SCROLL battle status table
- `expeditions`: number of `## Expedition` entries in ADVENTURE_JOURNAL
- `dangers`: number of rows in TOME_OF_DANGERS Known Dangers table (plus all subfiles if split)
- `oaths`: number of entries in STRATEGY_SCROLL Oaths Sworn section
- `splits`: number of split subfolders present (dangers/, strategy/, journal/, map/)
- `open_riddles`: number of entries in STRATEGY_SCROLL Open Riddles section
- `clean_sweep`: true if `open_riddles` == 0
- `speed_run`: true if `expeditions` <= 3

**EXP formula:**
```
exp = 100
    + (modules    × 25)
    + (expeditions × 10)
    + (dangers    × 15)
    + (oaths      × 20)
    + (splits     × 50)
    + (75 if clean_sweep)
    + (50 if speed_run)
```

Read profile frontmatter from `.claude/quest-xp/profile.md`.
Add `exp` to `total-exp`.
Increment `quests-completed` by 1.

Recalculate level using the level table in `.claude/skills/quest-system/SKILL.md`.
Record old level and new level.

**Check badge unlocks:**
Read current `badges` array.
For each badge in the badge table (SKILL.md `## XP system`), check unlock condition
against updated profile stats. Collect any newly unlocked badges.
Append newly unlocked badge names to the `badges` array.

Write updated values back to YAML frontmatter of `.claude/quest-xp/profile.md`.

**Append to `.claude/quest-xp/quest-history.md`:**
```
## {quest-name} — {date}
EXP earned: {exp}
  Base reward:   100
  Modules:       {modules} × 25 = {modules×25}
  Expeditions:   {expeditions} × 10 = {expeditions×10}
  Dangers:       {dangers} × 15 = {dangers×15}
  Oaths:         {oaths} × 20 = {oaths×20}
  Splits:        {splits} × 50 = {splits×50}
  {if clean_sweep: "Clean sweep bonus: +75"}
  {if speed_run:   "Speed run bonus: +50"}
Total EXP after: {total-exp}  |  Level: {new level}
```

## Step 10: Confirm

```
🏆 Quest complete: {quest-name}
Dangers distilled: {count} → docs/dev/DANGER_REGISTRY.md
Decisions distilled: {count} → docs/dev/DECISIONS_LOG.md
Archived: docs/dev/archived/{quest-name}/
```

If XP was awarded, add:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+{exp} XP  (modules: {modules×25}  expeditions: {expeditions×10}
            dangers: {dangers×15}  oaths: {oaths×20}  splits: {splits×50}
            {bonuses if any})
Total EXP: {total-exp}  |  Level {new-level} — {title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If level-up occurred, display BEFORE the EXP breakdown:
```
╔══════════════════════════════════════════════╗
║  🌟  LEVEL UP!                                ║
║  Level {old} → Level {new}                    ║
║  {new title}                                  ║
╚══════════════════════════════════════════════╝
```

If any new badges unlocked, display AFTER the EXP breakdown:
```
🎖️  Badge unlocked: {badge emoji}  {badge name}
    {unlock condition description}
```
(one line per badge, in order unlocked)

Close with:
```
Run /new-quest to begin the next quest.
Run /quest-xp to view your full profile.
```
