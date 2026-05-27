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

## Step 8: Confirm

```
🏆 Quest complete: {quest-name}
Dangers distilled: {count} → docs/dev/DANGER_REGISTRY.md
Decisions distilled: {count} → docs/dev/DECISIONS_LOG.md
Archived: docs/dev/archived/{quest-name}/

Run /new-quest to begin the next quest.
Run /change-quest to resume a different active quest.
```
